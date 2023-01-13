import StopIcon from './stop-icon.js';
import midiPlayerNs from 'midi-player-js';
import CustomPiano from './custom-piano.js';
import CustomSwitch from './custom-switch.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import Markdown from '../../components/markdown.js';
import React, { useEffect, useRef, useState } from 'react';
import AbcNotation from '../../components/abc-notation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import { Button, Radio, InputNumber, Slider, Form } from 'antd';
import IterationPanel from '../../components/iteration-panel.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';
import { SAMPLE_TYPES, NOTES, MIDI_COMMANDS, ABC_NOTE_NAMES } from './constants.js';
import { useMidiLoader, usePianoId, useToneJsSampler, useMidiDevice, useExercise } from './custom-hooks.js';

export default function MidiPianoDisplay({ content }) {

  const keys = useRef(null);
  const player = useRef(null);
  const activeNotes = useRef([]);
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const noteDuration = useRef(2000);
  const isExercisePlaying = useRef(false);
  const isMidiInputEnabled = useRef(false);
  const isNoteInputEnabled = useRef(false);
  const { t } = useTranslation('midiPiano');
  const intervalMode = useRef('successive');
  const clientConfig = useService(ClientConfig);
  const [canShowSolution, setCanShowSolution] = useState(false);
  const getNoteNameFromMidiValue = midiValue => NOTES[midiValue];
  const [playExerciseStartIndex, setPlayExerciseStartIndex] = useState(0);
  const { sourceType, sourceUrl, midiTrackTitle, colors, tests } = content;
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  const currentTestIndexRef = useRef(0);
  const currentExerciseIndexRef = useRef(0);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Custom hooks returning state variables
  const midiData = useMidiLoader(src);
  const pianoId = usePianoId('default');
  const isMidiDeviceConnected = useMidiDevice();
  const [sampler, hasSamplerLoaded] = useToneJsSampler(SAMPLE_TYPES.piano);
  const exerciseData = useExercise(content, currentTestIndex, currentExerciseIndex);

  const {
    keyRange,
    exerciseArray,
    indication,
    indicationMidiValue,
    solution
  } = exerciseData;

  const inputAbcNoteNameSequence = useRef([]);
  const [inputAbc, setInputAbc] = useState('');

  /**
   * Using state variables instead of Ref values results in problems with if-check 'Max note input number ...' in inputNote. currentNoteSequence() will actually
   * be previous note sequence which is why max note input number and number of solution notes - 1 will not necessarily match
   */
  const currentTest = () => tests[currentTestIndexRef.current];
  const currentNoteSequence = () => currentTest().customNoteSequences[currentExerciseIndexRef.current];

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

  const tipformatter = value => `${(value / 1000).toFixed(1)}s`;

  // Keeps track of active notes of both midi player and midi device input. Used in handleMouseOver, handleMouseOut, useEffect in custom-piano.js
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

  function playOrStopNote(eventType, noteName) {
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

  const playExercise = async () => {
    if (isExercisePlaying.current) {
      return;
    }
    isExercisePlaying.current = true;

    for (let i = playExerciseStartIndex; i < exerciseArray.length; i += 1) {
      // Check if stop button has been clicked
      if (!isExercisePlaying.current) {
        return;
      }
      sampler.triggerAttackRelease(exerciseArray[i], noteDuration.current / 1000);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => {
        setTimeout(() => {
          res();
        }, noteDuration.current);
      });
    }
    isExercisePlaying.current = false;
  };

  const resetEarTrainingControls = () => {
    setInputAbc('');
    setCanShowSolution(false);
    setPlayExerciseStartIndex(0);
    isExercisePlaying.current = false;
    inputAbcNoteNameSequence.current.length = 0;

    if (currentTest().exerciseType === 'noteSequence'
      && currentTest().isCustomNoteSequence
      && currentTest().customNoteSequences.length - 1 < currentExerciseIndex + 1) {

      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;
      return;
    }
    setCurrentExerciseIndex(prev => prev + 1);
    currentExerciseIndexRef.current += 1;
  };

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
    if (eventType === 'Note off' && midiValue !== indicationMidiValue) {
      key.style.backgroundColor = key.dataset.defaultColor;
    }
    if (eventType === 'toggle') {
      key.style.backgroundColor = key.style.backgroundColor === colors.activeKey ? key.dataset.defaultColor : colors.activeKey;
    }
  };

  // Updates string to be rendered in AbcNotation element
  const updateInputAbc = () => {
    setInputAbc(() => {
      let inputString = '';
      for (const abcNoteName of inputAbcNoteNameSequence.current) {
        inputString += abcNoteName;
      }
      return inputString;
    });
  };

  const inputNote = midiValue => {
    // Don't allow to input more notes than needed. Max note input number is number of solution notes - 1: First note (indication) can not be input or deleted.
    if (inputAbcNoteNameSequence.current.length >= currentNoteSequence().abcNoteNameSequence.length - 1) {
      return;
    }

    const autoAbcNoteName = ABC_NOTE_NAMES[midiValue];
    const solutionAbcNoteName = currentNoteSequence().abcNoteNameSequence[inputAbcNoteNameSequence.current.length + 1];
    const isCorrect = midiValue === currentNoteSequence().midiValueSequence[inputAbcNoteNameSequence.current.length + 1];

    // Make sure same accidental type note is rendered for chromatic notes as in solution
    if (isCorrect) {
      inputAbcNoteNameSequence.current.push(solutionAbcNoteName);
    } else {
      inputAbcNoteNameSequence.current.push(autoAbcNoteName);
    }
    updateInputAbc();
  };

  const deleteNote = () => {
    inputAbcNoteNameSequence.current.pop();
    updateInputAbc();
  };

  function handleMidiDeviceEvent(message) {

    if (!isMidiInputEnabled.current) {
      return;
    }
    const midiValue = message.data[1];
    const noteName = getNoteNameFromMidiValue(midiValue);
    const command = message.data[0];
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const eventType = getEventTypeFromMidiCommand(command, velocity);

    updateActiveNotes(eventType, midiValue);
    playOrStopNote(eventType, noteName);
    updateKeyStyle(eventType, midiValue);

    if (isNoteInputEnabled.current && eventType === 'Note on') {
      inputNote(midiValue);
    }
  }

  function handleMidiPlayerEvent(message) {
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

    playOrStopNote(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
    updateActiveNotes(eventType, midiValue);
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
    isMidiInputEnabled.current = false;
    const switchElem = document.querySelector(`.${pianoId}.MidiPiano-Switch`);
    if (switchElem && switchElem.classList.contains('MidiPiano-SwitchChecked')) {
      switchElem.classList.remove('MidiPiano-SwitchChecked');
    }
    resetAllKeyStyles();
  };

  const updateMidiMessageHandlers = () => {
    if (isMidiInputEnabled.current && isMidiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  // Disables MIDI input for sibling pianos when switch is set true
  const updateMidiInputSwitches = () => {

    if (pianoId === 'default' || !isMidiDeviceConnected || !isMidiInputEnabled.current) {
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
    isMidiInputEnabled.current = isChecked;
    updateActiveNotes('Reset');
    updateMidiMessageHandlers();
    updateMidiInputSwitches();
  };

  const handleTestCardSelected = testIndex => {
    if (currentTestIndex !== testIndex) {
      setCurrentTestIndex(testIndex);
      currentTestIndexRef.current = testIndex;
      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;
      resetEarTrainingControls();
    }
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

  const renderIntervallControls = () => (
    <div style={{ padding: '0.5rem' }}>
      <RadioGroup defaultValue="successive">
        <RadioButton value="successive" onChange={() => { intervalMode.current = 'successive'; }}>{t('successive')}</RadioButton>
        <RadioButton value="simultaneous" onChange={() => { intervalMode.current = 'simultaneous'; }}>{t('simultaneous')}</RadioButton>
      </RadioGroup>
    </div>
  );
  // Rename XXX
  const itemStyle = {
    marginBottom: '0.8rem'
  };

  const renderNoteSequenceControls = () => {

    return (
      <Form.Item label={t('playFromNote')} style={itemStyle}>
        <InputNumber
          value={playExerciseStartIndex + 1}
          min={1}
          max={currentNoteSequence().abcNoteNameSequence.length}
          onChange={value => { setPlayExerciseStartIndex(value - 1); }}
          />
      </Form.Item>
    );
  };

  const renderEarTrainingControls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
      <h4>{`${t(currentTest().exerciseType)} (${currentTest().whiteKeysOnly ? t('whiteKeysOnly') : null})`}</h4>
      <div style={itemStyle}>
        <Button onClick={playExercise} icon={<PlayIcon />} />
        <Button onClick={() => { isExercisePlaying.current = false; }} icon={<StopIcon />} />
      </div>
      <Form>
        <Form.Item label={t('noteDuration')} style={itemStyle}>
          <Slider tipFormatter={tipformatter} defaultValue={2000} min={500} max={4000} step={100} onChange={value => { noteDuration.current = value; }} />
        </Form.Item>
        {currentTest().exerciseType === 'noteSequence' && renderNoteSequenceControls()}
        {currentTest().exerciseType === 'interval' && renderIntervallControls()}
      </Form>
      <div>
        <Button style={{ width: 'fit-content' }} onClick={() => setCanShowSolution(prev => !prev)}>{canShowSolution ? t('hideSolution') : t('showSolution')}</Button>
        <Button style={{ width: 'fit-content' }} onClick={resetEarTrainingControls}>{t('newExercise')}</Button>
      </div>
    </div>
  );

  useEffect(() => {
    updateMidiMessageHandlers();
    updateMidiInputSwitches();
  });

  useEffect(() => {

  });

  useEffect(() => {
    return function cleanUp() {
      if (player.current && hasSamplerLoaded) {
        player.current.stop();
        sampler.releaseAll();
      }
      if (isMidiInputEnabled.current && isMidiDeviceConnected) {
        for (const input of document.midiAccessObj.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  });

  const testCards = tests.map((test, index) => ({ label: (index + 1).toString(), tooltip: t('testNumber', { number: index + 1 }) }));

  return (
    <React.Fragment>
      <h3>
        <Markdown inline>{t('earTraining')}</Markdown>
      </h3>
      {testCards.length > 1 && (
        <div className="EarTrainingDisplay-controlPanel">
          <div>
            <CardSelector
              cards={testCards}
              onCardSelected={handleTestCardSelected}
              selectedCardIndex={currentTestIndex}
              // visitedCardIndices={viewedTestIndices}
              treatSelectedCardAsVisited
              />
          </div>
          {/* <IterationPanel
            itemCount={testCards.length}
            selectedItemIndex={currentTestIndex}
            onNextClick={handleNextTestClick}
            onPreviousClick={handlePreviousTestClick}
            onResetClick={handleResetTestsClick}
            /> */}
        </div>
      )}
      <div style={{ paddingBottom: '1rem' }}>
        {tests[currentTestIndex].exerciseType === 'noteSequence' && (
          <div className="AbcNotation" style={{ display: 'flex' }}>
            <div className="AbcNotation-wrapper u-width-65" style={{ marginLeft: '0', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <CustomSwitch handleSwitchClick={isChecked => { isNoteInputEnabled.current = isChecked; }} />
                <div>{t('noteInput')}</div>
              </div>
              <div style={{ minHeight: '7rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AbcNotation abcCode={`L:1/4 \n K:C ${currentNoteSequence().clef || 'treble'} \n ${indication + inputAbc}`} />
              </div>
              <Button onClick={deleteNote}>{'<-'}</Button>
            </div>
            <div className="AbcNotation-wrapper u-width-65" style={{ position: 'absolute', left: '50%', textAlign: 'left' }}>
              <div>{canShowSolution ? t('solution') : t('firstNote')}</div>
              <div style={{ minHeight: '7rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AbcNotation abcCode={`L:1/4 \n K:C ${currentNoteSequence().clef || 'treble'} \n ${canShowSolution ? solution : indication}`} />
              </div>
            </div>
          </div>
        )}
      </div>
      <CustomPiano
        keyRange={keyRange}
        sampler={sampler}
        hasSamplerLoaded={hasSamplerLoaded}
        colors={colors}
        pianoId={pianoId}
        keys={keys}
        activeNotes={activeNotes}
        updateActiveNotes={updateActiveNotes}
        updateKeyStyle={updateKeyStyle}
        isExercisePlaying={isExercisePlaying}
        isNoteInputEnabled={isNoteInputEnabled}
        test={currentTest()}
        inputNote={inputNote}
        indicationMidiValue={indicationMidiValue}
        />
      <div className="MidiPiano-controlsContainer">
        <div style={{ width: '100%', padding: '1rem 0' }}>
          {!!sourceUrl && <h4>MIDI</h4>}
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
