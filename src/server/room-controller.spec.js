import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';

const { NotFound } = httpErrors;

describe('room-controller', () => {
  const sandbox = sinon.createSandbox();
  const room = { roomId: 'roomId', name: 'Mein schöner Raum' };

  let roomService;
  let mailService;
  let serverConfig;
  let clientDataMapper;
  let pageRenderer;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    roomService = {
      createOrUpdateInvitation: sandbox.stub(),
      getRoomById: sandbox.stub().callsFake(roomId => {
        if (roomId === room.roomId) {
          return Promise.resolve(room);
        }
        return Promise.resolve();
      }),
      isRoomMemberOrOwner: sandbox.stub().callsFake(roomId => {
        if (roomId === '843zvnzn2vw') {
          return {};
        }
        return null;
      })
    };
    mailService = {
      sendRoomInvitation: sandbox.stub()
    };
    user = {
      username: 'dagobert-the-third'
    };
    serverConfig = {
      disabledFeatures: []
    };

    clientDataMapper = {
      mapRoomDetails: sandbox.stub().resolves(room)
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    sut = new RoomController(serverConfig, roomService, mailService, clientDataMapper, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostRoomInvitation', () => {

    describe('when all goes well', () => {
      const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

      beforeEach(done => {
        roomService.createOrUpdateInvitation.returns(Promise.resolve({
          room,
          owner: user,
          invitation
        }));
        mailService.sendRoomInvitation.returns(Promise.resolve());

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', email: 'invited@user.com' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePostRoomInvitation(req, res);
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should respond with the created/updated invitation', () => {
        expect(res._getData()).toEqual(invitation);
      });

      it('should have called roomService.createOrUpdateInvitation', () => {
        sinon.assert.calledWith(roomService.createOrUpdateInvitation, {
          roomId: '843zvnzn2vw',
          email: 'invited@user.com',
          user
        });
      });

      it('should have called mailService.sendRoomInvitation', () => {
        sinon.assert.calledWith(mailService.sendRoomInvitation, {
          roomName: 'Mein schöner Raum',
          ownerName: 'dagobert-the-third',
          email: 'invited@user.com',
          invitationLink: 'https://educandu.dev/confirm-room-membership/94zv87nt2zztc8m3zt2z3845z8txc'
        });
      });
    });

    describe('when the service call fails', () => {
      beforeEach(() => {
        roomService.createOrUpdateInvitation.returns(Promise.reject(new NotFound()));

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', email: 'invited@user.com' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should propagate the error', () => {
        expect(() => sut.handlePostRoomInvitation(req, res)).rejects.toThrow(NotFound);
      });
    });

  });

  describe('handleGetRoomDetails', () => {
    describe('when the room exists', () => {
      const request = {
        params: {
          roomId: 'roomId'
        }
      };

      beforeEach(async () => {
        await sut.handleGetRoomDetails(request, {});
      });

      it('should call getRoomById with roomId', () => {
        sinon.assert.calledWith(roomService.getRoomById, 'roomId');
      });

      it('should call mapRoomDetails with the room returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapRoomDetails, room);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, request, {}, PAGE_NAME.room, { roomDetails: room });
      });
    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', () => {
        expect(() => sut.handleGetRoomDetails({ params: { roomId: 'abc' } }).rejects.toThrow(NotFound));
      });
    });
  });

  describe('handleAuthorizeResourceAccess', () => {
    const userId = 'Ludwig the great';
    const roomId = '843zvnzn2vw';
    describe('when the user is authorized', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId, userId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handleAuthorizeResourceAccess(req, res);
      });

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomMemberOrOwner, roomId, userId);
      });

      it('should return status 200 when the user is authorized', () => {
        expect(res.statusCode).toBe(200);
      });

    });
    describe('when the user is not authorized', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: 'abcd', userId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handleAuthorizeResourceAccess(req, res);
      });

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomMemberOrOwner, 'abcd', userId);
      });

      it('should return status 403 when the user is not authorized', () => {
        expect(res.statusCode).toBe(403);
      });

    });
  });
});
