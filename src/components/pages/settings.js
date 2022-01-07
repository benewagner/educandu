import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import { Alert, Input, Button } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper, { handleApiError } from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import permissions from '../../domain/permissions.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import React, { useState, useCallback, Fragment } from 'react';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import SettingApiClient from '../../api-clients/setting-api-client.js';
import DefaultTagsSettings from '../settings/default-tags-settings.js';
import SpecialPageSettings from '../settings/special-page-settings.js';
import FooterLinksSettings from '../settings/footer-links-settings.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';
import { documentMetadataShape, settingsShape } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

function Settings({ initialState, PageTemplate }) {
  const { t } = useTranslation('settings');
  const settingApiClient = useService(SettingApiClient);
  const documentApiClient = useService(DocumentApiClient);
  const [settings, setSettings] = useState(initialState.settings);
  const [dirtyKeys, setDirtyKeys] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState(initialState.settings);

  const handleChange = useCallback((key, value, isValid) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => ensureIsIncluded(prev, key));
    setInvalidKeys(prev => isValid ? ensureIsExcluded(prev, key) : ensureIsIncluded(prev, key));
  }, [setSettings, setDirtyKeys, setInvalidKeys]);

  const handleAnnouncementChange = useCallback(event => {
    handleChange('announcement', event.target.value, true);
  }, [handleChange]);

  const handleHelpPageChange = useCallback((value, { isValid }) => {
    handleChange('helpPage', value, isValid);
  }, [handleChange]);

  const handleTermsPageChange = useCallback((value, { isValid }) => {
    handleChange('termsPage', value, isValid);
  }, [handleChange]);

  const handleFooterLinksChange = useCallback((value, { isValid }) => {
    handleChange('footerLinks', value, isValid);
  }, [handleChange]);

  const handleDefaultTagsChange = useCallback((value, { isValid }) => {
    handleChange('defaultTags', value, isValid);
  }, [handleChange]);

  const handleSaveClick = async () => {
    const changedSettings = dirtyKeys.reduce((map, key) => ({ ...map, [key]: settings[key] }), {});
    try {
      setIsUpdating(true);
      await settingApiClient.saveSettings({ settings: changedSettings });
      setLastSavedSettings({ ...initialState.settings, ...changedSettings });
      setDirtyKeys([]);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setSettings(lastSavedSettings);
    setDirtyKeys([]);
    setInvalidKeys([]);
  };

  const handleCreateDocumentsBatchClick = async () => {
    try {
      await documentApiClient.createDocumentsBatch();
    } catch (error) {
      handleApiError({ t, logger, error });
    }
  };

  const headerActions = [];
  if (dirtyKeys.length) {
    if (!invalidKeys.length) {
      headerActions.push({
        key: 'save',
        type: 'primary',
        icon: SaveOutlined,
        text: t('common:save'),
        loading: isUpdating,
        permission: permissions.EDIT_SETTINGS,
        handleClick: handleSaveClick
      });
    }

    headerActions.push({
      key: 'close',
      icon: CloseOutlined,
      text: t('common:cancel'),
      disabled: isUpdating,
      handleClick: handleCancelClick
    });
  }

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts} headerActions={headerActions}>
      <div className="SettingsPage">
        <h1>{t('pageNames:settings')}</h1>
        <h2 className="SettingsPage-sectionHeader">{t('announcementHeader')}</h2>
        <section className="SettingsPage-section SettingsPage-section--announcement">
          <Input value={settings.announcement} onChange={handleAnnouncementChange} />
          {settings.announcement && (
            <Fragment>
              <span className="SettingsPage-announcementPreview">{t('announcementPreview')}</span>
              <Alert type="warning" message={<Markdown inline>{settings.announcement}</Markdown>} banner />
            </Fragment>
          )}
        </section>
        <h2 className="SettingsPage-sectionHeader">{t('helpPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.helpPage}
          documents={initialState.documents}
          onChange={handleHelpPageChange}
          />
        <h2 className="SettingsPage-sectionHeader">{t('termsPageHeader')}</h2>
        <SpecialPageSettings
          settings={settings.termsPage}
          documents={initialState.documents}
          onChange={handleTermsPageChange}
          />
        <h2 className="SettingsPage-sectionHeader">{t('footerLinksHeader')}</h2>
        <FooterLinksSettings
          footerLinks={settings.footerLinks}
          documents={initialState.documents}
          onChange={handleFooterLinksChange}
          />
        <h2 className="SettingsPage-sectionHeader">{t('defaultTagsHeader')}</h2>
        <DefaultTagsSettings
          defaultTags={settings.defaultTags || []}
          onChange={handleDefaultTagsChange}
          />
        <h2 className="SettingsPage-sectionHeader">{t('createRegenerateDocumentsBatchHeader')}</h2>
        <Button
          className="SettingsPage-createRegenerateDocumentsBatchButton"
          onClick={handleCreateDocumentsBatchClick}
          >
          {t('createRegenerateDocumentsBatch')}
        </Button>
      </div>
    </PageTemplate>
  );
}

Settings.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    settings: settingsShape.isRequired,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};

export default Settings;
