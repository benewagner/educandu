import Plyr from 'plyr';
import PropTypes from 'prop-types';
import { useService } from '../container-context.js';
import { PlayCircleTwoTone } from '@ant-design/icons';
import HttpClient from '../../api-clients/http-client.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { memoAndTransformProps } from '../../ui/react-helper.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { useOnComponentUnmount, useStableCallback } from '../../ui/hooks.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

function Htlm5Player({
  aspectRatio,
  audioOnly,
  clickToPlay,
  fullscreenContainerId,
  playbackRange,
  playbackRate,
  playerRef,
  preload,
  posterImageUrl,
  sourceUrl,
  volume,
  onDuration,
  onEnded,
  onEnterFullscreen,
  onExitFullscreen,
  onPause,
  onPlay,
  onProgress,
  onReady
}) {
  const plyrRef = useRef(null);
  const progressInterval = useRef(null);
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);

  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadedSourceUrl, setLoadedSourceUrl] = useState(null);
  const [sourceDurationInMs, setSourceDurationInMs] = useState(0);
  const [lastLoadingSourceUrl, setLastLoadingSourceUrl] = useState(null);
  const [wasPlayTriggeredOnce, setWasPlayTriggeredOnce] = useState(false);

  const playbackRangeInMs = useMemo(() => [
    playbackRange[0] * sourceDurationInMs,
    playbackRange[1] * sourceDurationInMs
  ], [playbackRange, sourceDurationInMs]);

  const triggerPlay = useCallback(() => {
    if (player) {
      setWasPlayTriggeredOnce(true);
      const currentActualTimeInMs = player.currentTime * 1000;

      const isCurrentTimeOutsideRange
        = (!!playbackRangeInMs[0] && currentActualTimeInMs < playbackRangeInMs[0])
        || (!!playbackRangeInMs[1] && currentActualTimeInMs >= playbackRangeInMs[1]);

      if (isCurrentTimeOutsideRange) {
        player.currentTime = playbackRangeInMs[0] / 1000;
      }

      player.play();
    }
  }, [player, playbackRangeInMs]);

  const triggerPause = useCallback(() => {
    player?.pause();
  }, [player]);

  const triggerSeek = useCallback(seekedTimeWithinRangeInMs => {
    if (player) {
      const actualTimeInMs = playbackRangeInMs[0] + seekedTimeWithinRangeInMs;
      player.currentTime = actualTimeInMs / 1000;
    }
  }, [player, playbackRangeInMs]);

  const triggerStop = useCallback(() => {
    player?.stop();
  }, [player]);

  const triggerReset = useCallback(() => {
    triggerSeek(0);
    onProgress(0);
    player?.stop();
  }, [player, triggerSeek, onProgress]);

  const setProgressInterval = callback => {
    clearInterval(progressInterval.current);
    progressInterval.current = null;
    if (callback) {
      progressInterval.current = setInterval(callback, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS);
    }
  };

  const handleDuration = useCallback(() => {
    if (player?.duration) {
      triggerSeek(0);
      const actualDurationInMs = player.duration * 1000;
      const playbackDurationInMs = actualDurationInMs * (playbackRange[1] - playbackRange[0]);
      setSourceDurationInMs(actualDurationInMs);
      onDuration(playbackDurationInMs);
    }
  }, [player, playbackRange, onDuration, triggerSeek]);

  useEffect(() => {
    if (sourceUrl === lastLoadingSourceUrl) {
      return;
    }

    setLastLoadingSourceUrl(sourceUrl);

    if (!preload || !isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })) {
      setLoadedSourceUrl(sourceUrl);
      return;
    }

    (async () => {
      const response = await httpClient.get(sourceUrl, { responseType: 'blob', withCredentials: true });

      const newLoadedSourceUrl = URL.createObjectURL(response.data);

      const oldLoadedSourceUrl = loadedSourceUrl;

      setLoadedSourceUrl(newLoadedSourceUrl);

      if (oldLoadedSourceUrl) {
        URL.revokeObjectURL(oldLoadedSourceUrl);
      }
    })();
  }, [sourceUrl, preload, loadedSourceUrl, lastLoadingSourceUrl, httpClient, clientConfig]);

  useOnComponentUnmount(() => {
    if (loadedSourceUrl && loadedSourceUrl !== sourceUrl) {
      URL.revokeObjectURL(loadedSourceUrl);
    }
  });

  useEffect(() => {
    const enableFullscreen = !!fullscreenContainerId;

    const playerInstance = new Plyr(plyrRef.current, {
      controls: [],
      ratio: aspectRatio,
      clickToPlay,
      loadSprite: false,
      blankVideo: '',
      fullscreen: {
        enabled: enableFullscreen,
        fallback: enableFullscreen,
        container: enableFullscreen ? `#${CSS.escape(fullscreenContainerId)}` : ''
      }
    });
    setPlayer(playerInstance);
  }, [plyrRef, fullscreenContainerId, aspectRatio, clickToPlay]);

  useEffect(() => {
    if (player) {
      player.source = {
        type: audioOnly ? 'audio' : 'video',
        sources: [{ src: loadedSourceUrl, provider: 'html5' }]
      };
    }
  }, [player, loadedSourceUrl, audioOnly]);

  useEffect(() => {
    if (player) {
      player.speed = playbackRate;
    }
  }, [player, playbackRate]);

  useEffect(() => {
    if (player && wasPlayTriggeredOnce) {
      player.volume = volume;
    }
  }, [player, volume, wasPlayTriggeredOnce]);

  useEffect(() => {
    if (player && playbackRangeInMs[0] > 0) {
      player.currentTime = playbackRangeInMs[0] / 1000;
    }
  }, [player, playbackRangeInMs]);

  const handleEnded = useCallback(() => {
    onEnded();
    setIsPlaying(false);
    setProgressInterval(null);
  }, [onEnded]);

  const handleProgress = useCallback(() => {
    if (player && sourceDurationInMs) {
      const currentActualTimeInMs = player.currentTime * 1000;
      const isEndReached = currentActualTimeInMs >= playbackRangeInMs[1];

      if (!isEndReached) {
        const currentTimeWithinRangeInMs = currentActualTimeInMs - playbackRangeInMs[0];
        onProgress(currentTimeWithinRangeInMs);
        return;
      }

      triggerPause();

      const endTimeWithinRangeInMs = playbackRangeInMs[1] - playbackRangeInMs[0];
      onProgress(endTimeWithinRangeInMs);

      handleEnded();
    }
  }, [player, sourceDurationInMs, playbackRangeInMs, onProgress, triggerPause, handleEnded]);

  const handleLoadedMetadata = useCallback(() => {
    handleDuration();
  }, [handleDuration]);

  const handleReady = useCallback(() => {
    onReady();
  }, [onReady]);

  const handlePlaying = useCallback(() => {
    onPlay();
    setIsPlaying(true);
    setProgressInterval(() => handleProgress());
  }, [onPlay, handleProgress]);

  const handlePause = useCallback(() => {
    onPause();
    setIsPlaying(false);
    setProgressInterval(null);
  }, [onPause]);

  const handleEnterFullscreen = useCallback(() => {
    onEnterFullscreen();
  }, [onEnterFullscreen]);

  const handleExitFullscreen = useCallback(() => {
    onExitFullscreen();
  }, [onExitFullscreen]);

  useEffect(() => {
    if (player) {
      player.once('loadedmetadata', handleLoadedMetadata);

      player.once('ready', handleReady);

      player.off('playing', handlePlaying);
      player.on('playing', handlePlaying);

      player.off('pause', handlePause);
      player.on('pause', handlePause);

      player.off('seeking', handleProgress);
      player.on('seeking', handleProgress);

      player.off('progress', handleProgress);
      player.on('progress', handleProgress);

      player.off('timeupdate', handleProgress);
      player.on('timeupdate', handleProgress);

      player.off('ended', handleEnded);
      player.on('ended', handleEnded);

      player.off('enterfullscreen', handleEnterFullscreen);
      player.on('enterfullscreen', handleEnterFullscreen);

      player.off('exitfullscreen', handleExitFullscreen);
      player.on('exitfullscreen', handleExitFullscreen);
    }
  }, [player, handleLoadedMetadata, handleReady, handlePlaying, handlePause, handleProgress, handleEnded, handleEnterFullscreen, handleExitFullscreen]);

  playerRef.current = useMemo(() => ({
    play: triggerPlay,
    pause: triggerPause,
    seekToTimecode: triggerSeek,
    stop: triggerStop,
    reset: triggerReset,
    fullscreen: player?.fullscreen
  }), [player, triggerPlay, triggerPause, triggerSeek, triggerStop, triggerReset]);

  return (
    <div className="Html5Player" onClick={isPlaying ? triggerPause : triggerPlay}>
      <video ref={plyrRef} />
      {!audioOnly && !isPlaying && !!clickToPlay && (
        <div className="Html5Player-playOverlay" onClick={triggerPlay}>
          {!wasPlayTriggeredOnce && (
            <div className="Html5Player-posterImage" style={{ backgroundImage: `url(${posterImageUrl})` }} />
          )}
          <div className="Html5Player-playOverlayIcon">
            <PlayCircleTwoTone twoToneColor="000000" />
          </div>
        </div>
      )}
    </div>
  );
}

Htlm5Player.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  clickToPlay: PropTypes.bool,
  fullscreenContainerId: PropTypes.string,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  playerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  preload: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  sourceUrl: PropTypes.string.isRequired,
  volume: PropTypes.number,
  onDuration: PropTypes.func,
  onEnded: PropTypes.func,
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onProgress: PropTypes.func,
  onReady: PropTypes.func
};

Htlm5Player.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  clickToPlay: true,
  fullscreenContainerId: null,
  playbackRange: [0, 1],
  playbackRate: 1,
  playerRef: {
    current: null
  },
  preload: false,
  posterImageUrl: null,
  volume: 1,
  onDuration: () => {},
  onEnded: () => {},
  onEnterFullscreen: () => {},
  onExitFullscreen: () => {},
  onPause: () => {},
  onPlay: () => {},
  onProgress: () => {},
  onReady: () => {}
};

export default memoAndTransformProps(Htlm5Player, ({
  onDuration,
  onEnded,
  onEnterFullscreen,
  onExitFullscreen,
  onPause,
  onPlay,
  onProgress,
  onReady,
  ...rest
}) => ({
  onDuration: useStableCallback(onDuration),
  onEnded: useStableCallback(onEnded),
  onEnterFullscreen: useStableCallback(onEnterFullscreen),
  onExitFullscreen: useStableCallback(onExitFullscreen),
  onPause: useStableCallback(onPause),
  onPlay: useStableCallback(onPlay),
  onProgress: useStableCallback(onProgress),
  onReady: useStableCallback(onReady),
  ...rest
}));
