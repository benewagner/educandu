import joi from 'joi';
import React from 'react';
import { BEHAVIOR, INTENT } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import AnnotationIcon from './annotation-icon.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class AnnotationInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'annotation';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('annotation:name');
  }

  getIcon() {
    return <AnnotationIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.textImage];
  }

  async resolveDisplayComponent() {
    return (await import('./annotation-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./annotation-editor.js')).default;
  }

  getDefaultContent() {
    return {
      title: '',
      text: '',
      behavior: BEHAVIOR.expandable,
      intent: INTENT.neutral,
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      text: joi.string().allow('').required(),
      behavior: joi.string().valid(...Object.values(BEHAVIOR)).required(),
      intent: joi.string().valid(...Object.values(INTENT)).required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.title = this.gfm.redactCdnResources(
      redactedContent.title,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title));
    cdnResources.push(...this.gfm.extractCdnResources(content.text));

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default AnnotationInfo;
