import EarTrainingInfo from './ear-training-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('ear-training-info', () => {
  let sut;
  beforeEach(() => {
    sut = new EarTrainingInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible resources', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sourceSound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '67890');
      expect(result).toStrictEqual({
        title: '[Click here]()',
        tests: [
          { sourceSound: { sourceUrl: '', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { sourceUrl: '', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: '', copyrightNotice: '' } }
        ]
      });
    });
    it('leaves accessible resources intact', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sourceSound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '12345');
      expect(result).toStrictEqual({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sourceSound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sourceSound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the title markdown', () => {
      const result = sut.getCdnResources({ title: '[Hyperlink](cdn://media-library/my-file.pdf)', tests: [] });
      expect(result).toStrictEqual(['cdn://media-library/my-file.pdf']);
    });
    it('returns resources from the sound copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: { copyrightNotice: '[Hyperlink](cdn://media-library/my-file.pdf)' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media-library/my-file.pdf']);
    });
    it('returns resources from the questionImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: {}, questionImage: { copyrightNotice: '[Hyperlink](cdn://media-library/my-file.pdf)' }, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media-library/my-file.pdf']);
    });
    it('returns resources from the answerImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: {}, questionImage: {}, answerImage: { copyrightNotice: '[Hyperlink](cdn://media-library/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['cdn://media-library/my-file.pdf']);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: { sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: { sourceUrl: null, copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sourceSound: { sourceUrl: 'cdn://media-library/some-sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media-library/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sourceSound: { sourceUrl: 'cdn://media-library/some-sound-1.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sourceSound: { sourceUrl: 'https://someplace.com/some-sound-2.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sourceSound: { sourceUrl: 'cdn://media-library/some-sound-3.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }
        ]
      });
      expect(result).toEqual(['cdn://media-library/some-sound-1.mp3', 'cdn://media-library/some-sound-3.mp3']);
    });
  });
});
