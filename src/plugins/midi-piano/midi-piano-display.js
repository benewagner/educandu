// import * as Tone from 'tone';
import { Button, Switch } from 'antd';
import StopIcon from './stop-icon.js';
import CustomSwitch from './switch.js';
import midiPlayerNs from 'midi-player-js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import PianoComponent from './piano-component.js';
import { useToneJsSampler } from './customHooks.js';
import { MIDI_COMMANDS } from '../../domain/constants.js';
import { handleApiError } from '../../ui/error-helper.js';
import HttpClient from '../../api-clients/http-client.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { create as createId } from '../../utils/unique-id.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';

const logger = new Logger(import.meta.url);

export default function MidiPianoDisplay({ content }) {

  const keys = useRef(null);
  const player = useRef(null);
  const activeNotes = useRef([]);
  const httpClient = new HttpClient();
  const inputIsEnabled = useRef(false);
  const { NOTES } = midiPlayerNs.Constants;
  const { t } = useTranslation('midiPiano');
  const clientConfig = useService(ClientConfig);
  const [midiData, setMidiData] = useState(null);
  const [pianoId, setPianoId] = useState('default');
  const [samplerHasLoaded, setSamplerHasLoaded] = useState(false);
  const [midiDeviceConnected, setMidiDeviceConnected] = useState(false);
  const { sourceType, sourceUrl, midiTrackTitle, noteRange, colors } = content;
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  const getNoteNameFromMidiValue = midiValue => {
    return NOTES[midiValue];
  };

  const getEventTypeFromMidiCommand = (command, velocity) => {
    switch (command) {
      case MIDI_COMMANDS.noteOn:
        if (velocity > 0) {
          return 'Note on';
        }
        return 'Note off';
      case MIDI_COMMANDS.noteOff:
        return 'Note off';
      default:
        return '';
    }
  };

  const updateActiveNotes = (eventType, midiValue) => {
    const arr = activeNotes.current;
    if (eventType === 'Note on') {
      const index = arr.indexOf(midiValue);
      if (index === -1) {
        arr.push(midiValue);
      }
    }
    if (eventType === 'Note off') {
      const index = arr.indexOf(midiValue);
      if (index !== -1) {
        arr.splice(index, 1);
      }
    }
  };

  function handleSamplerEvent(eventType, noteName) {

    switch (eventType) {
      case 'Note on':
        document.toneJsSampler.triggerAttack(noteName);
        break;
      case 'Note off':
        document.toneJsSampler.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  function updateKeyStyle(eventType, midiValue) {
    const key = keys.current[midiValue];
    if (typeof key === 'undefined') {
      return;
    }
    if (eventType === 'Note on') {
      key.style.backgroundColor = colors.activeKey;
    }
    if (eventType === 'Note off') {
      key.style.backgroundColor = key.dataset.defaultColor;
    }
  }

  function handleMidiDeviceEvent(message) {

    if (!inputIsEnabled.current) {
      return;
    }
    const midiValue = message.data[1];
    const noteName = getNoteNameFromMidiValue(midiValue);
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const command = message.data[0];
    const eventType = getEventTypeFromMidiCommand(command, velocity);

    updateActiveNotes(eventType, midiValue);
    handleSamplerEvent(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
  }

  // Triggers if browser supports MIDI, even when no MIDI device is connected
  function onMIDISuccess(midiAccessObj) {
    if (midiAccessObj.inputs.size > 0) {
      setMidiDeviceConnected(true);
    }
    if (!document.midiAccessObj) {
      document.midiAccessObj = midiAccessObj;
    }
  }

  function onMIDIFailure(error) {
    handleApiError({ error, logger, t });
  }

  function handleMidiPlayerEvent(message) {
    if (message.name !== 'Note on' && message.name !== 'Note off') {
      return;
    }
    const midiValue = message.noteNumber;
    const velocity = message.velocity;
    const noteName = message.noteName;
    let eventType;
    // Refactor
    if (message.name === 'Note on') {
      if (velocity === 0) {
        eventType = 'Note off';
      }
      if (velocity > 0) {
        eventType = 'Note on';
      }
    }
    if (message.name === 'Note off') {
      eventType = 'Note off';
    }

    updateActiveNotes(eventType, midiValue);
    // Rename
    handleSamplerEvent(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
  }

  function instantiatePlayer() {
    if (player.current) {
      return;
    }
    player.current = new midiPlayerNs.Player();
    player.current.on('midiEvent', message => {
      handleMidiPlayerEvent(message);
    });
    player.current.on('endOfFile', () => {
      player.current.stop();
    });
    player.current.loadArrayBuffer(midiData);
  }

  const startMidiPlayer = () => {
    if (player.current === null) {
      instantiatePlayer();
    }
    if (!player.current.isPlaying()) {
      player.current.play();
    }
  };

  const pauseMidiPlayer = () => {
    if (!player.current) {
      return;
    }
    if (!player.current.isPlaying()) {
      return;
    }
    player.current.pause();
    document.toneJsSampler.releaseAll();
  };

  const stopMidiPlayer = () => {
    if (player.current) {
      player.current.stop();
    }
    document.toneJsSampler.releaseAll();
    for (const key of keys.current) {
      if (typeof key !== 'undefined') {
        key.style.backgroundColor = key.dataset.defaultColor;
      }
    }
  };

  const getData = () => {
    console.log('fetching data');
    httpClient.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        setMidiData(response.data);
      });
  };

  // Stored in document object so that midi pianos can disable each other
  const disableInput = id => {
    if (id === pianoId) {
      return;
    }
    inputIsEnabled.current = false;
    const switchElem = document.querySelector(`.${pianoId}.MidiPiano-Switch`);
    if (switchElem && switchElem.classList.contains('MidiPiano-SwitchChecked')) {
      switchElem.classList.remove('MidiPiano-SwitchChecked');
    }
  };

  const updateMidiMessageHandlers = () => {
    if (inputIsEnabled.current && midiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  const updateMidiInputSwitches = () => {

    if (pianoId === 'default' || !midiDeviceConnected || !inputIsEnabled.current) {
      return;
    }

    if (typeof document.midiPianos === 'undefined') {
      document.midiPianos = [];
      document.midiPianoIds = [];
    }
    document.midiPianos = document.midiPianos.filter(item => !!document.querySelector(`#${item[0]}`));
    document.midiPianoIds = [];
    document.midiPianos.forEach(item => {
      document.midiPianoIds.push(item[0]);
    });

    document.midiPianoIds = document.midiPianoIds.filter(item => item !== pianoId);
    document.midiPianos = document.midiPianos.filter(item => item[0] !== pianoId);

    document.midiPianoIds.push(pianoId);
    document.midiPianos.push([pianoId, disableInput]);

    for (let i = 0; i < document.midiPianos.length; i += 1) {
      const midiPiano = document.midiPianos[i];
      midiPiano[1](pianoId);
    }
  };

  const handleSwitchClick = isChecked => {
    if (isChecked) {
      inputIsEnabled.current = true;
    } else {
      inputIsEnabled.current = false;
    }
    updateMidiMessageHandlers();
    updateMidiInputSwitches(pianoId);
  };

  const renderControls = () => (
    <div className="MidiPiano-midiPlayerControls" >
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<StopIcon />} />
    </div>
  );

  const renderInputSwitch = () => (
    <React.Fragment>
      <CustomSwitch handleSwitchClick={handleSwitchClick} pianoId={pianoId} />
      {/* <Switch ref={switchElem} onChange={onChangeHandler} /> */}
      <div>{t('input')}</div>
    </React.Fragment>
  );

  const renderMidiTrackTitle = () => (
    <div className="MidiPiano-midiTrackTitle">{midiTrackTitle}</div>
  );

  // Check for connected MIDI devices
  useEffect(() => {
    if (midiDeviceConnected) {
      return;
    }
    if (typeof document.midiAccessObj !== 'undefined' && document.midiAccessObj.inputs.size > 0) {
      setMidiDeviceConnected(true);
      return;
    }
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  });

  console.log(pianoId);

  // Load MIDI file
  useEffect(() => {
    if (!src) {
      return;
    }
    getData();
  }, [src]);

  // Instantiate Tone.js sampler and store it on document obj to be accessed from different pianos
  useToneJsSampler(samplerHasLoaded, setSamplerHasLoaded);

  // useEffect(() => {
  //   if (document.toneJsSampler) {
  //     if (!samplerHasLoaded) {
  //       setSamplerHasLoaded(true);
  //     }
  //     return;
  //   }
  //   document.toneJsSampler = new Tone.Sampler({
  //     urls: {
  //       'A0': 'A0.mp3',
  //       'C1': 'C1.mp3',
  //       'D#1': 'Ds1.mp3',
  //       'F#1': 'Fs1.mp3',
  //       'A1': 'A1.mp3',
  //       'C2': 'C2.mp3',
  //       'D#2': 'Ds2.mp3',
  //       'F#2': 'Fs2.mp3',
  //       'A2': 'A2.mp3',
  //       'C3': 'C3.mp3',
  //       'D#3': 'Ds3.mp3',
  //       'F#3': 'Fs3.mp3',
  //       'A3': 'A3.mp3',
  //       'C4': 'C4.mp3',
  //       'D#4': 'Ds4.mp3',
  //       'F#4': 'Fs4.mp3',
  //       'A4': 'A4.mp3',
  //       'C5': 'C5.mp3',
  //       'D#5': 'Ds5.mp3',
  //       'F#5': 'Fs5.mp3',
  //       'A5': 'A5.mp3',
  //       'C6': 'C6.mp3',
  //       'D#6': 'Ds6.mp3',
  //       'F#6': 'Fs6.mp3',
  //       'A6': 'A6.mp3',
  //       'C7': 'C7.mp3',
  //       'D#7': 'Ds7.mp3',
  //       'F#7': 'Fs7.mp3',
  //       'A7': 'A7.mp3',
  //       'C8': 'C8.mp3'
  //     },
  //     onload: () => {
  //       setSamplerHasLoaded(true);
  //     },
  //     baseUrl: 'https://tonejs.github.io/audio/salamander/' // Samples better be hosted in project.
  //   }).toDestination();
  // }, [samplerHasLoaded]);

  // PianoId is used as CSS selector and must not start with a number character
  useEffect(() => {
    const numberChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let id = '';
    do {
      id = createId();
    } while (numberChars.includes(id[0]));
    setPianoId(id);
  }, []);

  useEffect(() => {
    updateMidiInputSwitches();
  }, [pianoId, midiDeviceConnected]);

  useEffect(() => {
    return function cleanUp() {
      if (player.current && samplerHasLoaded) {
        player.current.stop();
        document.toneJsSampler.releaseAll();
      }
    };
  });

  return (
    <React.Fragment>
      <PianoComponent
        noteRange={noteRange}
        samplerHasLoaded={samplerHasLoaded}
        colors={colors}
        pianoId={pianoId}
        keys={keys}
        activeNotes={activeNotes}
        updateActiveNotes={updateActiveNotes}
        />
      <div id="MidiPiano-controlsContainer">
        <div style={{ width: '100%' }} />
        <div style={{ width: '100%' }} >
          {!!sourceUrl && renderControls()}
          {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
        </div>
        <div id="MidiPiano-inputSwitch">
          {midiDeviceConnected && renderInputSwitch()}
        </div>
      </div>
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
