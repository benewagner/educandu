import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MusicXmlViewerIcon from './music-xml-viewer-icon.js';
import MusicXmlViewerDisplay from './music-xml-viewer-display.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import { DEFAULT_ZOOM_VALUE, MAX_ZOOM_VALUE, MIN_ZOOM_VALUE } from './constants.js';

class MusicXmlViewerInfo {
  static get typeName() { return 'music-xml-viewer'; }

  constructor() {
    this.type = 'music-xml-viewer';
  }

  getName(t) {
    return t('musicXmlViewer:name');
  }

  getIcon() {
    return <MusicXmlViewerIcon />;
  }

  getDisplayComponent() {
    return MusicXmlViewerDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./music-xml-viewer-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      zoom: DEFAULT_ZOOM_VALUE,
      width: 100,
      caption: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      zoom: joi.number().min(MIN_ZOOM_VALUE).max(MAX_ZOOM_VALUE).required(),
      width: joi.number().min(0).max(100).required(),
      caption: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (!isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return isInternalSourceType({ url: content.sourceUrl }) ? [content.sourceUrl] : [];
  }
}

export default MusicXmlViewerInfo;
