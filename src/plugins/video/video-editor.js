import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Radio, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { CDN_URL_PREFIX, MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function VideoEditor({ content, onContentChanged }) {
  const { t } = useTranslation('video');

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const { sourceType, sourceUrl, copyrightNotice, width, aspectRatio, posterImage } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeChanged = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      copyrightNotice: '',
      posterImage: {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: ''
      }
    });
  };

  const handleSourceUrlValueChange = event => {
    const { value } = event.target;
    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    changeContent({ sourceUrl: value, copyrightNotice: newCopyrightNotice });
  };

  const handleInternalUrlFileNameChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleAspectRatioChange = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleCopyrightNoticeChange = event => {
    const { value } = event.target;
    changeContent({ copyrightNotice: value });
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
      <div className="u-input-and-button">
        <Input
          addonBefore={CDN_URL_PREFIX}
          value={posterImage.sourceUrl}
          onChange={handlePosterImageSourceUrlValueChange}
          />
        <ResourcePicker
          url={storageLocationPathToUrl(posterImage.sourceUrl)}
          onUrlChange={url => handlePosterImageSourceUrlFileNameChange(urlToStorageLocationPath(url))}
          />
      </div>
    </FormItem>
  );

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeChanged}>
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === MEDIA_SOURCE_TYPE.external && (
        <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
          <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
        </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
        <FormItem label={t('common:internalUrl')} {...formItemLayout}>
          <div className="u-input-and-button">
            <Input
              addonBefore={CDN_URL_PREFIX}
              value={sourceUrl}
              onChange={handleSourceUrlValueChange}
              />
            <ResourcePicker
              url={storageLocationPathToUrl(sourceUrl)}
              onUrlChange={url => handleInternalUrlFileNameChange(urlToStorageLocationPath(url))}
              />
          </div>
        </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
          </FormItem>
        )}
        {renderPosterImageFormItem()}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} size="small" onChange={handleAspectRatioChange}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
          <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

VideoEditor.propTypes = {
  ...sectionEditorProps
};

export default VideoEditor;
