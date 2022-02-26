import by from 'thenby';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import BatchStore from '../stores/batch-store.js';
import InfoFactory from '../plugins/info-factory.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import { createSectionRevision } from './section-helper.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { BATCH_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const { BadRequest } = httpErrors;
class DocumentService {
  static get inject() {
    return [
      DocumentRevisionStore,
      DocumentOrderStore,
      DocumentStore,
      BatchStore,
      TaskStore,
      LockStore,
      TransactionRunner,
      InfoFactory
    ];
  }

  constructor(documentRevisionStore, documentOrderStore, documentStore, batchStore, taskStore, lockStore, transactionRunner, infoFactory) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentStore = documentStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.infoFactory = infoFactory;
  }

  async getAllDocumentsMetadata({ includeArchived } = {}) {
    const documentsMetadata = includeArchived
      ? await this.documentStore.getAllDocumentsExtendedMetadata()
      : await this.documentStore.getAllNonArchivedDocumentsExtendedMetadata();

    return documentsMetadata.sort(by(doc => doc.updatedBy, 'desc'));
  }

  async getDocumentsMetadataByTags(searchQuery) {
    const tokens = searchQuery.trim().split(/\s+/);

    const positiveTokens = new Set(tokens
      .filter(token => !token.startsWith('-'))
      .filter(token => token.length > 2)
      .map(token => escapeStringRegexp(token.toLowerCase())));

    const negativeTokens = new Set(tokens
      .filter(token => token.startsWith('-'))
      .map(token => token.substr(1))
      .filter(token => token.length > 2)
      .map(token => escapeStringRegexp(token.toLowerCase())));

    if (!positiveTokens.size) {
      return [];
    }

    const queryConditions = [
      { archived: false },
      { tags: { $regex: `.*(${[...positiveTokens].join('|')}).*`, $options: 'i' } }
    ];

    if (negativeTokens.size) {
      queryConditions.push({ tags: { $not: { $regex: `^(${[...negativeTokens].join('|')})$`, $options: 'i' } } });
    }

    const documents = await this.documentStore.getDocumentsExtendedMetadataByConditions(queryConditions);

    return documents.map(document => ({
      ...document,
      tagMatchCount: document.tags.filter(tag => positiveTokens.has(tag.toLowerCase())).length
    }));
  }

  getDocumentByKey(documentKey) {
    return this.documentStore.getDocumentByKey(documentKey);
  }

  getAllDocumentRevisionsByKey(documentKey) {
    return this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
  }

  getCurrentDocumentRevisionByKey(documentKey) {
    return this.documentRevisionStore.getLatestDocumentRevisionByKey(documentKey);
  }

  getDocumentRevisionById(id) {
    return this.documentRevisionStore.getDocumentRevisionById(id);
  }

  findRevisionTags(searchString) {
    return this.documentRevisionStore.getDocumentRevisionsTagsMatchingText(searchString);
  }

  findDocumentTags(searchString) {
    return this.documentStore.getDocumentTagsMatchingText(searchString);
  }

  async restoreDocumentRevision({ documentKey, revisionId, user }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    const revisionToRestore = await this.getDocumentRevisionById(revisionId);
    if (revisionToRestore?.key !== documentKey) {
      throw new Error(`Revision ${revisionId} is not valid`);
    }

    const latestRevision = await this.getCurrentDocumentRevisionByKey(documentKey);
    if (revisionToRestore._id === latestRevision._id) {
      throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
    }

    const doc = {
      title: revisionToRestore.title,
      description: revisionToRestore.description,
      slug: revisionToRestore.slug,
      language: revisionToRestore.language,
      sections: cloneDeep(revisionToRestore.sections),
      appendTo: {
        key: documentKey,
        ancestorId: latestRevision._id
      },
      tags: revisionToRestore.tags
    };

    await this.createNewDocumentRevision({ doc, user, restoredFrom: revisionToRestore._id });

    return this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
  }

  async hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    let lock;
    const now = new Date();
    const userId = user._id;

    try {

      logger.info(`Hard deleting sections with section key ${sectionKey} in documents with key ${documentKey}`);

      lock = await this.lockStore.takeDocumentLock(documentKey);

      const revisionsBeforeDelete = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);

      const revisionsAfterDelete = [];
      const revisionsToUpdateById = new Map();

      for (const originalRevision of revisionsBeforeDelete) {
        let finalRevision = originalRevision;

        for (const section of finalRevision.sections) {
          if (section.key === sectionKey && !section.deletedOn && (section.revision === sectionRevision || deleteAllRevisions)) {
            section.deletedOn = now;
            section.deletedBy = userId;
            section.deletedBecause = reason;
            section.content = null;

            finalRevision = this._buildDocumentRevision({
              data: finalRevision,
              revisionId: finalRevision._id,
              documentKey: finalRevision.key,
              userId: finalRevision.createdBy,
              order: finalRevision.order,
              restoredFrom: finalRevision.restoredFrom,
              sections: finalRevision.sections
            });

            revisionsToUpdateById.set(finalRevision._id, finalRevision);
          }
        }

        revisionsAfterDelete.push(finalRevision);
      }

      if (revisionsToUpdateById.size) {
        logger.info(`Hard deleting ${revisionsToUpdateById.size} sections with section key ${sectionKey} in document revisions with key ${documentKey}`);
        await this.documentRevisionStore.saveDocumentRevisions([...revisionsToUpdateById.values()]);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for key ${documentKey}`);
      }

      const latestDocument = this._buildDocumentFromRevisions(revisionsAfterDelete);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.saveDocument(latestDocument);

    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async hardDeleteDocument(documentKey) {
    const document = await this.getDocumentByKey(documentKey);

    if (!document.origin.startsWith(DOCUMENT_ORIGIN.external)) {
      throw new Error(`Only external documents can be hard deleted. Document '${documentKey}' has origin '${document.origin}'`);
    }

    let lock;
    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      logger.info(`Hard deleting external document '${documentKey}'`);

      await this.transactionRunner.run(async session => {
        await this.documentStore.deleteDocumentByKey(documentKey, { session });
        await this.documentRevisionStore.deleteDocumentRevisionsByKey(documentKey, { session });
      });

    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async setArchivedState({ documentKey, user, archived }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    const latestRevision = await this.getCurrentDocumentRevisionByKey(documentKey);

    const doc = {
      title: latestRevision.title,
      description: latestRevision.description,
      slug: latestRevision.slug,
      language: latestRevision.language,
      sections: latestRevision.sections,
      appendTo: {
        key: documentKey,
        ancestorId: latestRevision._id
      },
      tags: latestRevision.tags,
      archived
    };

    return this.createNewDocumentRevision({ doc, user });
  }

  async createNewDocumentRevision({ doc, user, restoredFrom = null }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    let lock;
    const userId = user._id;
    const isAppendedRevision = !!doc.appendTo;
    const ancestorId = isAppendedRevision ? doc.appendTo.ancestorId : null;
    const documentKey = isAppendedRevision ? doc.appendTo.key : uniqueId.create();

    try {

      let existingDocumentRevisions;
      let ancestorRevision;

      logger.info(`Creating new document revision for document key ${documentKey}`);

      lock = await this.lockStore.takeDocumentLock(documentKey);

      if (isAppendedRevision) {
        existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
        if (!existingDocumentRevisions.length) {
          throw new Error(`Cannot append new revision for key ${documentKey}, because there are no existing revisions`);
        }

        logger.info(`Found ${existingDocumentRevisions.length} existing revisions for key ${documentKey}`);
        ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision._id !== ancestorId) {
          throw new Error(`Ancestor id ${ancestorId} is not the latest revision`);
        }

        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new Error(`Ancestor id ${ancestorId} is not an internal document`);
        }
      } else {
        existingDocumentRevisions = [];
        ancestorRevision = null;
      }

      const newSections = doc.sections.map(section => createSectionRevision({
        section,
        ancestorSection: ancestorRevision?.sections.find(s => s.key === section.key) || null,
        isRestoreOperation: !!restoredFrom
      }));

      const order = await this.documentOrderStore.getNextOrder();
      const newDocumentRevision = this._buildDocumentRevision({ data: doc, documentKey, userId, order, restoredFrom, sections: newSections });
      logger.info(`Saving new document revision with id ${newDocumentRevision._id}`);

      await this.documentRevisionStore.saveDocumentRevision(newDocumentRevision);

      const latestDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.saveDocument(latestDocument);

      return newDocumentRevision;

    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async copyDocumentRevisions({ revisions, ancestorId, origin, originUrl }) {
    let lock;
    const newDocumentRevisions = [];
    const documentKey = revisions[0].key;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      await this.transactionRunner.run(async session => {

        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });
        const latestExistingRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (!ancestorId && latestExistingRevision) {
          throw new Error(`Found unexpected existing revisions for document '${documentKey}'`);
        }

        if (ancestorId && latestExistingRevision?._id !== ancestorId) {
          throw new Error(`Import of document '${documentKey}' expected to find revision '${ancestorId}' as the latest revision but found revision '${latestExistingRevision?._id}'`);
        }

        for (const revision of revisions) {
          const data = { ...revision, origin, originUrl };

          // eslint-disable-next-line no-await-in-loop
          const order = await this.documentOrderStore.getNextOrder();

          newDocumentRevisions.push(this._buildDocumentRevision({
            data,
            revisionId: revision._id,
            documentKey,
            userId: revision.createdBy,
            order,
            restoredFrom: revision.restoredFrom,
            sections: cloneDeep(revision.sections)
          }));
        }

        logger.info(`Saving revisions for document '${documentKey}'`);
        await this.documentRevisionStore.saveDocumentRevisions(newDocumentRevisions);

        const document = this._buildDocumentFromRevisions([...existingDocumentRevisions, ...newDocumentRevisions]);

        logger.info(`Saving document '${documentKey}' with revision ${document.revision}`);
        await this.documentStore.saveDocument(document, { session });
      });

      return newDocumentRevisions;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async regenerateDocument(documentKey) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });

        const document = this._buildDocumentFromRevisions(existingDocumentRevisions);

        logger.info(`Saving document '${documentKey}' with revision ${document.revision}`);
        await this.documentStore.saveDocument(document, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async createDocumentRegenerationBatch(user) {
    const existingActiveBatch = await this.batchStore.getUncompleteBatchByType(BATCH_TYPE.documentRegeneration);

    if (existingActiveBatch) {
      throw new BadRequest('Another document regeneration batch is already in progress');
    }

    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.documentRegeneration,
      batchParams: {},
      errors: []
    };

    const allDocumentKeys = await this.documentStore.getAllDocumentKeys();
    const tasks = allDocumentKeys.map(key => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.documentRegeneration,
      processed: false,
      attempts: [],
      taskParams: {
        key
      }
    }));

    await this.transactionRunner.run(async session => {
      await this.batchStore.createBatch(batch, { session });
      await this.taskStore.addTasks(tasks, { session });
    });

    return batch;
  }

  _buildDocumentRevision({ data, revisionId, documentKey, userId, order, restoredFrom, sections }) {
    logger.info(`Creating new revision for document key ${documentKey} with order ${order}`);

    const createdOn = data.createdOn ? new Date(data.createdOn) : new Date();

    const mappedSections = sections.map(section => ({
      ...section,
      deletedOn: section.deletedOn ? new Date(section.deletedOn) : section.deletedOn
    }));

    return {
      _id: revisionId || uniqueId.create(),
      key: documentKey,
      order,
      restoredFrom: restoredFrom || '',
      createdOn,
      createdBy: userId || '',
      title: data.title || '',
      description: data.description || '',
      slug: data.slug?.trim() || '',
      language: data.language || '',
      sections: mappedSections,
      tags: data.tags || [],
      archived: data.archived || false,
      origin: data.origin || DOCUMENT_ORIGIN.internal,
      originUrl: data.originUrl || '',
      cdnResources: this._getCdnResources(sections)
    };
  }

  _buildDocumentFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = Array.from(new Set(revisions.map(r => r.createdBy)));

    return {
      _id: lastRevision.key,
      key: lastRevision.key,
      order: lastRevision.order,
      revision: lastRevision._id,
      createdOn: firstRevision.createdOn,
      createdBy: firstRevision.createdBy,
      updatedOn: lastRevision.createdOn,
      updatedBy: lastRevision.createdBy,
      title: lastRevision.title,
      description: lastRevision.description,
      slug: lastRevision.slug,
      language: lastRevision.language,
      sections: lastRevision.sections,
      contributors,
      tags: lastRevision.tags,
      archived: lastRevision.archived,
      origin: lastRevision.origin,
      originUrl: lastRevision.originUrl,
      cdnResources: lastRevision.cdnResources
    };
  }

  _getCdnResources(sections) {
    return [
      ...sections.reduce((cdnResources, section) => {
        const info = this.infoFactory.tryCreateInfo(section.type);
        if (info && section.content) {
          info.getCdnResources(section.content)
            .forEach(resource => {
              if (resource) {
                cdnResources.add(resource);
              }
            });
        }
        return cdnResources;
      }, new Set())
    ];
  }
}

export default DocumentService;
