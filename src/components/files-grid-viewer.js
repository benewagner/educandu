import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from '../ui/hooks.js';
import DeleteIcon from './icons/general/delete-icon.js';
import PreviewIcon from './icons/general/preview-icon.js';
import { cdnObjectShape } from '../ui/default-prop-types.js';
import { confirmCdnFileDelete } from './confirmation-dialogs.js';
import { CDN_OBJECT_TYPE, RESOURCE_TYPE } from '../domain/constants.js';
import { getResourceIcon, getResourceType } from '../utils/resource-utils.js';
import FolderFilledNavigateIcon from './icons/files/folder-filled-navigate-icon.js';

function FilesGridViewer({
  files,
  parentDirectory,
  selectedFileUrl,
  canDelete,
  canNavigateToParent,
  onDeleteClick,
  onFileClick,
  onFileDoubleClick,
  onPreviewClick,
  onNavigateToParentClick
}) {
  const { t } = useTranslation('filesGridViewer');
  const debouncedOnFileClick = useDebouncedCallback(onFileClick, 200);

  const handlePreviewClick = (event, file) => {
    event.stopPropagation();
    onPreviewClick(file);
  };

  const handleDeleteClick = (event, file) => {
    event.stopPropagation();
    confirmCdnFileDelete(t, file.displayName, () => onDeleteClick(file));
  };

  const renderFile = file => {
    let fileDisplay;
    if (getResourceType(file.url) === RESOURCE_TYPE.image) {
      fileDisplay = <img className="FilesGridViewer-fileDisplayImage" src={file.url} />;
    } else {
      const Icon = getResourceIcon({ url: file.url, isDirectory: file.type === CDN_OBJECT_TYPE.directory, filled: true });
      fileDisplay = <Icon />;
    }
    const overlayClasses = classNames('FilesGridViewer-fileOverlay', { 'is-visible': file.portableUrl === selectedFileUrl });
    const actionsClasses = classNames('FilesGridViewer-actions', { 'are-visible': file.portableUrl === selectedFileUrl });

    return (
      <div className="FilesGridViewer-fileContainer" key={file.portableUrl}>
        <a className="FilesGridViewer-file" onClick={() => debouncedOnFileClick(file)} onDoubleClick={() => onFileDoubleClick(file)}>
          <div className="FilesGridViewer-fileDisplay">
            {fileDisplay}
          </div>
          <span className="FilesGridViewer-fileName">{file.displayName}</span>
        </a>
        <div className={overlayClasses} />
        <div className={actionsClasses} onClick={() => debouncedOnFileClick(file)}>
          <Tooltip title={t('common:preview')}>
            <a
              className="FilesGridViewer-action FilesGridViewer-action--preview"
              onClick={event => handlePreviewClick(event, file)}
              >
              <PreviewIcon />
            </a>
          </Tooltip>
          {canDelete && (
            <Tooltip title={t('common:delete')}>
              <a
                className="FilesGridViewer-action FilesGridViewer-action--delete"
                onClick={event => handleDeleteClick(event, file)}
                >
                <DeleteIcon />
              </a>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="FilesGridViewer">
      {canNavigateToParent && (
        <Tooltip title={t('navigateToParent')} placement="topLeft">
          <div className="FilesGridViewer-fileContainer">
            <a className="FilesGridViewer-file FilesGridViewer-file--parentLink" onClick={onNavigateToParentClick}>
              <div className="FilesGridViewer-fileDisplay">
                <FolderFilledNavigateIcon />
              </div>
              <div>{parentDirectory?.displayName || '..'}</div>
            </a>
          </div>
        </Tooltip>
      )}
      {files.map(file => renderFile(file))}
    </div>
  );
}

FilesGridViewer.propTypes = {
  canDelete: PropTypes.bool,
  canNavigateToParent: PropTypes.bool,
  files: PropTypes.arrayOf(cdnObjectShape).isRequired,
  onDeleteClick: PropTypes.func,
  onFileClick: PropTypes.func,
  onFileDoubleClick: PropTypes.func,
  onNavigateToParentClick: PropTypes.func,
  onPreviewClick: PropTypes.func,
  parentDirectory: cdnObjectShape,
  selectedFileUrl: PropTypes.string
};

FilesGridViewer.defaultProps = {
  canDelete: false,
  canNavigateToParent: false,
  onDeleteClick: () => {},
  onFileClick: () => {},
  onFileDoubleClick: () => {},
  onNavigateToParentClick: () => {},
  onPreviewClick: () => {},
  parentDirectory: null,
  selectedFileUrl: null
};

export default FilesGridViewer;
