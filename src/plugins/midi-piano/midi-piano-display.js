import { Button } from 'antd';
import StopIcon from './stop-icon.js';
import midiPlayerNs from 'midi-player-js';
import CustomSwitch from './customSwitch.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import React, { useEffect, useRef } from 'react';
import PianoComponent from './piano-component.js';
import { MIDI_COMMANDS } from '../../domain/constants.js';
import AbcNotation from '../../components/abc-notation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';
import { useMidiLoader, usePianoId, useToneJsSampler, useMidiDevice } from './customHooks.js';

export default function MidiPianoDisplay({ content }) {

  const { sourceType,
    sourceUrl,
    midiTrackTitle,
    keyRange,
    colors,
    samplesType } = content;
  const keys = useRef(null);
  const player = useRef(null);
  const activeNotes = useRef([]);
  const inputIsEnabled = useRef(true);
  const { NOTES } = midiPlayerNs.Constants;
  const { t } = useTranslation('midiPiano');
  const clientConfig = useService(ClientConfig);
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  // Custom hooks returning state variables
  const midiData = useMidiLoader(src);
  const pianoId = usePianoId('default');
  const isMidiDeviceConnected = useMidiDevice();
  const [sampler, samplerHasLoaded] = useToneJsSampler(samplesType);

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

  // Keeps track of active notes of both midi player and midi device input by storing and removing midi values.
  const updateActiveNotes = (eventType, midiValue) => {
    const arr = activeNotes.current;
    const index = arr.indexOf(midiValue);
    if (eventType === 'Note on') {
      if (index === -1) {
        arr.push(midiValue);
      }
      return;
    }
    if (eventType === 'Note off') {
      if (index !== -1) {
        arr.splice(index, 1);
      }
      return;
    }
    if (eventType === 'Reset') {
      arr.length = 0;
    }
  };

  function handleMidiPlayerEvent(eventType, noteName) {
    switch (eventType) {
      case 'Note on':
        sampler.triggerAttack(noteName);
        break;
      case 'Note off':
        sampler.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  const resetAllKeyStyles = () => {
    for (const key of keys.current) {
      if (typeof key !== 'undefined') {
        key.style.backgroundColor = key.dataset.defaultColor;
      }
    }
  };

  const updateKeyStyle = (eventType, midiValue) => {
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
  };

  function handleMidiDeviceEvent(message) {

    if (!inputIsEnabled.current) {
      return;
    }
    const midiValue = message.data[1];
    const noteName = getNoteNameFromMidiValue(midiValue);
    const command = message.data[0];
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const eventType = getEventTypeFromMidiCommand(command, velocity);

    updateActiveNotes(eventType, midiValue);
    handleMidiPlayerEvent(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
  }

  function handleMidiPlayerEvent(message) {
    // if (message.name !== 'Note on' && message.name !== 'Note off') {
    //   return;
    // }
    if (!['Note on', 'Note off'].includes(message.name)) {
      return;
    }
    const midiValue = message.noteNumber;
    const velocity = message.velocity;
    const noteName = message.noteName;
    let eventType;
    if (message.name === 'Note on') {
      eventType = velocity <= 0 ? 'Note off' : 'Note on';
    }
    if (message.name === 'Note off') {
      eventType = 'Note off';
    }

    updateActiveNotes(eventType, midiValue);
    handleMidiPlayerEvent(eventType, noteName);
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
      resetAllKeyStyles();
      updateActiveNotes('Reset');
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
    sampler.releaseAll();
  };

  const stopMidiPlayer = () => {
    if (player.current) {
      player.current.stop();
    }
    sampler.releaseAll();
    resetAllKeyStyles();
    updateActiveNotes('Reset');
  };

  // Stored in browser document object to be called from sibling pianos.
  // Disables MIDI device input when sibling piano input switch is set true.
  const disableInput = id => {
    if (id === pianoId) {
      return;
    }
    inputIsEnabled.current = false;
    const switchElem = document.querySelector(`.${pianoId}.MidiPiano-Switch`);
    if (switchElem && switchElem.classList.contains('MidiPiano-SwitchChecked')) {
      switchElem.classList.remove('MidiPiano-SwitchChecked');
    }
    resetAllKeyStyles();
  };

  const updateMidiMessageHandlers = () => {
    if (inputIsEnabled.current && isMidiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  // Disables MIDI input for sibling pianos when switch is set true.
  const updateMidiInputSwitches = () => {

    if (pianoId === 'default' || !isMidiDeviceConnected || !inputIsEnabled.current) {
      return;
    }

    if (typeof document.midiPianos === 'undefined') {
      document.midiPianos = [];
      document.midiPianoIds = [];
    }

    // Checks if midi pianos have been deleted.
    document.midiPianos = document.midiPianos.filter(piano => !!document.querySelector(`#${piano.id}`));
    document.midiPianoIds = [];
    document.midiPianos.forEach(piano => {
      document.midiPianoIds.push(piano.id);
    });

    document.midiPianoIds = document.midiPianoIds.filter(id => id !== pianoId);
    document.midiPianos = document.midiPianos.filter(piano => piano.id !== pianoId);

    document.midiPianoIds.push(pianoId);
    document.midiPianos.push({
      id: pianoId,
      disableInput
    });

    for (let i = 0; i < document.midiPianos.length; i += 1) {
      const midiPiano = document.midiPianos[i];
      midiPiano.disableInput(pianoId);
    }
  };

  const handleSwitchClick = isChecked => {
    inputIsEnabled.current = isChecked;
    updateActiveNotes('Reset');
    updateMidiMessageHandlers();
    updateMidiInputSwitches();
  };

  const renderMidiPlayerControls = () => (
    <div className="MidiPiano-midiPlayerControls" >
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<StopIcon />} />
    </div>
  );

  const renderInputSwitch = () => (
    <React.Fragment>
      <CustomSwitch handleSwitchClick={handleSwitchClick} pianoId={pianoId} />
      <div>{t('midiInput')}</div>
    </React.Fragment>
  );

  const renderMidiTrackTitle = () => (
    <div className="MidiPiano-midiTrackTitle">{midiTrackTitle}</div>
  );

  const renderEarTrainingControls = () => (
    <Button>Hallo</Button>
  );

  useEffect(() => {
    updateMidiInputSwitches();
  });

  useEffect(() => {
    return function cleanUp() {
      if (player.current && samplerHasLoaded) {
        player.current.stop();
        sampler.releaseAll();
      }
      if (inputIsEnabled.current && isMidiDeviceConnected) {
        for (const input of document.midiAccessObj.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  });

  return (
    <React.Fragment>
      <div style={{ paddingBottom: '1rem' }}>
        <div className="AbcNotation">
          <div className="AbcNotation-wrapper u-width-70">
            <AbcNotation abcCode={'L:1/4 \n gfedcdefgc||"Lösung"g"X"fe"X"dcdefgc'} />
          </div>
        </div>
      </div>
      <PianoComponent
        keyRange={keyRange}
        sampler={sampler}
        samplerHasLoaded={samplerHasLoaded}
        colors={colors}
        pianoId={pianoId}
        keys={keys}
        activeNotes={activeNotes}
        updateActiveNotes={updateActiveNotes}
        updateKeyStyle={updateKeyStyle}
        />
      <div className="MidiPiano-controlsContainer">
        <div style={{ width: '100%' }}>
          {!!sourceUrl && renderMidiPlayerControls()}
          {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
        </div>
        <div className="MidiPiano-earTrainingControls" style={{ width: '100%' }} >
          {renderEarTrainingControls()}
        </div>
        <div className="MidiPiano-inputSwitch">
          {!!isMidiDeviceConnected && renderInputSwitch()}
        </div>
      </div>
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
