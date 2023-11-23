import joi from 'joi';
import React from 'react';
import { TESTS_ORDER } from './constants.js';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import QuickTesterIcon from './quick-tester-icon.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class QuickTesterInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'quick-tester';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('quickTester:name');
  }

  getIcon() {
    return <QuickTesterIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./quick-tester-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./quick-tester-editor.js')).default;
  }

  getDefaultTest() {
    return {
      key: uniqueId.create(),
      question: '',
      answer: ''
    };
  }

  getDefaultContent() {
    return {
      title: '',
      teaser: '',
      tests: [this.getDefaultTest()],
      testsOrder: TESTS_ORDER.given
    };
  }

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      teaser: joi.string().allow('').required(),
      tests: joi.array().items(joi.object({
        key: joi.string().required(),
        question: joi.string().allow('').required(),
        answer: joi.string().allow('').required()
      })).unique('key').required(),
      testsOrder: joi.string().valid(...Object.values(TESTS_ORDER)).required()
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

    redactedContent.teaser = this.gfm.redactCdnResources(
      redactedContent.teaser,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    for (const test of redactedContent.tests) {
      test.question = this.gfm.redactCdnResources(
        test.question,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
      test.answer = this.gfm.redactCdnResources(
        test.answer,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title));
    cdnResources.push(...this.gfm.extractCdnResources(content.teaser));

    for (const test of content.tests) {
      cdnResources.push(...this.gfm.extractCdnResources(test.question));
      cdnResources.push(...this.gfm.extractCdnResources(test.answer));
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default QuickTesterInfo;
