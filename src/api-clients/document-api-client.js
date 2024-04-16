import HttpClient from './http-client.js';

class DocumentApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getDocument(documentId) {
    return this.httpClient
      .get(
        `/api/v1/docs/${encodeURIComponent(documentId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getSearchableDocumentsTitles({ query }) {
    return this.httpClient
      .get(
        `/api/v1/docs/titles?query=${encodeURIComponent(query || '')}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getHomepageDocuments() {
    return this.httpClient
      .get(
        '/api/v1/docs/homepage',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getMaintenanceDocuments() {
    return this.httpClient
      .get(
        '/api/v1/docs/maintenance',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getDocumentRevisions(documentId) {
    return this.httpClient
      .get(
        '/api/v1/docs',
        {
          params: { documentId },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  getDocumentTagSuggestions(tagsSuggestionQuery) {
    return this.httpClient
      .get(
        `/api/v1/docs/tags/${encodeURIComponent(tagsSuggestionQuery)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getPublicNonArchivedDocumentsByContributingUser(userId) {
    return this.httpClient
      .get(
        `/api/v1/docs/users/${encodeURIComponent(userId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createDocument(data) {
    return this.httpClient
      .post(
        '/api/v1/docs',
        data,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentMetadata({ documentId, metadata, revisionCreatedBecause = '' }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/metadata`,
        { metadata, revisionCreatedBecause },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateDocumentSections({ documentId, sections, revisionCreatedBecause = '' }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/sections`,
        { sections, revisionCreatedBecause },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  restoreDocumentRevision({ documentId, revisionId, revisionRestoredBecause = '' }) {
    return this.httpClient
      .patch(
        `/api/v1/docs/${encodeURIComponent(documentId)}/restore`,
        { revisionId, revisionRestoredBecause },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions }) {
    return this.httpClient
      .delete(
        '/api/v1/docs/sections',
        {
          data: {
            documentId,
            sectionKey,
            sectionRevision,
            reason,
            deleteAllRevisions: !!deleteAllRevisions
          },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  hardDeletePrivateDocument(documentId) {
    return this.httpClient
      .delete(
        '/api/v1/docs',
        {
          data: { documentId },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }
}

export default DocumentApiClient;
