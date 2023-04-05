import React, { useMemo, useState } from 'react';
import Markdown from '../../components/markdown.js';
import MiniPager from '../../components/mini-pager.js';
import { ORIENTATION } from '../../domain/constants.js';
import PdfDocument from '../../components/pdf-document.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function PdfViewerDisplay({ content }) {
  const { sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const [pdf, setPdf] = useState(null);
  const clientConfig = useService(ClientConfig);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);

  const fileObject = useMemo(() => {
    return sourceUrl
      ? { url: getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl }), withCredentials: true }
      : null;
  }, [sourceUrl, clientConfig.cdnRootUrl]);

  const onDocumentLoadSuccess = loadedPdfDocument => {
    setPdf(loadedPdfDocument);
    setPageNumber(initialPageNumber);
  };

  return (
    <div className="PdfViewerDisplay">
      <div className={`PdfViewerDisplay-viewer u-width-${width || 100}`}>
        <PdfDocument
          file={fileObject}
          pageNumber={pageNumber}
          stretchDirection={ORIENTATION.horizontal}
          showTextOverlay={showTextOverlay}
          onLoadSuccess={onDocumentLoadSuccess}
          />
      </div>
      {!!caption && (
        <div className={`PdfViewerDisplay-caption u-width-${width || 100}`}>
          <Markdown inline>{caption}</Markdown>
        </div>
      )}
      <MiniPager
        currentPage={pageNumber}
        totalPages={pdf?.numPages || 0}
        onNavigate={setPageNumber}
        />
    </div>
  );
}

PdfViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default PdfViewerDisplay;
