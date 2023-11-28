import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MediaAnalysisIcon from './media-analysis-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './media-analysis-utils.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class MediaAnalysisInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'media-analysis';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('mediaAnalysis:name');
  }

  getIcon() {
    return <MediaAnalysisIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./media-analysis-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./media-analysis-editor.js')).default;
  }

  getDefaultContent(t) {
    return createDefaultContent(t);
  }

  validateContent(content) {
    validateContent(content);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (!couldAccessUrlFromRoom(redactedContent.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.posterImage.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    if (isInternalSourceType({ url: content.posterImage.sourceUrl })) {
      cdnResources.push(content.posterImage.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaAnalysisInfo;
