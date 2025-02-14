import joi from 'joi';
import React from 'react';
import MarkdownIcon from './markdown-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class MarkdownInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'markdown';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('markdown:name');
  }

  getIcon() {
    return <MarkdownIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.mostUsed, PLUGIN_GROUP.textImage];
  }

  async resolveDisplayComponent() {
    return (await import('./markdown-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./markdown-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: '',
      width: 100
    };
  }

  getTextRepresentation(content) {
    return `width: ${content.width}\n\n${content.text}`;
  }

  validateContent(content) {
    const schema = joi.object({
      text: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text);
  }
}

export default MarkdownInfo;
