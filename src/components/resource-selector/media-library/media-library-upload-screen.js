import PropTypes from 'prop-types';
import { Button, Form } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { handleApiError } from '../../../ui/error-helper.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryMetadataForm from './media-library-metadata-form.js';
import MediaLibraryFileDropzone from './media-library-file-dropzone.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { isEditableImageFile, processFileBeforeUpload } from '../../../utils/storage-utils.js';

const logger = new Logger(import.meta.url);

const SCREEN = {
  enterData: 'enter-data',
  editImage: 'edit-image',
  createItem: 'create-item',
  previewCreatedItem: 'preview-created-item'
};

const createFileInfo = file => file ? { file, isEdited: false, isTooBig: file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } : null;

function MediaLibraryUploadScreen({
  initialFile,
  onBackClick,
  onCancelClick,
  onSelectNewUrl
}) {
  const dropzoneRef = useRef();
  const [form] = Form.useForm();
  const [createdItem, setCreatedItem] = useState(null);
  const { t } = useTranslation('mediaLibraryUploadScreen');
  const [currentScreen, setCurrentScreen] = useState(SCREEN.enterData);
  const [fileInfo, setFileInfo] = useState(createFileInfo(initialFile));
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  useEffect(() => {
    setCreatedItem(null);
    setCurrentScreen(SCREEN.enterData);
    setFileInfo(createFileInfo(initialFile));
  }, [initialFile, form]);

  const isCurrentlyUploading = currentScreen === SCREEN.createItem;
  const canEditImage = fileInfo && isEditableImageFile(fileInfo.file);

  const handleFileDrop = ([newFile]) => {
    if (!isCurrentlyUploading && newFile) {
      setFileInfo(createFileInfo(newFile));
    }
  };

  const handleMetadataFormFinish = async ({ description, languages, licenses, tags, optimizeImage }) => {
    const currentFile = fileInfo?.file || null;
    if (!currentFile) {
      return;
    }

    setCurrentScreen(SCREEN.createItem);
    try {
      const processedFile = await processFileBeforeUpload({ file: currentFile, optimizeImage });
      const result = await mediaLibraryApiClient.createMediaLibraryItem({
        file: processedFile,
        description,
        languages,
        licenses,
        tags
      });
      setCreatedItem(result);
      setCurrentScreen(SCREEN.previewCreatedItem);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setCurrentScreen(SCREEN.previewCreatedItem);
    }
  };

  const handleCreateItemClick = () => {
    form.submit();
  };

  const handleSelectCreatedItemClick = () => {
    onSelectNewUrl(createdItem.portableUrl);
  };

  const handleEditImageClick = () => {
    setCurrentScreen(SCREEN.editImage);
  };

  const handleEditorBackClick = () => {
    setCurrentScreen(SCREEN.enterData);
  };

  const handleEditorApplyClick = newFile => {
    setFileInfo({ ...createFileInfo(newFile), isEdited: true });
    setCurrentScreen(SCREEN.enterData);
  };

  if (currentScreen === SCREEN.editImage) {
    return (
      <FileEditorScreen
        file={fileInfo.file}
        onCancelClick={onCancelClick}
        onBackClick={handleEditorBackClick}
        onApplyClick={handleEditorApplyClick}
        />
    );
  }

  if (currentScreen === SCREEN.previewCreatedItem) {
    return (
      <ResourcePreviewScreen
        file={createdItem}
        renderMediaLibraryMetadata
        onBackClick={onBackClick}
        onCancelClick={onCancelClick}
        onSelectClick={handleSelectCreatedItemClick}
        />
    );
  }

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('uploadHeadline')}</h3>
      <div className="u-overflow-auto">
        <div className="u-resource-selector-screen-content-split">
          <MediaLibraryFileDropzone
            dropzoneRef={dropzoneRef}
            file={fileInfo?.file || null}
            canAcceptFile={!isCurrentlyUploading}
            showSizeWarning={!!fileInfo?.isTooBig}
            onFileDrop={handleFileDrop}
            onEditImageClick={handleEditImageClick}
            />
          <MediaLibraryMetadataForm form={form} disableOptimizeImage={!canEditImage} onFinish={handleMetadataFormFinish} />
        </div>
      </div>
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={isCurrentlyUploading}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={isCurrentlyUploading}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleCreateItemClick} disabled={!fileInfo || !!fileInfo.isTooBig} loading={isCurrentlyUploading}>{t('common:upload')}</Button>
        </div>
      </div>
    </div>
  );
}

MediaLibraryUploadScreen.propTypes = {
  initialFile: browserFileType,
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onSelectNewUrl: PropTypes.func
};

MediaLibraryUploadScreen.defaultProps = {
  initialFile: null,
  onBackClick: () => {},
  onCancelClick: () => {},
  onSelectNewUrl: () => {}
};

export default MediaLibraryUploadScreen;
