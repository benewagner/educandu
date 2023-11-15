import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import { ROLE } from '../domain/constants.js';
import RevisionController from './revision-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const { NotFound, Forbidden } = httpErrors;

describe('revision-controller', () => {
  const sandbox = createSandbox();

  let clientDataMappingService;
  let documentService;
  let pageRenderer;
  let roomService;

  let revision;
  let document;
  let user;
  let room;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getDocumentById: sandbox.stub(),
      getDocumentRevisionById: sandbox.stub()
    };

    roomService = {
      getRoomById: sandbox.stub()
    };

    clientDataMappingService = {
      mapDocOrRevision: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    res = {};
    user = { _id: uniqueId.create() };
    room = { _id: uniqueId.create() };
    document = { _id: uniqueId.create() };
    revision = { _id: uniqueId.create(), documentId: document._id, slug: '', sections: [] };

    sut = new RevisionController(documentService, roomService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetRevisionPage', () => {
    let mappedRevision;

    beforeEach(() => {
      mappedRevision = { ...revision };
    });

    describe('when the revision does not exist', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetRevisionPage(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the revision is accessed anonymously', () => {
      beforeEach(() => {
        req = { params: { 0: '', id: revision._id } };

        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });

    describe('when the revision is of a document belonging to a room that the user is not owner or member of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.ownedBy = uniqueId.create();
        room.members = [];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleGetRevisionPage(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the revision is of a document belonging to a room that the user is owner of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.ownedBy = user._id;
        room.members = [];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });

    describe('when the revision is of a document belonging to a room that the user is member of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.ownedBy = uniqueId.create();
        room.members = [{ userId: user._id }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });

    describe('when the revision is of an archived document and the user does not have required permission', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };
        user.role = ROLE.user;

        document.publicContext = { archived: true };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetRevisionPage(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the revision is of an archived document and the user has required permission', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };
        user.role = ROLE.maintainer;

        document.publicContext = { archived: true };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(document._id).resolves(document);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });
  });

});
