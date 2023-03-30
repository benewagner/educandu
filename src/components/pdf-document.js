import PropTypes from 'prop-types';
import { Empty, Result, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { pdfjs, Document, Page } from 'react-pdf';
import { ORIENTATION } from '../domain/constants.js';
import DimensionsProvider from './dimensions-provider.js';
import React, { useEffect, useRef, useState } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = '/api/v1/pdfjs-dist/build/pdf.worker.min.js';

function PdfDocument({ file, pageNumber, stretchDirection, showTextOverlay, onLoadSuccess }) {
  const viewerRef = useRef();
  const { t } = useTranslation('pdfDocument');
  const [viewerStyle, setViewerStyle] = useState({});
  const [actualPageNumber, setActualPageNumber] = useState(pageNumber);
  const isMounted = useRef(false);

  const releaseViewerStyle = () => setTimeout(() => {
    if (isMounted.current) {
      setViewerStyle({});
    }
  }, 0);

  useEffect(() => {
    isMounted.current = true;
    // In order to not have flickering on the page while the new page renders we keep the dimensions
    // of the old page fixed until `handlePageRenderSuccess` has been called by the next page,
    // or any of the error components are rendered.
    const boundingClientRect = viewerRef.current.getBoundingClientRect();
    setViewerStyle({ height: boundingClientRect.height, width: boundingClientRect.width });
    setActualPageNumber(pageNumber);

    return () => {
      isMounted.current = false;
    };
  }, [pageNumber]);

  const handlePageRenderSuccess = () => {
    releaseViewerStyle();
  };

  const renderLoadingComponent = () => {
    releaseViewerStyle();
    return (
      <Empty description={t('loadingDocument')} image={<Spin size="large" />} />
    );
  };

  const renderNoDataComponent = () => {
    releaseViewerStyle();
    return (
      <Empty description={t('noDocument')} />
    );
  };

  const renderDocumentErrorComponent = () => {
    releaseViewerStyle();
    return (
      <Result
        status="warning"
        title={t('common:error')}
        subTitle={t('errorRenderingDocument')}
        />
    );
  };

  const renderPageErrorComponent = () => {
    releaseViewerStyle();
    return (
      <Result
        status="warning"
        title={t('common:error')}
        subTitle={t('errorRenderingPage')}
        />
    );
  };

  return (
    <DimensionsProvider>
      {({ containerHeight, containerWidth }) => (
        <div className="PdfDocument" style={viewerStyle} ref={viewerRef}>
          <Document
            options={{
              cMapUrl: '/api/v1/pdfjs-dist/cmaps',
              cMapPacked: true
            }}
            file={file}
            renderMode="canvas"
            loading={renderLoadingComponent}
            noData={renderNoDataComponent}
            error={renderDocumentErrorComponent}
            onLoadSuccess={onLoadSuccess}
            >
            <Page
              key={actualPageNumber}
              pageNumber={actualPageNumber}
              height={stretchDirection === ORIENTATION.vertical ? containerHeight : null}
              width={stretchDirection === ORIENTATION.horizontal ? containerWidth : null}
              error={renderPageErrorComponent}
              renderTextLayer={showTextOverlay}
              onRenderSuccess={handlePageRenderSuccess}
              />
          </Document>
        </div>
      )}
    </DimensionsProvider>
  );
}

PdfDocument.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    withCredentials: PropTypes.bool
  }),
  onLoadSuccess: PropTypes.func,
  pageNumber: PropTypes.number,
  showTextOverlay: PropTypes.bool,
  stretchDirection: PropTypes.oneOf(Object.values(ORIENTATION))
};

PdfDocument.defaultProps = {
  file: null,
  onLoadSuccess: () => {},
  pageNumber: 1,
  showTextOverlay: false,
  stretchDirection: ORIENTATION.horizontal
};

export default PdfDocument;
