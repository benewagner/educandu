import React from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Radio, Button } from 'antd';
import ItemPanel from '../../components/item-panel.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { CDN_URL_PREFIX, MIDI_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

export default function MidiPianoEditor({ content, onContentChanged }) {

  const FormItem = Form.Item;
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const { t } = useTranslation('midiPiano');
  const { sourceType, sourceUrl, midiTrackTitle, samplesType } = content;

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

  const renderKeyRangeSelector = onChangeHandler => (
    <FormItem label={t('pianoKeyRange')} {...formItemLayout} hasFeedback>
      <Button onChange={onChangeHandler} >. . .</Button>
    </FormItem>
  );

  return (
    <div className="MidiPianoEditor">

      {renderKeyRangeSelector()}

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
        <div>Hallo Uli</div>
      </ItemPanel>

    </div>

  );
}

MidiPianoEditor.propTypes = {
  ...sectionEditorProps
};
