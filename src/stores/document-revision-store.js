import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';

class DocumentRevisionStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRevisions;
  }

  getDocumentRevisionById(documentRevisionId, { session } = {}) {
    return this.collection.findOne({ _id: documentRevisionId }, { session });
  }

  getAllDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { sort: [['order', 1]], session }).toArray();
  }

  getAllCdnResourcesReferencedFromDocumentRevisions() {
    return this.collection.distinct('cdnResources', {});
  }

  saveDocumentRevision(documentRevision, { session } = {}) {
    validate(documentRevision, documentRevisionDBSchema);
    return this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true });
  }

  saveDocumentRevisions(documentRevisions, { session } = {}) {
    documentRevisions.forEach(documentRevision => validate(documentRevision, documentRevisionDBSchema));
    return Promise.all(documentRevisions
      .map(documentRevision => this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true })));
  }

  deleteDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteMany({ documentId }, { session });
  }

  deleteDocumentsByRoomId(roomId, { session }) {
    return this.collection.deleteMany({ roomId }, { session });
  }
}

export default DocumentRevisionStore;
