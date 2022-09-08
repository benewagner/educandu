import React from 'react';
import urlUtils from '../../utils/url-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';

function VideoDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const sourceUrl = urlUtils.getMediaUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType: content.sourceType,
    sourceUrl: content.sourceUrl
  });

  const posterImageUrl = urlUtils.getImageUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType: content.posterImage?.sourceType,
    sourceUrl: content.posterImage?.sourceUrl
  });

  return (
    <div className="VideoDisplay">
      <div className={`VideoDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            source={sourceUrl}
            posterImageUrl={posterImageUrl}
            aspectRatio={content.aspectRatio}
            canDownload={content.sourceType === MEDIA_SOURCE_TYPE.internal}
            />
        )}
        <CopyrightNotice value={content.copyrightNotice} />
      </div>
    </div>
  );
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps
};

export default VideoDisplay;
