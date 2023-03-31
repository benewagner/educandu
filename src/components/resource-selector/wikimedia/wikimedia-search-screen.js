import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import EmptyState from '../../empty-state.js';
import { useTranslation } from 'react-i18next';
import { SearchOutlined } from '@ant-design/icons';
import WikimediaFilesViewer from './wikimedia-files-viewer.js';
import ResourceSearchBar from '../shared/resource-search-bar.js';
import { SEARCH_RESOURCE_TYPE } from '../../../domain/constants.js';
import { wikimediaFileShape } from '../../../ui/default-prop-types.js';
import SelectedResourceDisplay from '../shared/selected-resource-display.js';

const SCREEN = {
  search: 'search',
  searchInvitation: 'search-invitation',
  initialUrlPreview: 'initial-url-preview'
};

function WikimediaSearchScreen({
  files,
  isHidden,
  isLoading,
  initialUrl,
  canLoadMore,
  searchParams,
  highlightedFile,
  onLoadMore,
  onFileClick,
  onCancelClick,
  onFileDoubleClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectInitialUrlClick,
  onOpenWikimediaPageClick,
  onSelectHighlightedFileClick
}) {
  const { t } = useTranslation('wikimediaSearchScreen');
  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);

  let currentScreen;
  let canSelectUrl;
  if (hasSearchedAtLeastOnce) {
    currentScreen = SCREEN.search;
    canSelectUrl = !!highlightedFile;
  } else if (initialUrl) {
    currentScreen = SCREEN.initialUrlPreview;
    canSelectUrl = true;
  } else {
    currentScreen = SCREEN.searchInvitation;
    canSelectUrl = false;
  }

  const handleSearch = newSearchParams => {
    setHasSearchedAtLeastOnce(true);
    onSearchParamsChange(newSearchParams);
  };

  const handleSelectClick = () => {
    switch (currentScreen) {
      case SCREEN.search:
        return onSelectHighlightedFileClick();
      case SCREEN.initialUrlPreview:
        return onSelectInitialUrlClick();
      default:
        throw new Error('No file selected');
    }
  };

  const showEmptyState = !initialUrl;

  return (
    <div className={classNames('WikimediaSearchScreen', { 'is-hidden': isHidden })}>
      <div className="u-resource-selector-screen">
        <ResourceSearchBar isLoading={isLoading} initialSearchParams={searchParams} onSearch={handleSearch} />
        {currentScreen === SCREEN.search && (
        <div className="WikimediaSearchScreen-filesViewer">
          <div className="WikimediaSearchScreen-filesViewerContent">
            <WikimediaFilesViewer
              files={files}
              isLoading={isLoading}
              searchTerm={searchParams.searchTerm}
              onLoadMore={onLoadMore}
              canLoadMore={canLoadMore}
              onFileClick={onFileClick}
              onFileDoubleClick={onFileDoubleClick}
              selectedFileUrl={highlightedFile?.url}
              onPreviewFileClick={onPreviewFileClick}
              onOpenWikimediaPageClick={onOpenWikimediaPageClick}
              />
          </div>
        </div>
        )}
        {currentScreen !== SCREEN.search && (
        <div className="WikimediaSearchScreen-noSearch">
          {!!showEmptyState && (
            <EmptyState
              icon={<SearchOutlined />}
              title={t('emptyStateTitle')}
              subtitle={t('common:mediaLibraryEmptyStateSubtitle')}
              />
          )}
          {!showEmptyState && (
            <SelectedResourceDisplay urlOrFile={initialUrl} footer={t('common:useSearchToChangeFile')} />
          )}
        </div>
        )}
        <div className="u-resource-selector-screen-footer-right-aligned">
          <div className="u-resource-selector-screen-footer-buttons">
            <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
            <Button type="primary" onClick={handleSelectClick} disabled={!canSelectUrl}>
              {t('common:select')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

WikimediaSearchScreen.propTypes = {
  canLoadMore: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  highlightedFile: wikimediaFileShape,
  initialUrl: PropTypes.string,
  isHidden: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onOpenWikimediaPageClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  onSelectInitialUrlClick: PropTypes.func.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchResourceType: PropTypes.oneOf(Object.values(SEARCH_RESOURCE_TYPE)).isRequired
  }).isRequired
};

WikimediaSearchScreen.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default WikimediaSearchScreen;
