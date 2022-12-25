import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import validation from '../../ui/validation.js';
import { pianoLayout } from './piano-component.js';
import ItemPanel from '../../components/item-panel.js';
import { KeyWhite, KeyWhiteWithBlack } from './keys.js';
import { create as createId } from '../../utils/unique-id.js';
import { Form, Input, Radio, Button, Menu, Dropdown } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { CDN_URL_PREFIX, MIDI_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

export default function MidiPianoEditor({ content, onContentChanged }) {

  const [text, setText] = useState();

  const FormItem = Form.Item;
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const keyRangeSelection = useRef([]);
  const { t } = useTranslation('midiPiano');
  const { sourceType, sourceUrl, midiTrackTitle, samplesType } = content;
  const [canRenderSelectorPiano, setCanRenderSelectorPiano] = useState(false);
  const selectorPianoColors = {
    whiteKey: 'white',
    blackKey: 'black'
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl
      = newContent.sourceType === MIDI_SOURCE_TYPE.external
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
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
    document.toneJsSampler = null;
    changeContent({ samplesType: value });
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
      {canRenderSelectorPiano && renderSelectorPiano()}
    </React.Fragment>
  );

  const handler = event => {
    console.log(event.target.value);
    setText(event.target.value);
  };

  return (
    <div className="MidiPianoEditor">

      {renderKeyRangeSelector(toggleSelectorPiano)}

      {renderSamplesTypeInput(samplesType, handleSamplesTypeValueChanged)}

      <ItemPanel header="MIDI">
        {renderMidiTrackTitleInput(midiTrackTitle, handleMidiTrackTitleValueChanged)}

        <Form>
          {renderSourceTypeInput(sourceType, handleSourceTypeValueChanged)}

          {sourceType === MIDI_SOURCE_TYPE.external
            && renderExternalSourceTypeInput(sourceUrl, handleExternalSourceUrlValueChanged)}

          {sourceType === MIDI_SOURCE_TYPE.internal
            && renderInternalSourceTypeInput(sourceUrl, handleInternalSourceUrlValueChanged, handleInternalSourceUrlFileNameChanged)}
        </Form>
      </ItemPanel>

      <ItemPanel header={t('earTraining')}>
        <FormItem label={t('exerciseType')} {...formItemLayout} hasFeedback>
          <Button onClick={() => {}} >. . .</Button>
        </FormItem>
        <NeverScrollingTextArea value={text} onChange={handler} />
      </ItemPanel>

    </div>

  );
}

MidiPianoEditor.propTypes = {
  ...sectionEditorProps
};
