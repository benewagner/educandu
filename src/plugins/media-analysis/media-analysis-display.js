import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import React, { Fragment, useMemo, useRef, useState } from 'react';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MediaAnalysisDisplay({ content }) {
  const multitrackMediaPlayerRef = useRef(null);
  const { t } = useTranslation('mediaAnalysis');
  const clientConfig = useService(ClientConfig);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewingChapterIndex, setViewingChapterIndex] = useState(0);

  const [areTextsExpanded, setAreTextsExpanded] = useState(false);

  const { tracks, volumePresets, chapters, showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const sources = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [tracks, clientConfig]);

  const playerParts = chapters.map(chapter => ({ startPosition: chapter.startPosition }));

  const canRenderMediaPlayer = sources.every(track => track.sourceUrl);

  const combinedCopyrightNotice = tracks.map(track => track.copyrightNotice).filter(text => !!text).join('\n\n');

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleChaptersTextsToggleClick = () => {
    setAreTextsExpanded(prevValue => !prevValue);
  };

  const handleChapterClick = chapterIndex => {
    setViewingChapterIndex(chapterIndex);

    if (isPlaying) {
      multitrackMediaPlayerRef.current.seekToPart(chapterIndex);
    } else {
      multitrackMediaPlayerRef.current.play();
      setTimeout(() => multitrackMediaPlayerRef.current.seekToPart(chapterIndex), 0);
    }
  };

  const handlePlayingPartIndexChange = index => {
    if (index >= 0) {
      setViewingChapterIndex(index);
    }
  };

  const determineChapterWidthInPercentage = chapterIndex => {
    const startPosition = chapters[chapterIndex]?.startPosition || 0;
    const nextStartPosition = chapters[chapterIndex + 1]?.startPosition || 1;
    return (nextStartPosition - startPosition) * 100;
  };

  const renderChapterTitle = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);
    const title = (
      <div
        key={chapter.key}
        className={classNames({
          'MediaAnalysisDisplay-chapterTitle': true,
          'MediaAnalysisDisplay-chapterTitle--interactive': canRenderMediaPlayer
        })}
        style={{
          width: `${widthInPercentage}%`,
          backgroundColor: `${chapter.color}`,
          color: `${getContrastColor(chapter.color)}`
        }}
        onClick={canRenderMediaPlayer ? () => handleChapterClick(index) : null}
        >
        {chapter.title}
      </div>
    );
    return canRenderMediaPlayer
      ? <Tooltip key={chapter.key} title={t('startPlaybackFromHere')}>{title}</Tooltip>
      : title;
  };

  const renderChapterText = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);
    return (
      <div
        key={chapter.key}
        style={{ width: `${widthInPercentage}%` }}
        className="MediaAnalysisDisplay-chapterText"
        >
        <Markdown>{chapter.text}</Markdown>
      </div>
    );
  };

  const renderChapterPointer = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);

    return (
      <Tooltip title={t('chapterPointerTooltip')} placement="bottom">
        <div
          style={{ width: `${widthInPercentage}%` }}
          className={classNames({
            'MediaAnalysisDisplay-chapterPointer': true,
            'is-visible': index === viewingChapterIndex
          })}
          onClick={() => setViewingChapterIndex(index)}
          />
      </Tooltip>
    );
  };

  const renderChapters = () => {
    const chapterTextsAreSet = chapters.some(chapter => chapter.text);

    return (
      <div className="MediaAnalysisDisplay-chapters">
        <div className="MediaAnalysisDisplay-chapterTitles">
          {chapters.map(renderChapterTitle)}
        </div>
        <div className="MediaAnalysisDisplay-chapterPointers">
          {chapters.map(renderChapterPointer)}
        </div>
        {!!chapterTextsAreSet && (
          <Fragment>
            <div className={classNames('MediaAnalysisDisplay-chapterTexts', { 'is-expanded': areTextsExpanded })}>
              {chapters.map(renderChapterText)}
            </div>
            <a onClick={handleChaptersTextsToggleClick} className="MediaAnalysisDisplay-chaptersTextsToggle">
              {areTextsExpanded ? t('common:less') : t('common:more')}
            </a>
          </Fragment>
        )}
      </div>
    );
  };

  return (
    <div className="MediaAnalysisDisplay">
      <div className={`MediaAnalysisDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayer && (
          <Fragment>
            <MultitrackMediaPlayer
              allowFullscreen
              aspectRatio={aspectRatio}
              initialVolume={initialVolume}
              customUnderScreenContent={renderChapters()}
              multitrackMediaPlayerRef={multitrackMediaPlayerRef}
              posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              parts={playerParts}
              showTrackMixer
              showVideo={showVideo}
              sources={sources}
              volumePresets={volumePresets}
              onEnded={handleEnded}
              onPause={handlePause}
              onPlay={handlePlay}
              onPlayingPartIndexChange={handlePlayingPartIndexChange}
              />
            <CopyrightNotice value={combinedCopyrightNotice} />
          </Fragment>
        )}
        {!canRenderMediaPlayer && renderChapters()}
      </div>
    </div>
  );
}

MediaAnalysisDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MediaAnalysisDisplay;
