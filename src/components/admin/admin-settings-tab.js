import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import LicenseSettings from './license-settings.js';
import { useService } from '../container-context.js';
import DocumentSelector from '../document-selector.js';
import { handleApiError } from '../../ui/error-helper.js';
import SpecialPageSettings from './special-page-settings.js';
import FooterLinksSettings from './footer-links-settings.js';
import { Button, Collapse, message, Spin, Tabs } from 'antd';
import PluginRegistry from '../../plugins/plugin-registry.js';
import AnnouncementSettings from './announcement-settings.js';
import { DASHBOARD_TAB_KEY } from '../../domain/constants.js';
import HomepageTagsSettings from './homepage-tags-settings.js';
import React, { useState, useCallback, useEffect } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SettingsApiClient from '../../api-clients/settings-api-client.js';
import HomepageDocumentsSettings from './homepage-documents-settings.js';
import HomepageTrustLogosSettings from './homepage-trust-logos-settings.js';
import HomepagePresentationSettings from './homepage-presentation-settings.js';
import MarkdownSettingInSupportedLanguages from './markdown-setting-in-supported-languages.js';

const logger = new Logger(import.meta.url);

function AdminSettingsTab({ onDirtyStateChange }) {
  const { t } = useTranslation('adminSettingsTab');
  const pluginRegistry = useService(PluginRegistry);
  const settingsApiClient = useSessionAwareApiClient(SettingsApiClient);

  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await settingsApiClient.getSettings();
        setSettings(res.settings);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [settingsApiClient, t]);

  useEffect(() => {
    onDirtyStateChange(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const handleChange = useCallback((key, value) => {
    setIsDirty(true);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings, setIsDirty]);

  const handleAnnouncementChange = useCallback(value => {
    handleChange('announcement', value);
  }, [handleChange]);

  const handleConsentTextChange = useCallback(value => {
    handleChange('consentText', value);
  }, [handleChange]);

  const handleHomepageTagsChange = useCallback(value => {
    handleChange('homepageTags', value);
  }, [handleChange]);

  const handleHomepageDocumentsChange = useCallback(value => {
    handleChange('homepageDocuments', value);
  }, [handleChange]);

  const handleHomepagePresentationChange = useCallback(value => {
    handleChange('homepagePresentation', value);
  }, [handleChange]);

  const handleHomepageTrustLogosChange = useCallback(value => {
    handleChange('homepageTrustLogos', value);
  }, [handleChange]);

  const handleTemplateDocumentChange = useCallback(documentId => {
    handleChange('templateDocument', { documentId });
  }, [handleChange]);

  const handleHelpPageChange = useCallback(value => {
    handleChange('helpPage', value);
  }, [handleChange]);

  const handleTermsPageChange = useCallback(value => {
    handleChange('termsPage', value);
  }, [handleChange]);

  const handleFooterLinksChange = useCallback(value => {
    handleChange('footerLinks', value);
  }, [handleChange]);

  const handlePluginHelpTextChange = useCallback((pluginType, value) => {
    const newPluginsHelpTexts = { ...cloneDeep(settings.pluginsHelpTexts), [pluginType]: value };
    handleChange('pluginsHelpTexts', newPluginsHelpTexts);
  }, [settings, handleChange]);

  const handleLicenseChange = useCallback(value => {
    handleChange('license', value);
  }, [handleChange]);

  const cleanUpSettings = () => {
    if (settings.announcement) {
      settings.announcement.text = settings.announcement.text.trim();
    }
    if (settings.homepageDocuments) {
      settings.homepageDocuments = settings.homepageDocuments.filter(documentId => !!documentId);
    }
    if (settings.homepageTrustLogos) {
      settings.homepageTrustLogos = settings.homepageTrustLogos.filter(item => !!item.logoUrl.trim());
    }
    if (settings.footerLinks) {
      for (const language of Object.keys(settings.footerLinks)) {
        settings.footerLinks[language] = settings.footerLinks[language].filter(item => item.linkTitle.trim().length && item.documentId);
      }
    }

    return settings;
  };

  const handleSaveButtonClick = async () => {
    try {
      setIsSaving(true);
      const newSettings = cleanUpSettings();
      const res = await settingsApiClient.saveSettings({ settings: newSettings });
      setIsDirty(false);
      setSettings(res.settings);
      message.success({ content: t('common:changesSavedSuccessfully') });
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="AdminSettingsTab">
      <Spin size="large" spinning={isLoading} delay={500}>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('announcementHeader')} key="panel">
            <div className="AdminSettingsTab-collapseInfo">{t('announcementInfo')}</div>
            <AnnouncementSettings
              announcement={settings.announcement}
              onChange={handleAnnouncementChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('consentHeader')} key="consent">
            <div className="AdminSettingsTab-collapseInfo">{t('consentInfo')}</div>
            <MarkdownSettingInSupportedLanguages
              settingValue={settings.consentText}
              onChange={handleConsentTextChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('helpPageHeader')} key="helpPage">
            <div className="AdminSettingsTab-collapseInfo">{t('helpPageInfo')}</div>
            <SpecialPageSettings
              settings={settings.helpPage}
              onChange={handleHelpPageChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('termsPageHeader')} key="termsPage">
            <div className="AdminSettingsTab-collapseInfo">{t('termsPageInfo')}</div>
            <SpecialPageSettings
              settings={settings.termsPage}
              onChange={handleTermsPageChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('footerLinksHeader')} key="footerLinks">
            <div className="AdminSettingsTab-collapseInfo">{t('footerLinksInfo')}</div>
            <FooterLinksSettings
              footerLinks={settings.footerLinks}
              onChange={handleFooterLinksChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('homepageTagsHeader')} key="homepageTags">
            <div className="AdminSettingsTab-collapseInfo">{t('homepageTagsInfo')}</div>
            <HomepageTagsSettings
              tags={settings.homepageTags}
              onChange={handleHomepageTagsChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('homepageDocumentsHeader')} key="homepageDocuments">
            <div className="AdminSettingsTab-collapseInfo">{t('homepageDocumentsInfo')}</div>
            <HomepageDocumentsSettings
              documentIds={settings.homepageDocuments}
              onChange={handleHomepageDocumentsChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('homepagePresentationHeader')} key="homepagePresentation">
            <div className="AdminSettingsTab-collapseInfo">{t('homepagePresentationInfo')}</div>
            <HomepagePresentationSettings
              settings={settings.homepagePresentation}
              onChange={handleHomepagePresentationChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('homepageTrustLogosHeader')} key="homepageTrustLogos">
            <div className="AdminSettingsTab-collapseInfo">{t('homepageTrustLogosInfo')}</div>
            <HomepageTrustLogosSettings
              settings={settings.homepageTrustLogos}
              onChange={handleHomepageTrustLogosChange}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('dashboardHelpLinksHeader')} key="dashboardHelpLinks">
            <div className="AdminSettingsTab-collapseInfo">{t('dashboardHelpLinksInfo')}</div>
            <Tabs
              type="line"
              size="small"
              items={Object.values(DASHBOARD_TAB_KEY).map(tabKey => ({
                key: tabKey,
                label: t(`common:dashboardTab_${tabKey}`),
                children: (
                  <div className="AdminSettingsTab-collapseTabPane" />
                )
              }))}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('templateDocumentHeader')} key="templateDocument">
            <div className="AdminSettingsTab-collapseInfo">{t('templateDocumentInfo')}</div>
            <div className="AdminSettingsTab-templateDocument" >
              <DocumentSelector
                documentId={settings.templateDocument?.documentId}
                onChange={handleTemplateDocumentChange}
                />
            </div>
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('pluginsHelpTextsHeader')} key="plugisHelpTexts">
            <div className="AdminSettingsTab-collapseInfo">{t('pluginsHelpTextsInfo')}</div>
            <Tabs
              type="line"
              size="small"
              items={pluginRegistry.getAllRegisteredPlugins().map(plugin => ({
                key: plugin.name,
                label: plugin.info.getDisplayName(t),
                children: (
                  <div className="AdminSettingsTab-collapseTabPane">
                    <MarkdownSettingInSupportedLanguages
                      settingValue={settings.pluginsHelpTexts?.[plugin.name]}
                      onChange={value => handlePluginHelpTextChange(plugin.name, value)}
                      />
                  </div>
                )
              }))}
              />
          </Collapse.Panel>
        </Collapse>
        <Collapse className="AdminSettingsTab-collapse">
          <Collapse.Panel header={t('licenseHeader')} key="license">
            <div className="AdminSettingsTab-collapseInfo">{t('licenseInfo')}</div>
            <LicenseSettings license={settings.license} onChange={handleLicenseChange} />
          </Collapse.Panel>
        </Collapse>
        <Button
          type="primary"
          loading={isSaving}
          onClick={handleSaveButtonClick}
          className="AdminSettingsTab-saveButton"
          disabled={isLoading || !isDirty}
          >
          {t('common:save')}
        </Button>
      </Spin>
    </div>
  );
}

AdminSettingsTab.propTypes = {
  onDirtyStateChange: PropTypes.func.isRequired
};

export default AdminSettingsTab;
