import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import clipboardCopy from 'clipboard-copy';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { Button, Slider, message } from 'antd';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import permissions from '../../domain/permissions.js';
import { withLanguage } from '../language-context.js';
import { withPageName } from '../page-name-context.js';
import { withTranslation, Trans } from 'react-i18next';
import { HARD_DELETE } from '../../ui/section-actions.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import DocumentApiClient from '../../services/document-api-client.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import { ALERT_TYPE, DOCUMENT_ORIGIN } from '../../common/constants.js';
import { confirmDocumentRevisionRestoration } from '../confirmation-dialogs.js';
import { PaperClipOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { documentRevisionShape, translationProps, languageProps, userProps, pageNameProps } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

class Doc extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      revisions: props.initialState.documentRevisions,
      currentRevision: props.initialState.documentRevisions[props.initialState.documentRevisions.length - 1]
    };
  }

  handleEditClick() {
    const { currentRevision } = this.state;
    window.location = urls.getEditDocUrl(currentRevision.key);
  }

  formatRevisionTooltip(index) {
    const { languageNameProvider, language, t, formatDate } = this.props;
    const revision = this.state.revisions[index];
    const languageName = languageNameProvider.getData(language)[revision.language].name;

    return (
      <div>
        <div>{t('revision')}: <b>{index + 1}</b></div>
        <div>{t('date')}: <b>{formatDate(revision.createdOn)}</b></div>
        <div>{t('language')}: <b>{languageName}</b></div>
        <div>{t('user')}: <b>{revision.createdBy.username}</b></div>
        <div>{t('id')}: <b>{revision._id}</b></div>
        {revision.restoredFrom && <div style={{ whiteSpace: 'nowrap' }}>{t('restoredFrom')}: <b>{revision.restoredFrom}</b></div>}
      </div>
    );
  }

  handleIndexChanged(index) {
    this.setState(prevState => ({ currentRevision: prevState.revisions[index] }));
  }

  async handlePermalinkRequest() {
    const { t } = this.props;
    const { currentRevision } = this.state;
    const permalinkUrl = urls.createFullyQualifiedUrl(urls.getDocumentRevisionUrl(currentRevision._id));
    try {
      await clipboardCopy(permalinkUrl);
      message.success(t('permalinkCopied'));
    } catch (error) {
      const msg = (
        <span>
          <span>{t('permalinkCouldNotBeCopied')}:</span>
          <br />
          <a href={permalinkUrl}>{permalinkUrl}</a>
        </span>
      );
      message.error(msg, 10);
    }
  }

  handleRestoreButtonClick() {
    const { documentApiClient, t } = this.props;
    const { currentRevision } = this.state;

    confirmDocumentRevisionRestoration(
      t,
      currentRevision,
      async () => {
        try {
          const { documentRevisions } = await documentApiClient.restoreDocumentRevision({
            documentKey: currentRevision.key,
            revisionId: currentRevision._id
          });

          this.setState({
            revisions: documentRevisions,
            currentRevision: documentRevisions[documentRevisions.length - 1]
          });
        } catch (error) {
          errorHelper.handleApiError({ error, logger, t });
          throw error;
        }
      }
    );
  }

  handleAction({ name, data }) {
    switch (name) {
      case HARD_DELETE:
        return this.hardDelete(data);
      default:
        throw new Error(`Unknown action ${name}`);
    }
  }

  async hardDelete({ sectionKey, sectionRevision, reason, deleteAllRevisions }) {
    const { documentApiClient, t } = this.props;
    const { currentRevision } = this.state;
    const documentKey = currentRevision.key;
    try {
      await documentApiClient.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions });
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }

    const { documentRevisions } = await documentApiClient.getDocumentRevisions(documentKey);
    this.setState(prevState => ({
      revisions: documentRevisions,
      currentRevision: documentRevisions.find(revision => revision._id === prevState.currentRevision._id)
    }));
  }

  render() {
    const { pageName, user, t, PageTemplate } = this.props;
    const { revisions, currentRevision } = this.state;

    const marks = revisions.reduce((accu, item, index) => {
      accu[index] = index === 0 || index === revisions.length - 1 ? (index + 1).toString() : '';
      return accu;
    }, {});

    const currentRevisionIndex = revisions.indexOf(currentRevision);
    const isCurrentRevisionLatestRevision = currentRevisionIndex === revisions.length - 1;

    const isExternalDocument = this.state.currentRevision.origin.startsWith(DOCUMENT_ORIGIN.external);
    const isEditingDisabled = this.state.currentRevision.archived || isExternalDocument;

    const revisionPicker = (
      <div className="DocPage-revisionPicker">
        <div className="DocPage-revisionPickerLabel">{t('revision')}:</div>
        <div className="DocPage-revisionPickerSlider">
          <Slider
            min={0}
            max={revisions.length - 1}
            value={currentRevisionIndex}
            step={null}
            marks={marks}
            onChange={this.handleIndexChanged}
            tipFormatter={this.formatRevisionTooltip}
            />
        </div>
        <div className="DocPage-revisionPickerButtons">
          <Button
            className="DocPage-revisionPickerButton"
            type="primary"
            icon={<PaperClipOutlined />}
            onClick={this.handlePermalinkRequest}
            >
            {t('permalink')}
          </Button>
          {!isExternalDocument && (
            <Restricted to={permissions.RESTORE_DOC_REVISIONS}>
              <Button
                className="DocPage-revisionPickerButton"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleRestoreButtonClick}
                disabled={isCurrentRevisionLatestRevision}
                >
                {t('restore')}
              </Button>
            </Restricted>
          )}
        </div>
      </div>
    );

    const alerts = getGlobalAlerts(pageName, user);
    if (currentRevision.archived) {
      alerts.push({
        message: t('common:archivedAlert'),
        type: ALERT_TYPE.warning
      });
    }

    if (isExternalDocument) {
      alerts.push({
        message:
          (<Trans
            t={t}
            i18nKey="common:externalDocumentWarning"
            components={[<a key="external-document-warning" href={this.state.currentRevision.originUrl} />]}
            />),
        type: 'warning'
      });
    }

    const headerActions = [];
    if (!isEditingDisabled) {
      headerActions.push({
        key: 'edit',
        type: 'primary',
        icon: EditOutlined,
        text: t('common:edit'),
        permission: permissions.EDIT_DOC,
        handleClick: this.handleEditClick
      });
    }

    return (
      <PageTemplate headerActions={headerActions} alerts={alerts}>
        <div className="DocPage">
          {revisionPicker}
          <DocView
            documentOrRevision={currentRevision}
            onAction={this.handleAction}
            />
        </div>
      </PageTemplate>
    );
  }
}

Doc.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  ...translationProps,
  ...languageProps,
  ...userProps,
  ...pageNameProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documentRevisions: PropTypes.arrayOf(documentRevisionShape)
  }).isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired
};

export default withTranslation('doc')(withLanguage(withUser(withPageName(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Doc)))));
