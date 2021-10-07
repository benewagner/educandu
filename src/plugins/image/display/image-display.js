import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import classNames from 'classnames';
import ClientConfig from '../../../bootstrap/client-config';
import { EFFECT_TYPE, ORIENTATION, SOURCE_TYPE } from '../constants';
import { inject } from '../../../components/container-context';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown';
import { sectionDisplayProps, clientConfigProps } from '../../../ui/default-prop-types';

function getSource(sourceType, url, cdnRootUrl) {
  switch (sourceType) {
    case SOURCE_TYPE.external:
      return url || null;
    case SOURCE_TYPE.internal:
      return url ? `${cdnRootUrl}/${url}` : null;
    default:
      return null;
  }
}

const hoverEffect = ({ content, githubFlavoredMarkdown, clientConfig }) => (
  <div className="Image-secondary">
    <img
      className={`Image-img u-max-width-${content.maxWidth || 100}`}
      src={getSource(content.effect.sourceType, content.effect.sourceUrl, clientConfig.cdnRootUrl)}
      />
    <div
      className="Image-copyrightInfo"
      dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.effect.text || '') }}
      />
  </div>
);

const revealEffect = ({ content, githubFlavoredMarkdown, clientConfig }) => {
  const { effect } = content;
  return (
    <Fragment>
      <ReactCompareSlider
        position={effect.startPosition}
        portrait={effect.orientation === ORIENTATION.vertical}
        itemOne={<ReactCompareSliderImage src={getSource(content.sourceType, content.sourceUrl, clientConfig.cdnRootUrl)} />}
        itemTwo={<ReactCompareSliderImage src={getSource(effect.sourceType, effect.sourceUrl, clientConfig.cdnRootUrl)} />}
        />
      <div className="Image-copyrightInfo">
        <div dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }} />
        <div dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.effect.text || '') }} />
      </div>
    </Fragment>
  );
};

function ImageDisplay({ content, clientConfig, githubFlavoredMarkdown }) {
  const configs = { content, githubFlavoredMarkdown, clientConfig };

  if (content.effect?.type === EFFECT_TYPE.reveal) {
    return revealEffect(configs);
  }

  return (
    <div className={classNames('Image', { 'Image--hoverable': content.effect })}>
      <div className="Image-primary">
        <img
          className={`Image-img u-max-width-${content.maxWidth || 100}`}
          src={getSource(content.sourceType, content.sourceUrl, clientConfig.cdnRootUrl)}
          />
        <div
          className="Image-copyrightInfo"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
          />
      </div>
      {content.effect && hoverEffect(configs)}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientConfigProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  clientConfig: ClientConfig,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, ImageDisplay);
