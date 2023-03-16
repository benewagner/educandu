import joi from 'joi';
import by from 'thenby';
import httpErrors from 'http-errors';
import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import Cdn from '../repositories/cdn.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import BatchStore from '../stores/batch-store.js';
import EventStore from '../stores/event-store.js';
import { isRoomOwner } from '../utils/room-utils.js';
import CommentStore from '../stores/comment-store.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { createTagSearchQuery } from '../utils/tag-utils.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { DOCUMENT_VERIFIED_RELEVANCE_POINTS } from '../domain/constants.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import { documentDBSchema, documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';
import { checkRevisionOnDocumentCreation, checkRevisionOnDocumentUpdate } from '../utils/revision-utils.js';
import { createSectionRevision, extractCdnResources, validateSection, validateSections } from './section-helper.js';

const logger = new Logger(import.meta.url);

const { BadRequest, Forbidden, NotFound } = httpErrors;

class DocumentService {
  static dependencies = [
    Cdn,
    DocumentRevisionStore,
    DocumentOrderStore,
    DocumentStore,
    RoomStore,
    CommentStore,
    BatchStore,
    TaskStore,
    LockStore,
    TransactionRunner,
    PluginRegistry,
    EventStore
  ];

  constructor(
    cdn,
    documentRevisionStore,
    documentOrderStore,
    documentStore,
    roomStore,
    commentStore,
    batchStore,
    taskStore,
    lockStore,
    transactionRunner,
    pluginRegistry,
    eventStore
  ) {
    this.cdn = cdn;
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
    this.commentStore = commentStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.pluginRegistry = pluginRegistry;
    this.eventStore = eventStore;
  }

  async getAllPublicDocumentsMetadata({ includeArchived } = {}) {
    const conditions = [{ roomId: null }];
    if (includeArchived === false) {
      conditions.push({ 'publicContext.archived': false });
    }
    const documentsMetadata = await this.documentStore.getDocumentsExtendedMetadataByConditions(conditions);
    return documentsMetadata.sort(by(doc => doc.updatedBy, 'desc'));
  }

  async getTopDocumentTags({ maxCount = 0 } = { maxCount: 0 }) {
    const conditions = [
      { roomId: null },
      { 'publicContext.archived': false }
    ];

    const tagMap = new Map();
    const documentsTags = await this.documentStore.getDocumentsTagsByConditions(conditions);

    for (const doc of documentsTags) {
      for (const tag of doc.tags) {
        const tagData = tagMap.get(tag) || { key: tag, frequency: 0 };
        tagData.frequency += 1;
        tagMap.set(tag, tagData);
      }
    }

    const tagsData = [...tagMap.values()];

    return tagsData
      .sort(by(tagData => tagData.frequency, 'desc'))
      .map(tagData => tagData.key)
      .slice(0, maxCount);
  }

  async getDocumentsMetadataBySlug(slug) {
    const documentsMetadata = await this.documentStore.getDocumentsMetadataBySlug(slug);
    return documentsMetadata.sort(by(doc => doc.createdOn, 'asc'));
  }

  async getPublicNonArchivedDocumentsByContributingUser(contributingUserId) {
    const documentsMetadata = await this.documentStore.getPublicNonArchivedDocumentsByContributingUser(contributingUserId);
    const sortedDocumentsMetadata = documentsMetadata
      .map(doc => {
        const userIsMidContributorOnly = doc.createdBy !== contributingUserId && doc.updatedBy !== contributingUserId;
        const userIsFirstContributor = doc.createdBy === contributingUserId;
        const userIsLastContributor = doc.updatedBy === contributingUserId;

        if (userIsMidContributorOnly) {
          doc.relevance = 0;
        }
        if (userIsFirstContributor) {
          doc.relevance = 1;
        }
        if (userIsLastContributor) {
          doc.relevance = 2;
        }
        return doc;
      })
      .sort(by(doc => doc.relevance, 'desc').thenBy(doc => doc.updatedOn, 'desc'))
      .map(doc => {
        delete doc.relevance;
        return doc;
      });

    return sortedDocumentsMetadata;
  }

  async getSearchableDocumentsMetadataByTags(searchQuery) {
    const tagQuery = createTagSearchQuery(searchQuery);
    if (!tagQuery.isValid) {
      return [];
    }

    const queryConditions = [
      { roomId: null },
      { 'publicContext.archived': false },
      tagQuery.query
    ];

    const documents = await this.documentStore.getDocumentsExtendedMetadataByConditions(queryConditions);

    return documents.map(document => {
      const tagMatchCount = document.tags.filter(tag => tagQuery.positiveTokens.has(tag.toLowerCase())).length;
      const verifiedPoints = document.publicContext.verified ? DOCUMENT_VERIFIED_RELEVANCE_POINTS : 0;
      const relevance = tagMatchCount + verifiedPoints;
      return { ...document, relevance };
    });
  }

  getDocumentById(documentId) {
    return this.documentStore.getDocumentById(documentId);
  }

  getAllDocumentRevisionsByDocumentId(documentId) {
    return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
  }

  getDocumentsMetadataByRoomId(roomId) {
    return this.documentStore.getDocumentsMetadataByRoomId(roomId);
  }

  getDocumentsMetadataByIds(documentIds) {
    return this.documentStore.getDocumentsMetadataByIds(documentIds);
  }

  getDocumentsExtendedMetadataByIds(documentIds) {
    return this.documentStore.getDocumentsExtendedMetadataByIds(documentIds);
  }

  getDocumentRevisionById(documentRevisionId) {
    return this.documentRevisionStore.getDocumentRevisionById(documentRevisionId);
  }

  getDocumentTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    return this.documentStore.getDocumentTagsMatchingText(sanitizedSearchString);
  }

  async findDocumentsMetadataInSearchableDocuments({ query }) {
    const sanitizedQuery = escapeStringRegexp(query.trim());

    const queryConditions = [
      { roomId: null },
      { 'publicContext.archived': false }
    ];

    if (sanitizedQuery) {
      queryConditions.push({ title: { $regex: sanitizedQuery, $options: 'i' } });
    }

    const documentsMetadata = await this.documentStore.getDocumentsMetadataByConditions(queryConditions);

    return documentsMetadata;
  }

  async createDocument({ data, user, silentCreation = false }) {
    let roomLock;
    let documentLock;
    const documentId = uniqueId.create();

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);
      if (data.roomId) {
        roomLock = await this.lockStore.takeRoomLock(data.roomId);
      }

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (existingDocumentRevisions.length) {
          throw new BadRequest(`Found unexpected existing revisions for document ${documentId}`);
        }

        const newRevision = this._buildDocumentRevision({
          ...data,
          _id: null,
          documentId,
          createdBy: user._id
        });

        let room;
        if (newRevision.roomId) {
          room = await this.roomStore.getRoomById(newRevision.roomId, { session });
          room.documents = ensureIsIncluded(room.documents, documentId);
        } else {
          room = null;
        }

        try {
          checkRevisionOnDocumentCreation({ newRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newRevision.order = await this.documentOrderStore.getNextOrder();
        newDocument = this._buildDocumentFromRevisions([newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        if (!silentCreation) {
          await this.eventStore.recordRevisionCreatedEvent({ revision: newRevision, user }, { session });
        }
        await this.documentStore.saveDocument(newDocument, { session });
        if (room) {
          await this.roomStore.saveRoom(room, { session });
        }
      });

      return newDocument;
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
      if (roomLock) {
        await this.lockStore.releaseLock(roomLock);
      }
    }
  }

  async updateDocument({ documentId, data, user, silentUpdate = false }) {
    let documentLock;

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (!existingDocumentRevisions.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentId}`);
        }

        const previousRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        const newRevision = this._buildDocumentRevision({
          ...cloneDeep(previousRevision),
          ...data,
          _id: null,
          documentId,
          createdOn: null,
          createdBy: user._id,
          sections: data.sections?.map(section => createSectionRevision({
            section,
            ancestorSection: previousRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: false
          })) || cloneDeep(previousRevision.sections)
        });

        const room = newRevision.roomId ? await this.roomStore.getRoomById(newRevision.roomId, { session }) : null;

        try {
          checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newRevision.order = await this.documentOrderStore.getNextOrder();
        newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        if (!silentUpdate) {
          await this.eventStore.recordRevisionCreatedEvent({ revision: newRevision, user }, { session });
        }
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return newDocument;
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
    }
  }

  updateDocumentMetadata({ documentId, metadata, user }) {
    return this.updateDocument({ documentId, data: metadata, user });
  }

  updateDocumentSections({ documentId, sections, user }) {
    const data = { sections };
    return this.updateDocument({ documentId, data, user });
  }

  updateArchivedState({ documentId, user, archived }) {
    const data = { publicContext: { archived } };
    return this.updateDocument({ documentId, data, user, silentUpdate: true });
  }

  async hardDeletePrivateDocument({ documentId, user }) {
    let roomLock;
    let documentLock;

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);

      logger.info(`Hard deleting document '${documentId}'`);

      await this.transactionRunner.run(async session => {
        const doc = await this.documentStore.getDocumentById(documentId, { session });
        if (!doc.roomId) {
          throw new Forbidden('Cannot delete public documents');
        }

        roomLock = await this.lockStore.takeRoomLock(doc.roomId);
        const room = await this.roomStore.getRoomById(doc.roomId, { session });
        if (!isRoomOwner({ room, userId: user._id })) {
          throw new Forbidden('Only room owners can delete room documents');
        }

        room.documents = ensureIsExcluded(room.documents, doc._id);
        await this.roomStore.saveRoom(room, { session });
        await this.documentStore.deleteDocumentById(documentId, { session });
        await this.documentRevisionStore.deleteDocumentRevisionsByDocumentId(documentId, { session });
        await this.commentStore.deleteCommentsByDocumentId(documentId, { session });
      });
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
      if (roomLock) {
        await this.lockStore.releaseLock(roomLock);
      }
    }
  }

  async hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    let lock;

    if (!hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)) {
      throw new Forbidden('User is not allowed to delete document sections');
    }

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      let latestDocument;
      await this.transactionRunner.run(async session => {
        const revisionsBeforeDelete = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        if (!revisionsBeforeDelete.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentId}`);
        }

        const revisionsAfterDelete = [];
        const revisionsToUpdateById = new Map();

        for (const originalRevision of revisionsBeforeDelete) {
          let currentRevision = originalRevision;

          for (const section of currentRevision.sections) {
            if (section.key === sectionKey && !section.deletedOn && (section.revision === sectionRevision || deleteAllRevisions)) {
              section.deletedOn = new Date();
              section.deletedBy = user._id;
              section.deletedBecause = reason;
              section.content = null;

              currentRevision = this._buildDocumentRevision({ ...currentRevision });

              revisionsToUpdateById.set(currentRevision._id, currentRevision);
            }
          }

          revisionsAfterDelete.push(currentRevision);
        }

        if (revisionsToUpdateById.size) {
          logger.info(`Hard deleting ${revisionsToUpdateById.size} sections with section key ${sectionKey} in document revisions with documentId ${documentId}`);
          await this.documentRevisionStore.saveDocumentRevisions([...revisionsToUpdateById.values()]);
        } else {
          throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for documentId ${documentId}`);
        }

        latestDocument = this._buildDocumentFromRevisions(revisionsAfterDelete, { session });

        logger.info(`Saving latest document with revision ${latestDocument.revision}`);
        await this.documentStore.saveDocument(latestDocument, { session });
      });

      return latestDocument;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async restoreDocumentRevision({ documentId, revisionId, user }) {
    let lock;

    if (!hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)) {
      throw new Forbidden('User is not allowed to restore document revisions');
    }

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        const revisionToRestore = existingDocumentRevisions.find(rev => rev._id === revisionId);
        if (!revisionToRestore) {
          throw new Error(`Revision ${revisionId} is not valid`);
        }

        const previousRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (revisionToRestore._id === previousRevision._id) {
          throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
        }

        const clonedRevision = cloneDeep(revisionToRestore);

        const newRevision = this._buildDocumentRevision({
          ...clonedRevision,
          _id: null,
          documentId,
          createdOn: null,
          createdBy: user._id,
          restoredFrom: revisionToRestore._id,
          sections: clonedRevision.sections.map(section => createSectionRevision({
            section,
            ancestorSection: previousRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: true
          }))
        });

        const room = newRevision.roomId ? await this.roomStore.getRoomById(newRevision.roomId, { session }) : null;

        try {
          checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newRevision.order = await this.documentOrderStore.getNextOrder();
        const newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        await this.eventStore.recordRevisionCreatedEvent({ revision: newRevision, user }, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async regenerateDocument(documentId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        const document = this._buildDocumentFromRevisions(existingDocumentRevisions);

        logger.info(`Saving document '${documentId}' with revision ${document.revision}`);
        await this.documentStore.saveDocument(document, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async validateDocument(documentId) {
    const errorCases = [];
    const validationOptions = { abortEarly: false, convert: false, noDefaults: true };

    const doc = await this.documentStore.getDocumentById(documentId);
    try {
      joi.attempt(doc, documentDBSchema, validationOptions);
    } catch (error) {
      errorCases.push({
        ...error,
        documentId: doc._id
      });
    }

    for (const section of doc.sections) {
      try {
        validateSection(section, this.pluginRegistry);
      } catch (error) {
        errorCases.push({
          ...error,
          documentId: doc._id,
          sectionKey: section.key
        });
      }
    }

    const revisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
    for (const revision of revisions) {
      try {
        joi.attempt(revision, documentRevisionDBSchema, validationOptions);
      } catch (error) {
        errorCases.push({
          ...error,
          documentId: doc._id
        });
      }

      for (const section of revision.sections) {
        try {
          validateSection(section, this.pluginRegistry);
        } catch (error) {
          errorCases.push({
            ...error,
            documentRevisionId: revision._id,
            sectionKey: section.key
          });
        }
      }
    }

    if (errorCases.length) {
      const err = new Error(`Error validating document with ID ${documentId}`);
      err.cases = errorCases;
      err.isIrrecoverable = true;
      throw err;
    }
  }

  async consolidateCdnResources(documentId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const [existingDocumentRevisions, existingDocument] = await Promise.all([
          this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session }),
          this.documentStore.getDocumentById(documentId, { session })
        ]);

        const updatedDocumentRevisions = existingDocumentRevisions.map(revision => ({
          ...revision,
          cdnResources: extractCdnResources(revision.sections, this.pluginRegistry)
        }));

        const updatedDocument = this._buildDocumentFromRevisions(updatedDocumentRevisions);

        if (!deepEqual(existingDocumentRevisions, updatedDocumentRevisions) || !deepEqual(existingDocument, updatedDocument)) {
          await Promise.all([
            this.documentRevisionStore.saveDocumentRevisions(updatedDocumentRevisions, { session }),
            this.documentStore.saveDocument(updatedDocument, { session })
          ]);
        }
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  _buildDocumentRevision(data) {
    const mappedSections = data.sections?.map(section => this._buildSection(section)) || [];
    validateSections(mappedSections, this.pluginRegistry);

    const publicContext = data.roomId
      ? null
      : {
        accreditedEditors: data.publicContext?.accreditedEditors || [],
        protected: data.publicContext?.protected || false,
        archived: data.publicContext?.archived || false,
        verified: data.publicContext?.verified || false,
        review: data.publicContext?.review || ''
      };
    const roomContext = data.roomId
      ? {
        draft: data.roomContext?.draft || false
      }
      : null;

    return {
      _id: data._id || uniqueId.create(),
      documentId: data.documentId || uniqueId.create(),
      roomId: data.roomId || null,
      order: data.order || 0,
      restoredFrom: data.restoredFrom || null,
      createdOn: data.createdOn ? new Date(data.createdOn) : new Date(),
      createdBy: data.createdBy || '',
      title: data.title || '',
      description: data.description || '',
      slug: data.slug?.trim() || '',
      language: data.language || '',
      sections: mappedSections,
      tags: data.tags || [],
      publicContext,
      roomContext,
      cdnResources: extractCdnResources(mappedSections, this.pluginRegistry)
    };
  }

  _buildSection(data) {
    return {
      key: data.key || uniqueId.create(),
      revision: data.revision || uniqueId.create(),
      deletedOn: data.deletedOn ? new Date(data.deletedOn) : null,
      deletedBy: data.deletedBy ? data.deletedBy : null,
      deletedBecause: data.deletedBecause ? data.deletedBecause : null,
      type: data.type,
      content: data.content || null
    };
  }

  _buildDocumentFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = [...new Set(revisions.map(r => r.createdBy))];

    return {
      _id: lastRevision.documentId,
      roomId: lastRevision.roomId,
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
      publicContext: cloneDeep(lastRevision.publicContext) || null,
      roomContext: cloneDeep(lastRevision.roomContext) || null,
      cdnResources: lastRevision.cdnResources
    };
  }
}

export default DocumentService;
