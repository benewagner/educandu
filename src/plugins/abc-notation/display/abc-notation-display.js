import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { inject } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';

const abcOptions = {
  paddingtop: 0,
  paddingbottom: 0,
  paddingright: 0,
  paddingleft: 0,
  responsive: 'resize'
};

const midiOptions = {
  generateDownload: false,
  generateInline: true
};

class AbcNotationDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    autoBind(this);
    this.abcjs = null;
    this.canRenderAbc = false;
    this.abcContainerRef = React.createRef();
    this.midiContainerRef = React.createRef();
  }

  async componentDidMount() {
    this.canRenderAbc = true;
    const { default: abcjs } = await import('abcjs/midi.js');
    this.abcjs = abcjs;

    if (this.canRenderAbc) {
      const { content } = this.props;
      this.abcjs.renderAbc(this.abcContainerRef.current, content.abcCode, abcOptions);
      this.abcjs.renderMidi(this.midiContainerRef.current, content.abcCode, midiOptions);
    }
  }

  componentWillUnmount() {
    this.canRenderAbc = false;
  }

  render() {
    const { content, githubFlavoredMarkdown } = this.props;
    return (
      <div className="AbcNotation fa5">
        <div className={`AbcNotation-wrapper u-max-width-${content.maxWidth || 100}`}>
          <div ref={this.abcContainerRef} />
          {content.displayMidi && <div ref={this.midiContainerRef} />}
          <div
            className="AbcNotation-copyrightInfo"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
            />
        </div>
      </div>
    );
  }
}

AbcNotationDisplay.propTypes = {
  ...sectionDisplayProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AbcNotationDisplay);
