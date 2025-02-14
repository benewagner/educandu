import classNames from 'classnames';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, MULTITRACK_PLAYER_TYPE } from '../../domain/constants.js';
import DefaultMultitrackMediaPlayer from '../../components/media-player/default-multitrack-media-player.js';
import PreciseMultitrackMediaPlayer from '../../components/media-player/precise-multitrack-media-player.js';

function CombinedMultitrackMediaDisplay({ content }) {
  const isMounted = useIsMounted();
  const clientConfig = useService(ClientConfig);

  const { note, width, player1, player2 } = content;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canRenderMediaPlayers, setCanRenderMediaPlayers] = useState(false);
  const [combinedCopyrightNotice, setCombinedCopyrightNotice] = useState('');

  useEffect(() => {
    const allTracks = [player1.track, ...player2.tracks];
    setCanRenderMediaPlayers(isMounted && allTracks.every(track => track.sourceUrl));
    setCombinedCopyrightNotice(allTracks.map(track => track.copyrightNotice).filter(text => !!text).join('\n\n'));
  }, [player1, player2, isMounted]);

  const player1Source = getAccessibleUrl({ url: player1.track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const player2Sources = player2.tracks.map(track => ({
    ...track,
    sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
  }));
  const posterImageUrl = getAccessibleUrl({ url: player1.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const player1Classes = classNames(
    'CombinedMultitrackMediaDisplay-player1',
    { 'CombinedMultitrackMediaDisplay-player1--noScreen': !player1.showVideo },
    { 'is-fullscreen': isFullscreen },
  );

  return (
    <div className="CombinedMultitrackMediaDisplay">
      <div className={`CombinedMultitrackMediaDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayers && !!isMounted && (
          <Fragment>
            <div className={player1Classes}>
              <MediaPlayer
                allowFullscreen
                screenMode={player1.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
                aspectRatio={player1.aspectRatio}
                initialVolume={player1.initialVolume}
                playbackRange={player1.track.playbackRange}
                posterImageUrl={posterImageUrl}
                sourceUrl={player1Source}
                customUnderControlsContent={(
                  <Fragment>
                    {!!note && (
                      <div className="CombinedMultitrackMediaDisplay-note">
                        <Markdown inline>{note}</Markdown>
                      </div>
                    )}
                    <div className="CombinedMultitrackMediaDisplay-player2">
                      {player2.multitrackPlayerType === MULTITRACK_PLAYER_TYPE.default && (
                        <DefaultMultitrackMediaPlayer
                          initialVolume={player2.initialVolume}
                          showTrackMixer
                          sources={player2Sources}
                          volumePresets={player2.volumePresets}
                          />
                      )}
                      {player2.multitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise && (
                        <PreciseMultitrackMediaPlayer
                          allowLoop
                          initialVolume={player2.initialVolume}
                          showTrackMixer
                          sources={player2Sources}
                          volumePresets={player2.volumePresets}
                          />
                      )}
                    </div>
                  </Fragment>
                )}
                onEnterFullscreen={handleEnterFullscreen}
                onExitFullscreen={handleExitFullscreen}
                />
            </div>

            <CopyrightNotice value={combinedCopyrightNotice} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

CombinedMultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default CombinedMultitrackMediaDisplay;
