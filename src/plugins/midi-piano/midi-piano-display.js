import { Button } from 'antd';
import StopIcon from './stop-icon.js';
import midiPlayerNs from 'midi-player-js';
import CustomSwitch from './customSwitch.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import React, { useEffect, useRef } from 'react';
import PianoComponent from './piano-component.js';
import { MIDI_COMMANDS } from '../../domain/constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';
import { useMidiLoader, usePianoId, useToneJsSampler, useMidiDevice } from './customHooks.js';

export default function MidiPianoDisplay({ content }) {

  const keys = useRef(null);
  const player = useRef(null);
  const activeNotes = useRef([]);
  const inputIsEnabled = useRef(true);
  const { NOTES } = midiPlayerNs.Constants;
  const { t } = useTranslation('midiPiano');
  const clientConfig = useService(ClientConfig);
  const { sourceType, sourceUrl, midiTrackTitle, noteRange, colors, samplesType } = content;
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  // Custom hooks returning state variables
  const midiData = useMidiLoader(src);
  const pianoId = usePianoId('default');
  const midiDeviceIsConnected = useMidiDevice();
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

  function handleSamplerEvent(eventType, noteName) {

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
    handleSamplerEvent(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
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
      eventType = velocity <= 0 ? 'Note off' : 'Note on';
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

  // Stored in document object
  // Disable MIDI input when called from sibling piano via document object
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
    if (inputIsEnabled.current && midiDeviceIsConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  // Disable MIDI input for sibling pianos when switch is clicked
  const updateMidiInputSwitches = () => {

    if (pianoId === 'default' || !midiDeviceIsConnected || !inputIsEnabled.current) {
      return;
    }

    if (typeof document.midiPianos === 'undefined') {
      document.midiPianos = [];
      document.midiPianoIds = [];
    }

    // Check if midi pianos have been deleted
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
      <div>{t('midiInput')}</div>
    </React.Fragment>
  );

  const renderMidiTrackTitle = () => (
    <div className="MidiPiano-midiTrackTitle">{midiTrackTitle}</div>
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
    };
  });

  return (
    <React.Fragment>
      <PianoComponent
        noteRange={noteRange}
        sampler={sampler}
        samplerHasLoaded={samplerHasLoaded}
        colors={colors}
        pianoId={pianoId}
        keys={keys}
        activeNotes={activeNotes}
        updateActiveNotes={updateActiveNotes}
        updateKeyStyle={updateKeyStyle}
        />
      <div id="MidiPiano-controlsContainer">
        <div style={{ width: '100%' }} />
        <div style={{ width: '100%' }} >
          {!!sourceUrl && renderControls()}
          {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
        </div>
        <div id="MidiPiano-inputSwitch">
          {midiDeviceIsConnected && renderInputSwitch()}
        </div>
      </div>
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
