import * as Tone from 'tone';
import { Button } from 'antd';
import StopIcon from './stop-icon.js';
import midiPlayerNs from 'midi-player-js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import PianoComponent from './piano-component.js';
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
  // const pianoId = useRef(createId());
  const [pianoId, setPianoId] = useState('default');
  const player = useRef(null);
  const sampler = useRef(null);
  const activeNotes = useRef([]);
  const midiAccessObj = useRef(null);
  const httpClient = new HttpClient();
  const { NOTES } = midiPlayerNs.Constants;
  const { t } = useTranslation('midiPiano');
  const clientConfig = useService(ClientConfig);
  const [midiData, setMidiData] = useState(null);
  const [samplerHasLoaded, setSamplerHasLoaded] = useState(false);
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

  function handleSamplerEvent(eventType, noteName) {

    switch (eventType) {
      case 'Note on':
        sampler.current.triggerAttack(noteName);
        break;
      case 'Note off':
        sampler.current.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  function updateKeyStyle(eventType, midiValue) {
    const key = keys.current[midiValue];
    if (eventType === 'Note on') {
      key.style.backgroundColor = colors.activeKey;
    }
    if (eventType === 'Note off') {
      key.style.backgroundColor = key.dataset.defaultColor;
    }
  }

  function handleMidiDeviceEvent(message) {
    const midiValue = message.data[1];
    const noteName = getNoteNameFromMidiValue(midiValue);
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const command = message.data[0];
    const eventType = getEventTypeFromMidiCommand(command, velocity);

    handleSamplerEvent(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
  }

  function onMIDISuccess(midiAccess) {
    midiAccessObj.current = midiAccess;
    for (const input of midiAccessObj.current.inputs.values()) {
      input.onmidimessage = handleMidiDeviceEvent;
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
    if (!player.current.isPlaying()) {
      return;
    }
    player.current.pause();
    sampler.current.releaseAll();
  };

  const stopMidiPlayer = () => {
    player.current.stop();
    sampler.current.releaseAll();
  };

  const getData = () => {
    httpClient.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        setMidiData(response.data);
      });
  };

  const renderControls = () => (
    <div className="MidiPiano-midiPlayerControls" >
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<StopIcon />} />
    </div>
  );

  const renderMidiTrackTitle = () => (
    <div className="MidiPiano-midiTrackTitle">{midiTrackTitle}</div>
  );

  useEffect(() => {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    return function cleanup() {
      if (!midiAccessObj.current) {
        return;
      }
      if (player.current !== null && player.current.isPlaying()) {
        stopMidiPlayer();
      }
      for (const input of midiAccessObj.current.inputs.values()) {
        input.onmidimessage = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!src) {
      return;
    }
    getData();
  }, []);

  useEffect(() => {
    if (sampler.current) {
      return;
    }

    sampler.current = new Tone.Sampler({
      urls: {
        'A0': 'A0.mp3',
        'C1': 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        'A1': 'A1.mp3',
        'C2': 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        'A2': 'A2.mp3',
        'C3': 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
        'C5': 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        'A5': 'A5.mp3',
        'C6': 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        'A6': 'A6.mp3',
        'C7': 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        'A7': 'A7.mp3',
        'C8': 'C8.mp3'
      },
      onload: () => {
        setSamplerHasLoaded(true);
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/' // Samples better be hosted in project.
    }).toDestination();
  });

  useEffect(() => {
    const numberChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let id = '';
    do {
      id = createId();
    } while (numberChars.includes(id[0]));
    setPianoId(id);
  }, []);

  useEffect(() => {
    const keyElems = document.querySelectorAll(`#${pianoId} .MidiPiano-key`);
    keys.current = [];
    for (let i = 0; i < keyElems.length; i += 1) {
      const index = parseInt(keyElems[i].dataset.midiValue, 10);
      keys.current[index] = keyElems[i];
    }
  });

  useEffect(() => {
    window.midiPlayer = true;
    console.log(window);
  });

  return (
    <React.Fragment>
      <PianoComponent
        noteRange={noteRange}
        sampler={sampler}
        samplerHasLoaded={samplerHasLoaded}
        colors={colors}
        pianoId={pianoId}
        />
      <div>
        {!!sourceUrl && renderControls()}
        {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
      </div>
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
