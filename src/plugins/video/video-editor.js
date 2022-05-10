import React, { Fragment } from 'react';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

function VideoEditor({ content, onContentChanged }) {
  const { t } = useTranslation('video');
  const clientConfig = useService(ClientConfig);

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const { sourceType, sourceUrl, text, width, aspectRatio, posterImage } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleTypeChanged = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      posterImage: {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: ''
      }
    });
  };

  const handleSourceUrlValueChange = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlFileNameChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleAspectRatioChange = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleCopyrightInfoChange = event => {
    const { value } = event.target;
    changeContent({ text: value });
  };

  const handleWidthChange = newValue => {
    changeContent({ width: newValue });
  };

  const handlePosterImageSourceUrlValueChange = event => {
    const { value } = event.target;
    changeContent({ posterImage: { sourceType: MEDIA_SOURCE_TYPE.internal, sourceUrl: value } });
  };

  const handlePosterImageSourceUrlFileNameChange = value => {
    changeContent({ posterImage: { sourceType: MEDIA_SOURCE_TYPE.internal, sourceUrl: value } });
  };

  const renderPosterImageFormItem = () => (
    <FormItem label={t('posterImageUrl')} {...formItemLayout}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Input
          addonBefore={`${clientConfig.cdnRootUrl}/`}
          value={posterImage.sourceUrl}
          onChange={handlePosterImageSourceUrlValueChange}
          />
        <StorageFilePicker
          fileName={posterImage.sourceUrl}
          onFileNameChanged={handlePosterImageSourceUrlFileNameChange}
          />
      </div>
    </FormItem>
  );

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleTypeChanged}>
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === MEDIA_SOURCE_TYPE.external && (
          <Fragment>
            <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
              <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
            </FormItem>
            {renderPosterImageFormItem()}
          </Fragment>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
          <Fragment>
            <FormItem label={t('common:internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={sourceUrl}
                  onChange={handleSourceUrlValueChange}
                  />
                <StorageFilePicker
                  fileName={sourceUrl}
                  onFileNameChanged={handleInternalUrlFileNameChange}
                  />
              </div>
            </FormItem>
            {renderPosterImageFormItem()}
          </Fragment>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} size="small" onChange={handleAspectRatioChange}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoChange} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

VideoEditor.propTypes = {
  ...sectionEditorProps
};

export default VideoEditor;
