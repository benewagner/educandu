import by from 'thenby';
import Table from '../table.js';
import PropTypes from 'prop-types';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../../ui/error-helper.js';
import { useSettings } from '../settings-context.js';
import SortingSelector from '../sorting-selector.js';
import { Input, Button, Switch, Tooltip } from 'antd';
import DocumentInfoCell from '../document-info-cell.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import LanguageIcon from '../localization/language-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { LikeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOCUMENT_ORIGIN, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';

const { Search } = Input;
const logger = new Logger(import.meta.url);

function getDocumentMetadataModalState({ documentToClone, settings, t }) {
  return {
    isVisible: false,
    cloneDocumentId: documentToClone?._id,
    templateDocumentId: documentToClone ? null : settings.templateDocument?.documentId,
    initialDocumentMetadata: documentToClone
      ? {
        ...documentToClone,
        title: `${documentToClone.title} ${t('common:copyTitleSuffix')}`,
        slug: documentToClone.slug ? `${documentToClone.slug}-${t('common:copySlugSuffix')}` : '',
        tags: [...documentToClone.tags]
      }
      : {}
  };
}

const getOriginTranslated = ({ t, origin }) => {
  if (origin === DOCUMENT_ORIGIN.internal) {
    return t('originInternal');
  }

  if (origin.startsWith(DOCUMENT_ORIGIN.external)) {
    const nameOfOrigin = origin.split(DOCUMENT_ORIGIN.external)[1];
    return `${t('originExternal')}${nameOfOrigin}`;
  }

  return origin || '';
};

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const settings = useSettings();
  const { t } = useTranslation('docs');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const mapToRows = useCallback(docs => docs.map(doc => (
    {
      key: doc._id,
      _id: doc._id,
      documentId: doc._id,
      title: doc.title,
      createdOn: doc.createdOn,
      updatedOn: doc.updatedOn,
      createdBy: doc.createdBy,
      language: doc.language,
      user: doc.user,
      origin: doc.origin,
      originTranslated: getOriginTranslated({ t, origin: doc.origin }),
      archived: doc.archived,
      verified: doc.verified,
      allowedOpenContribution: doc.allowedOpenContribution
    })), [t]);

  const [filterText, setFilterText] = useState('');
  const [displayedRows, setDisplayedRows] = useState([]);
  const [documents, setDocuments] = useState(initialState.documents);
  const [sorting, setSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ settings, t }));

  const sortingOptions = [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:user'), appliedLabel: t('common:sortedByUser'), value: 'user' },
    { label: t('common:origin'), appliedLabel: t('common:sortedByOrigin'), value: 'origin' }
  ];

  if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
    sortingOptions.push({ label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' });
  }

  const sorters = useMemo(() => ({
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, sorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.language, sorting.direction)),
    user: rowsToSort => rowsToSort.sort(by(row => row.createdBy.displayName, { direction: sorting.direction, ignoreCase: true })),
    origin: rowsToSort => rowsToSort.sort(by(row => row.origin, { direction: sorting.direction, ignoreCase: true })),
    archived: rowsToSort => rowsToSort.sort(by(row => row.archived, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    const newRows = mapToRows(documents.slice());
    const sorter = sorters[sorting.value];

    const filteredRows = filterText
      ? newRows.filter(row => row.title.toLowerCase().includes(filterText.toLowerCase())
        || row.createdBy.displayName.toLowerCase().includes(filterText.toLowerCase()))
      : newRows;
    const sortedRows = sorter ? sorter(filteredRows) : filteredRows;

    setDisplayedRows(sortedRows);
  }, [documents, sorting, filterText, sorters, mapToRows]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const handleSearchChange = event => {
    const newFilterText = event.target.value;
    setFilterText(newFilterText);
  };

  const handleNewDocumentClick = () => {
    setDocumentMetadataModalState({ ...getDocumentMetadataModalState({ settings, t }), isVisible: true });
  };

  const handleCloneClick = row => {
    const documentToClone = documents.find(d => d._id === row.documentId);
    setDocumentMetadataModalState({ ...getDocumentMetadataModalState({ documentToClone, settings, t }), isVisible: true });
  };

  const handleDocumentMetadataModalSave = (createdDocuments, templateDocumentId) => {
    setDocumentMetadataModalState(prev => ({ ...prev, isVisible: false }));

    window.location = routes.getDocUrl({
      id: createdDocuments[0]._id,
      slug: createdDocuments[0].slug,
      view: DOC_VIEW_QUERY_PARAM.edit,
      templateDocumentId: documentMetadataModalState.cloneDocumentId || templateDocumentId
    });
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isVisible: false }));
  };

  const handleDocumentDelete = async documentId => {
    try {
      await documentApiClient.hardDeleteDocument(documentId);
      setDocuments(documents.filter(doc => doc._id !== documentId));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleDeleteClick = row => {
    confirmDocumentDelete(t, row.title, () => handleDocumentDelete(row._id));
  };

  const handleArchivedSwitchChange = async (archived, row) => {
    try {
      const { doc } = archived
        ? await documentApiClient.unarchiveDocument(row.documentId)
        : await documentApiClient.archiveDocument(row.documentId);

      const newDocuments = documents.slice();
      newDocuments
        .filter(document => document._id === doc._id)
        .forEach(document => { document.archived = doc.archived; });

      setDocuments(newDocuments);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const renderOrigin = originTranslated => <span>{originTranslated}</span>;
  const renderLanguage = documentLanguage => <LanguageIcon language={documentLanguage} />;
  const renderTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return <DocumentInfoCell doc={doc} />;
  };

  const renderCreatedBy = (_user, row) => {
    return <a href={routes.getUserUrl(row.createdBy._id)}>{row.createdBy.displayName}</a>;
  };

  const renderActions = (_actions, row) => {
    return (
      <div className="DocsPage-actions">
        <ActionButtonGroup>
          <ActionButton
            title={t('common:clone')}
            icon={<DuplicateIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleCloneClick(row)}
            />
          {row.origin.startsWith(DOCUMENT_ORIGIN.external) && (
            <Restricted to={permissions.MANAGE_IMPORT}>
              <ActionButton
                title={t('common:delete')}
                icon={<DeleteIcon />}
                intent={ACTION_BUTTON_INTENT.error}
                onClick={() => handleDeleteClick(row)}
                />
            </Restricted>
          )}
        </ActionButtonGroup>
      </div>
    );
  };

  const renderArchived = (archived, row) => {
    const disableArchiving = row.origin !== DOCUMENT_ORIGIN.internal;
    return (
      <Switch
        size="small"
        checked={row.archived}
        disabled={disableArchiving}
        onChange={() => handleArchivedSwitchChange(archived, row)}
        />
    );
  };

  const renderBadges = (_, row) => {
    return (
      <div className="DocsPage-badges">
        {!!row.verified && (
          <Tooltip title={t('common:verifiedDocumentBadge')}>
            <LikeOutlined className="u-verified" />
          </Tooltip>
        )}
        <div className="u-allowed-open-contribution">
          <Tooltip title={t(`common:allowedOpenContributionBadge_${row.allowedOpenContribution}`)}>
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none && 'x'}
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content && 'c'}
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent && 'm'}
          </Tooltip>
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('common:language'),
      dataIndex: 'language',
      key: 'language',
      render: renderLanguage,
      responsive: ['sm'],
      width: '100px'
    },
    {
      title: t('initialAuthor'),
      dataIndex: 'user',
      key: 'user',
      render: renderCreatedBy,
      responsive: ['md'],
      width: '200px'
    },
    {
      title: t('common:origin'),
      dataIndex: 'originTranslated',
      key: 'originTranslated',
      render: renderOrigin,
      responsive: ['lg'],
      width: '200px'
    },
    {
      title: t('badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderBadges,
      responsive: ['lg'],
      width: '50px'
    },
    {
      title: t('common:archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderArchived,
      responsive: ['lg'],
      needsPermission: permissions.MANAGE_ARCHIVED_DOCS,
      width: '100px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions,
      width: '100px'
    }
  ].filter(column => !column.needsPermission || hasUserPermission(user, column.needsPermission));

  return (
    <PageTemplate>
      <div className="DocsPage">
        <h1>{t('pageNames:docs')}</h1>
        <div className="DocsPage-controls">
          <Search
            size="large"
            className="DocsPage-filter"
            value={filterText}
            enterButton={<SearchOutlined />}
            onChange={handleSearchChange}
            placeholder={t('filterPlaceholder')}
            />
          <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
        </div>
        <Table dataSource={[...displayedRows]} columns={columns} pagination />
        <aside>
          <Restricted to={permissions.EDIT_DOC}>
            <Button className="DocsPage-newDocumentButton" type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={handleNewDocumentClick} />
          </Restricted>
        </aside>
        <DocumentMetadataModal
          allowMultiple={false}
          mode={DOCUMENT_METADATA_MODAL_MODE.create}
          isVisible={documentMetadataModalState.isVisible}
          templateDocumentId={documentMetadataModalState.templateDocumentId}
          initialDocumentMetadata={documentMetadataModalState.initialDocumentMetadata}
          onSave={handleDocumentMetadataModalSave}
          onClose={handleDocumentMetadataModalClose}
          />
      </div>
    </PageTemplate>
  );
}

Docs.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired
  }).isRequired
};

export default Docs;
