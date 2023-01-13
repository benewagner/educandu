/* eslint-disable max-lines */
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import validation from '../../ui/validation.js';
import { pianoLayout } from './custom-piano.js';
import { INTERVAL_NAMES } from './constants.js';
import MidiPianoInfo from './midi-piano-info.js';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import { KeyWhite, KeyWhiteWithBlack } from './keys.js';
import AbcNotation from '../../components/abc-notation.js';
import { analyseABC, filterAbcString } from './abc-utils.js';
import { create as createId } from '../../utils/unique-id.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import { Form, Input, Radio, Button, Slider, Checkbox, Divider } from 'antd';
import { CDN_URL_PREFIX, MIDI_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

export default function MidiPianoEditor({ content, onContentChanged }) {

  const FormItem = Form.Item;
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const keyRangeSelection = useRef([]);
  const abcHasBeenInput = useRef(false);
  const { t } = useTranslation('midiPiano');
  const midiPianoInfo = useService(MidiPianoInfo);
  const selectorPianoColors = { whiteKey: 'white', blackKey: 'black' };
  const [canRenderSelectorPiano, setCanRenderSelectorPiano] = useState(false);
  const { tests, sourceUrl, sourceType, samplesType, midiTrackTitle } = content;

  const tipformatter = value => {
    const tooltips = {
      1: t('noteB'),
      2: 'C',
      3: 'D',
      4: 'E',
      5: 'F',
      6: 'G',
      0: 'A'
    };
    return tooltips[value % 7];
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const getCheckboxStateAndNewTests = event => {
    const checkedState = event.target.checked;
    const newTests = cloneDeep(tests);
    return [checkedState, newTests];
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl
      = newContent.sourceType === MIDI_SOURCE_TYPE.external
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleMoveTestUp = index => {
    const newTests = swapItemsAt(tests, index, index - 1);
    changeContent({ tests: newTests });
  };

  const handleMoveTestDown = index => {
    const newTests = swapItemsAt(tests, index, index + 1);
    changeContent({ tests: newTests });
  };

  const handleDeleteNoteSequence = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = removeItemAt(tests[testIndex].customNoteSequences, index);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleMoveNoteSequenceUp = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = swapItemsAt(tests[testIndex].customNoteSequences, index, index - 1);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleMoveNoteSequenceDown = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = swapItemsAt(tests[testIndex].customNoteSequences, index, index + 1);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleAddTestButtonClick = () => {
    const newTests = cloneDeep(tests);
    newTests.push(midiPianoInfo.getDefaultTest());
    changeContent({ tests: newTests });
  };

  const handleIntervalCheckboxStateChanged = (event, testType, checkboxStates, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const checkbox = event.target;
    const interval = checkbox.interval;
    const intervalType = checkbox.intervalType;
    const newCheckboxStates = cloneDeep(checkboxStates);

    const updateAllCheckboxStates = intervalSelector => {
      if (typeof newCheckboxStates[intervalSelector].minor === 'undefined') {
        newCheckboxStates[intervalSelector] = checkedState;
      } else {
        newCheckboxStates[intervalSelector].minor = checkedState;
        newCheckboxStates[intervalSelector].major = checkedState;
      }
    };

    const updateCheckboxStates = intervalSelector => {
      if (typeof newCheckboxStates[intervalSelector].minor === 'undefined') {
        newCheckboxStates[intervalSelector] = checkedState;
      }
      if (typeof newCheckboxStates[intervalSelector].minor !== 'undefined' && !!intervalType) {
        newCheckboxStates[intervalSelector][intervalType] = checkedState;
      }
      if (typeof newCheckboxStates[intervalSelector].minor !== 'undefined' && !intervalType) {
        newCheckboxStates[intervalSelector].minor = checkedState;
        newCheckboxStates[intervalSelector].major = checkedState;
      }
    };

    if (!checkedState) {
      newCheckboxStates.all = false;
    }

    if (checkbox.interval === 'all') {
      Object.keys(newCheckboxStates).forEach(key => {
        updateAllCheckboxStates(key);
      });
    } else {
      updateCheckboxStates(interval);
    }

    newTests[index][`${testType}CheckboxStates`] = newCheckboxStates;
    changeContent({ tests: newTests });
  };

  const handleDirectionCheckboxStateChanged = (event, direction, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const otherDirection = direction === 'up' ? 'down' : 'up';
    newTests[index].directionCheckboxStates[direction] = checkedState;
    if (!checkedState) {
      newTests[index].directionCheckboxStates[otherDirection] = !checkedState;
    }
    changeContent({ tests: newTests });
  };

  const handleTriadCheckboxStateChanged = (event, index, triad) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].triadCheckboxStates[triad] = checkedState;
    changeContent({ tests: newTests });
  };

  const handleSeventhChordCheckboxStateChanged = (event, index, chord) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].seventhChordCheckboxStates[chord] = checkedState;
    changeContent({ tests: newTests });
  };

  const handleInversionCheckboxStateChanged = (event, index, inversion) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].inversionCheckboxStates[inversion] = checkedState;
    changeContent({ tests: newTests });
  };

  const handleKeyRangeChanged = () => {
    const keyRangeValues = keyRangeSelection.current.sort((a, b) => {
      return a - b;
    });
    const keyRange = {
      first: keyRangeValues[0],
      last: keyRangeValues[keyRangeValues.length - 1]
    };
    setCanRenderSelectorPiano(!canRenderSelectorPiano);
    changeContent({ keyRange });
  };

  const handleWhiteKeysCheckboxStateChanged = (event, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].whiteKeysOnly = checkedState;
    changeContent({ tests: newTests });
  };

  const handleNoteRangeChanged = (event, index) => {
    const newTests = cloneDeep(tests);
    newTests[index].noteRange = { first: event[0], last: event[1] };
    changeContent({ tests: newTests });
  };

  const handleCustomNoteSequenceNoteRangeChanged = (event, testIndex, index) => {
    const newTests = cloneDeep(tests);
    newTests[testIndex].customNoteSequences[index].noteRange = { first: event[0], last: event[1] };
    changeContent({ tests: newTests });
  };

  const updateKeyRangeSelection = event => {
    event.target.classList.toggle('MidiPiano-keySelected');
    const value = parseInt(event.target.dataset.index, 10);
    if (!keyRangeSelection.current.includes(value)) {
      keyRangeSelection.current.push(value);
      return;
    }
    const index = keyRangeSelection.current.indexOf(value);
    keyRangeSelection.current.splice(index, 1);
  };

  const handleSourceTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '' });
  };

  const handleSamplesTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ samplesType: value });
  };

  const handleExerciseTypeValueChanged = (event, index) => {
    const value = event.target.value;
    const newTests = cloneDeep(tests);
    newTests[index].exerciseType = value;
    changeContent({ tests: newTests });
  };

  const handleExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalSourceUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value });
  };

  const handleMidiTrackTitleValueChanged = event => {
    const { value } = event.target;
    changeContent({ midiTrackTitle: value });
  };

  const handleNumberOfNotesValueChanged = (event, index) => {
    const value = event;
    const newTests = cloneDeep(tests);
    newTests[index].numberOfNotes = value;
    changeContent({ tests: newTests });
  };

  const handleNoteSequenceTypeChanged = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].isCustomNoteSequence = value;
    changeContent({ tests: newTests });
  };

  const handleCurrentAbcCodeChanged = (event, testIndex, noteSequenceIndex) => {
    const { value } = event.target;
    const [abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc] = analyseABC(value);
    const newCustomNoteSequences = tests[testIndex].customNoteSequences.map((nS, i) => i === noteSequenceIndex
      ? { ...nS,
        abc: value,
        abcNoteNameSequence,
        midiNoteNameSequence,
        midiValueSequence,
        filteredAbc }
      : nS);
    const newTests = tests.map((test, i) => i === testIndex ? { ...test, customNoteSequences: newCustomNoteSequences } : test);
    abcHasBeenInput.current = true;
    changeContent({ tests: newTests });
  };

  const handleClefTypeChanged = (event, testIndex, noteSequenceIndex) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[testIndex].customNoteSequences[noteSequenceIndex].clef = value;
    changeContent({ tests: newTests });
  };

  const handleAddCustomNoteSequenceButtonClick = index => {
    const newTests = cloneDeep(tests);
    newTests[index].customNoteSequences.push(midiPianoInfo.getDefaultCustomNoteSequence());
    changeContent({ tests: newTests });
  };

  const toggleSelectorPiano = () => {
    setCanRenderSelectorPiano(!canRenderSelectorPiano);
  };

  const renderSamplesTypeInput = (value, onChangeHandler) => (
    <FormItem label="Samples" {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value="piano">{t('piano')}</RadioButton>
        <RadioButton value="harpsichord">{t('harpsichord')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:source')} {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value={MIDI_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
        <RadioButton value={MIDI_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderInternalSourceTypeInput = (value, onInputChangeHandler, onFileChangeHandler) => (
    <FormItem label={t('common:internalUrl')} {...formItemLayout}>
      <div className="u-input-and-button">
        <Input
          addonBefore={CDN_URL_PREFIX}
          value={value}
          onChange={onInputChangeHandler}
          />
        <ResourcePicker
          url={storageLocationPathToUrl(value)}
          onUrlChange={url => onFileChangeHandler(urlToStorageLocationPath(url))}
          />
      </div>
    </FormItem>
  );

  const renderExternalSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderMidiTrackTitleInput = (value, onChangeHandler) => (
    <FormItem label={t('common:title')} {...formItemLayout} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderSelectorPiano = () => (
    <div id="MidiPiano-XXX1">
      <div id="MidiPiano-XXX2">
        <div>
          {t('keyRangeSelectionText')}
        </div>
        <div id="MidiPiano-selectorPianoWrapper">
          {pianoLayout.map((elem, index) => {
            if (elem[0] === 0 && index < pianoLayout.length - 1) {
              return <KeyWhiteWithBlack updateKeyRangeSelection={updateKeyRangeSelection} key={createId()} index={index} colors={selectorPianoColors} />;
            }
            return <KeyWhite updateKeyRangeSelection={updateKeyRangeSelection} key={createId()} index={index} colors={selectorPianoColors} />;
          })}
        </div>
        <div>
          <Button onClick={handleKeyRangeChanged}>{t('common:confirm')}</Button>
        </div>
      </div>
    </div>
  );

  const renderKeyRangeSelector = onClickHandler => (
    <React.Fragment>
      <FormItem label={t('pianoKeyRange')} {...formItemLayout} hasFeedback>
        <Button onClick={onClickHandler} >. . .</Button>
      </FormItem>
      {!!canRenderSelectorPiano && renderSelectorPiano()}
    </React.Fragment>
  );

  const renderWhiteKeysCheckbox = index => (
    <Checkbox
      defaultChecked={tests[index].whiteKeysOnly}
      onChange={event => handleWhiteKeysCheckboxStateChanged(event, index)}
      >
      {t('whiteKeysOnly')}
    </Checkbox>
  );

  const renderNoteRangeSelector = (testIndex, onAfterChangeHandler, noteRange, index) => (
    <FormItem label={t('noteRange')} {...formItemLayout} hasFeedback>
      <Slider
        min={0}
        max={51}
        defaultValue={[noteRange.first, noteRange.last]}
        onAfterChange={event => onAfterChangeHandler(event, testIndex, index)}
        range
        tipFormatter={tipformatter}
        marks={{ 2: t('c1'), 9: t('c2'), 16: t('c3'), 23: t('c4'), 30: t('c5'), 37: t('c6'), 44: t('c7'), 51: t('c8') }}
        />
      {tests[testIndex].exerciseType === 'noteSequence' && !tests[testIndex].isCustomNoteSequence && renderWhiteKeysCheckbox(testIndex)}
    </FormItem>
  );

  const renderIntervalSelector = (checkboxStates, testType, testIndex) => (
    <React.Fragment>
      <FormItem label={t('intervals')} {...formItemLayout} hasFeedback>
        <div>
          <Checkbox
            defaultChecked={checkboxStates.all}
            testType={testType}
            interval="all"
            onChange={event => handleIntervalCheckboxStateChanged(event, testType, checkboxStates, testIndex)}
            >{t('all')}
          </Checkbox>
        </div>
        {INTERVAL_NAMES.map((interval, index) => {
          return (
            <div key={createId()}>
              <Checkbox
                defaultChecked={checkboxStates[interval] === true || checkboxStates[interval].minor || checkboxStates[interval].major}
                style={{ minWidth: '6rem' }}
                interval={interval}
                testType={testType}
                onChange={event => handleIntervalCheckboxStateChanged(event, testType, checkboxStates, testIndex)}
                >
                {t(interval)}
              </Checkbox>
              {[1, 2, 6, 7].includes(index) && !tests[testIndex].whiteKeysOnly && (
                <React.Fragment>
                  <Checkbox
                    defaultChecked={checkboxStates[interval].minor}
                    interval={interval}
                    intervalType="minor"
                    testType={testType}
                    onChange={event => handleIntervalCheckboxStateChanged(event, testType, checkboxStates, testIndex)}
                    >
                    {t('minor')}
                  </Checkbox>
                  <Checkbox
                    defaultChecked={checkboxStates[interval].major}
                    interval={interval}
                    intervalType="major"
                    testType={testType}
                    onChange={event => handleIntervalCheckboxStateChanged(event, testType, checkboxStates, testIndex)}
                    >{t('major')}
                  </Checkbox>
                </React.Fragment>
              )}
            </div>
          );
        })}
      </FormItem>
      {testType === 'interval' && (
        <FormItem label={t('direction')} {...formItemLayout}>
          <Checkbox
            defaultChecked={tests[testIndex].directionCheckboxStates.up}
            onChange={event => handleDirectionCheckboxStateChanged(event, 'up', testIndex)}
            >
            {t('upwards')}
          </Checkbox>
          <Checkbox
            defaultChecked={tests[testIndex].directionCheckboxStates.down}
            onChange={event => handleDirectionCheckboxStateChanged(event, 'down', testIndex)}
            >
            {t('downwards')}
          </Checkbox>
        </FormItem>
      )}
    </React.Fragment>
  );

  const renderChordSelector = index => {
    const triads = ['majorTriad', 'minorTriad', 'diminished', 'augmented'];
    const seventhChords = ['majorTriadMinorSeventh', 'majorTriadMajorSeventh', 'minorTriadMinorSeventh', 'minorTriadMajorSeventh', 'halfDiminished', 'diminishedSeventh'];
    const inversions = ['fundamental', 'firstInversion', 'secondInversion', 'thirdInversion'];

    return (
      <React.Fragment>
        <FormItem label={t('triads')} {...formItemLayout} hasFeedback>
          <div>
            {triads.map(triad => (
              <Checkbox
                key={createId()}
                defaultChecked={tests[index].triadCheckboxStates[triad]}
                onChange={event => handleTriadCheckboxStateChanged(event, index, triad)}
                >
                {t(triad)}
              </Checkbox>
            ))}
          </div>
        </FormItem>
        <FormItem label={t('seventhChords')} {...formItemLayout} hasFeedback>
          {seventhChords.map(chord => (
            <div key={createId()}>
              <Checkbox
                key={createId()}
                defaultChecked={tests[index].seventhChordCheckboxStates[chord]}
                onChange={event => handleSeventhChordCheckboxStateChanged(event, index, chord)}
                >
                {t(chord)}
              </Checkbox>
            </div>
          ))}
        </FormItem>
        <FormItem label={t('inversions')} {...formItemLayout} hasFeedback>
          <div>
            {inversions.map(inversion => (
              <Checkbox
                key={createId()}
                defaultChecked={tests[index].inversionCheckboxStates[inversion]}
                onChange={event => handleInversionCheckboxStateChanged(event, index, inversion)}
                >
                {t(inversion)}
              </Checkbox>
            ))}
          </div>
        </FormItem>
      </React.Fragment>
    );
  };

  const renderNoteSequenceTypeSelector = index => (
    <FormItem label={t('type')} {...formItemLayout}>
      <RadioGroup value={tests[index].isCustomNoteSequence}>
        <RadioButton value={false} onChange={event => handleNoteSequenceTypeChanged(event, index)}>{t('random')}</RadioButton>
        <RadioButton value onChange={event => handleNoteSequenceTypeChanged(event, index)}>{t('predefined')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderAbcInput = (noteSequence, testIndex, index) => {
    const { abc, clef } = noteSequence;
    return (
      <React.Fragment>
        <FormItem label={t('clef')} {...formItemLayout}>
          <RadioGroup value={clef}>
            <RadioButton value="treble" onChange={event => handleClefTypeChanged(event, testIndex, index)}>{t('trebleClef')}</RadioButton>
            <RadioButton value="bass" onChange={event => handleClefTypeChanged(event, testIndex, index)}>{t('bassClef')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('preview')} {...formItemLayout} hasFeedback>
          <AbcNotation abcCode={`L:1/4 \n K:C ${clef} \n ${filterAbcString(abc)}`} />
        </FormItem>
        <FormItem label={t('abcCode')} {...formItemLayout} hasFeedback>
          <Input defaultValue={abc} onBlur={event => handleCurrentAbcCodeChanged(event, testIndex, index)} />
        </FormItem>
      </React.Fragment>
    );
  };

  const renderCustomNoteSequencePanels = testIndex => {
    return tests[testIndex].customNoteSequences.map((noteSequence, index) => (
      <ItemPanel
        index={index}
        key={createId()}
        itemsCount={tests[testIndex].customNoteSequences.length}
        header={t('noteSequenceNumber', { number: index + 1 })}
        onMoveUp={() => handleMoveNoteSequenceUp(testIndex, index)}
        onMoveDown={() => handleMoveNoteSequenceDown(testIndex, index)}
        onDelete={() => handleDeleteNoteSequence(testIndex, index)}
        >
        {renderNoteRangeSelector(testIndex, handleCustomNoteSequenceNoteRangeChanged, tests[testIndex].customNoteSequences[index].noteRange, index)}
        {renderAbcInput(noteSequence, testIndex, index)}
      </ItemPanel>
    ));
  };

  const renderNoteSequenceSelector = (numberOfNotes, index) => {
    return (
      <React.Fragment>
        {!tests[index].isCustomNoteSequence && (
          <FormItem label={t('numberOfNotes')} {...formItemLayout} hasFeedback>
            <Slider
              min={3}
              max={10}
              defaultValue={numberOfNotes}
              onAfterChange={event => handleNumberOfNotesValueChanged(event, index)}
              dots
              marks={{ 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' }}
              />
          </FormItem>
        )}
        {!tests[index].isCustomNoteSequence && renderIntervalSelector(tests[index].noteSequenceCheckboxStates, 'noteSequence', index)}
        {!!tests[index].isCustomNoteSequence && renderCustomNoteSequencePanels(index)}
        {!!tests[index].isCustomNoteSequence
        && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddCustomNoteSequenceButtonClick(index)}>
            {t('addCustomNoteSequence')}
          </Button>
        )}
      </React.Fragment>
    );
  };

  // Test durchreichen statt index? Da wo read-only XXX
  // Wo nur event übergeben werden muss, reicht Variable als Callback, muss nicht ausgeführt werden. XXX
  // constants.js für Sachen in defaultContent und so... XXX

  return (
    <div className="MidiPianoEditor">
      <Form>
        {renderKeyRangeSelector(toggleSelectorPiano)}
        {renderSamplesTypeInput(samplesType, handleSamplesTypeValueChanged)}
        <Divider>MIDI</Divider>
        {renderMidiTrackTitleInput(midiTrackTitle, handleMidiTrackTitleValueChanged)}
        {renderSourceTypeInput(sourceType, handleSourceTypeValueChanged)}
        {sourceType === MIDI_SOURCE_TYPE.external
          && renderExternalSourceTypeInput(sourceUrl, handleExternalSourceUrlValueChanged)}
        {sourceType === MIDI_SOURCE_TYPE.internal
          && renderInternalSourceTypeInput(sourceUrl, handleInternalSourceUrlValueChanged, handleInternalSourceUrlFileNameChanged)}
        <Divider plain>{t('earTraining')}</Divider>
        {
          tests.map((test, index) => (
            <ItemPanel
              index={index}
              key={createId()}
              itemsCount={tests.length}
              header={t('testNumber', { number: index + 1 })}
              onMoveUp={handleMoveTestUp}
              onMoveDown={handleMoveTestDown}
              onDelete={handleDeleteTest}
              >
              <FormItem label={t('exerciseType')} {...formItemLayout} hasFeedback>
                <RadioGroup onChange={event => handleExerciseTypeValueChanged(event, index)} value={test.exerciseType}>
                  <RadioButton value="interval">{t('interval')}</RadioButton>
                  <RadioButton value="chord">{t('chord')}</RadioButton>
                  <RadioButton value="noteSequence">{t('noteSequence')}</RadioButton>
                </RadioGroup>
              </FormItem>
              {test.exerciseType === 'noteSequence' && renderNoteSequenceTypeSelector(index)}
              {(['interval', 'chord'].includes(test.exerciseType)
                || (test.exerciseType === 'noteSequence'
                && !test.isCustomNoteSequence))
                && renderNoteRangeSelector(index, handleNoteRangeChanged, tests[index].noteRange)}
              {test.exerciseType === 'interval' && renderIntervalSelector(test.intervalCheckboxStates, 'interval', index)}
              {test.exerciseType === 'chord' && renderChordSelector(index)}
              {test.exerciseType === 'noteSequence' && renderNoteSequenceSelector(test.numberOfNotes, index)}
            </ItemPanel>
          ))
        }
      </Form>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTestButtonClick}>
        {t('earTraining:addTest')}
      </Button>
    </div>
  );
}

MidiPianoEditor.propTypes = {
  ...sectionEditorProps
};
