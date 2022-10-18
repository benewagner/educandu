import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import AudioDisplay from './audio-waveform-display.js';
import AudioWaveformIcon from './audio-waveform-icon.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';

class AudioInfo {
  static get inject() { return []; }

  static get typeName() { return 'audio-waveform'; }

  constructor() {
    this.type = 'audio-waveform';
  }

  getName(t) {
    return t('audioWaveform:name');
  }

  getIcon() {
    return <AudioWaveformIcon />;
  }

  getDisplayComponent() {
    return AudioDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./audio-waveform-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceType: IMAGE_SOURCE_TYPE.internal,
      sourceUrl: '',
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceType: joi.string().valid(...Object.values(IMAGE_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    if (content.sourceType === IMAGE_SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default AudioInfo;
