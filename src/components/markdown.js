import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

function Markdown({ children, inline, tag, ...rest }) {
  const gfm = useService(GithubFlavoredMarkdown);
  const { cdnRootUrl } = useService(ClientConfig);

  const Tag = tag || 'div';

  return typeof children === 'string'
    ? <Tag {...rest} dangerouslySetInnerHTML={{ __html: gfm[inline ? 'renderInline' : 'render'](children, { cdnRootUrl }) }} />
    : <Tag {...rest}>{children}</Tag>;
}

Markdown.propTypes = {
  children: PropTypes.node,
  inline: PropTypes.bool,
  tag: PropTypes.string
};

Markdown.defaultProps = {
  children: null,
  inline: false,
  tag: 'div'
};

export default React.memo(Markdown);
