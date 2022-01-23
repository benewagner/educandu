import moment from 'moment';
import httpErrors from 'http-errors';
import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import RoomLockStore from '../stores/room-lock-store.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';

const { BadRequest, NotFound, Forbidden } = httpErrors;

const logger = new Logger(import.meta.url);

const PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS = 7;

const roomInvitationProjection = {
  _id: 1,
  email: 1,
  sentOn: 1,
  expires: 1
};

export default class RoomService {
  static get inject() { return [RoomStore, RoomLockStore, RoomInvitationStore, UserService, Cdn, TransactionRunner]; }

  constructor(roomStore, roomLockStore, roomInvitationStore, userService, cdn, transactionRunner) {
    this.roomStore = roomStore;
    this.roomLockStore = roomLockStore;
    this.roomInvitationStore = roomInvitationStore;
    this.userService = userService;
    this.cdn = cdn;
    this.transactionRunner = transactionRunner;
  }

  getRoomById(roomId) {
    return this.roomStore.findOne({ _id: roomId });
  }

  async _getRooms({ ownerId, memberId }) {
    const orFilters = [];

    if (ownerId) {
      orFilters.push({ owner: ownerId });
    }
    if (memberId) {
      orFilters.push({ members: { $elemMatch: { userId: memberId } } });
    }

    const filter = orFilters.length === 1 ? orFilters[0] : { $or: orFilters };

    const rooms = await this.roomStore.find(filter);
    return rooms;
  }

  async getRoomsOwnedOrJoinedByUser(userId) {
    const rooms = await this._getRooms({ ownerId: userId, memberId: userId });
    return rooms;
  }

  async createRoom({ name, slug, access, user }) {
    const newRoom = {
      _id: uniqueId.create(),
      name,
      slug: slug?.trim() || '',
      access,
      description: '',
      owner: user._id,
      createdBy: user._id,
      createdOn: new Date(),
      members: []
    };

    await this.roomStore.save(newRoom);
    return newRoom;
  }

  async updateRoom(room) {
    await this.roomStore.save({
      ...room,
      slug: room.slug || '',
      description: room.description || ''
    });
    return room;
  }

  async findOwnedRoomById({ roomId, ownerId }) {
    const room = await this.roomStore.findOne({ _id: roomId });
    if (room?.owner !== ownerId) {
      throw new NotFound(`A room with ID '${roomId}' owned by '${ownerId}' could not be found`);
    }

    return room;
  }

  async createOrUpdateInvitation({ roomId, email, user }) {
    const now = new Date();
    const lowerCasedEmail = email.toLowerCase();

    const room = await this.findOwnedRoomById({ roomId, ownerId: user._id });
    if (room.access === ROOM_ACCESS_LEVEL.public) {
      throw new BadRequest(`Room with ID '${roomId}' is public, therefore invitations cannot be sent`);
    }

    const owner = await this.userService.getUserById(room.owner);

    if (owner.email.toLowerCase() === lowerCasedEmail) {
      throw new BadRequest('Invited user is the same as room owner');
    }

    let invitation = await this.roomInvitationStore.findOne({ roomId, email: lowerCasedEmail });
    if (!invitation) {
      invitation = {
        _id: uniqueId.create(),
        roomId,
        email: lowerCasedEmail
      };
    }

    invitation.sentOn = now;
    invitation.token = uniqueId.create();
    invitation.expires = moment(now).add(PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS, 'days').toDate();

    logger.info(`Creating or updating room invitation with ID ${invitation._id}`);
    await this.roomInvitationStore.save(invitation);

    return { room, owner, invitation };
  }

  async verifyInvitationToken({ token, user }) {
    let roomId = null;
    let roomName = null;
    let isValid = false;

    const invitation = await this.roomInvitationStore.findOne({ token });
    if (invitation?.email === user.email) {
      const room = await this.roomStore.findOne({ _id: invitation.roomId });
      if (room) {
        roomId = room._id;
        roomName = room.name;
        isValid = true;
      }
    }

    return { roomId, roomName, isValid };
  }

  async confirmInvitation({ token, user }) {
    const invitation = await this.roomInvitationStore.findOne({ token });
    if (invitation?.email !== user.email) {
      throw new NotFound();
    }

    await this.transactionRunner.run(async session => {
      const newMember = {
        userId: user._id,
        joinedOn: new Date()
      };

      let lock;

      try {
        lock = await this.roomLockStore.takeLock(invitation.roomId);

        const roomContainingNewMember = await this.roomStore.findOne(
          { '_id': invitation.roomId, 'members.userId': newMember.userId },
          { session }
        );

        if (!roomContainingNewMember) {
          await this.roomStore.updateOne(
            { _id: invitation.roomId },
            { $push: { members: newMember } },
            { session }
          );
        }

        await this.roomInvitationStore.deleteOne({ _id: invitation._id }, { session });
      } finally {
        this.roomLockStore.releaseLock(lock);
      }
    });
  }

  async isRoomOwnerOrMember(roomId, userId) {
    const room = await this.roomStore.findOne({ $and: [{ _id: roomId }, { $or: [{ 'members.userId': userId }, { owner: userId }] }] });
    return !!room;
  }

  getRoomInvitations(roomId) {
    return this.roomInvitationStore.find({ roomId }, { projection: roomInvitationProjection });
  }

  async deleteRoom(roomId, user) {
    const room = await this.roomStore.findOne({ _id: roomId });

    if (!room) {
      throw new NotFound();
    }

    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    await this.transactionRunner.run(async session => {
      await this.roomStore.deleteOne({ _id: roomId }, { session });
      await this.roomInvitationStore.deleteMany({ roomId }, { session });
    });

    try {
      const objectList = await this.cdn.listObjects({ prefix: `/rooms/${roomId}`, recursive: true });
      await this.cdn.deleteObjects(objectList.map(({ name }) => name));
    } catch (error) {
      logger.error(error);
    }

    return room;
  }
}
