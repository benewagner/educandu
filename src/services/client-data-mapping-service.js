import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import { BATCH_TYPE, FAVORITE_TYPE, TASK_TYPE } from '../domain/constants.js';
import permissions, { getAllUserPermissions } from '../domain/permissions.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

class ClientDataMappingService {
  static get inject() { return [UserStore, StoragePlanStore, RoomStore, PluginRegistry]; }

  constructor(userStore, storagePlanStore, roomStore, pluginRegistry) {
    this.userStore = userStore;
    this.roomStore = roomStore;
    this.storagePlanStore = storagePlanStore;
    this.pluginRegistry = pluginRegistry;
  }

  mapWebsitePublicUser({ viewedUser, viewingUser }) {
    if (!viewedUser) {
      return null;
    }

    const mappedViewedUser = {
      _id: viewedUser._id,
      displayName: viewedUser.displayName,
      organization: viewedUser.organization,
      introduction: viewedUser.introduction,
      avatarUrl: urlUtils.getGravatarUrl(viewedUser.accountClosedOn ? null : viewedUser.email),
      accountClosedOn: viewedUser.accountClosedOn ? viewedUser.accountClosedOn.toISOString() : null
    };

    if (getAllUserPermissions(viewingUser).includes(permissions.SEE_USER_EMAIL)) {
      mappedViewedUser.email = viewedUser.email;
    }

    return mappedViewedUser;
  }

  mapWebsiteUser(user) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      roles: user.roles,
      organization: user.organization,
      introduction: user.introduction,
      storage: {
        plan: user.storage.plan,
        usedBytes: user.storage.usedBytes
      },
      favorites: user.favorites.map(favorite => ({
        ...favorite,
        setOn: favorite.setOn.toISOString()
      }))
    };
  }

  mapUserForAdminArea(user) {
    return {
      ...user,
      expiresOn: user.expiresOn ? user.expiresOn.toISOString() : user.expiresOn,
      accountLockedOn: user.accountLockedOn ? user.accountLockedOn.toISOString() : user.accountLockedOn,
      accountClosedOn: user.accountClosedOn ? user.accountClosedOn.toISOString() : user.accountClosedOn,
      lastLoggedInOn: user.lastLoggedInOn ? user.lastLoggedInOn.toISOString() : user.lastLoggedInOn,
      storage: {
        ...user.storage,
        reminders: user.storage.reminders.map(reminder => ({
          ...reminder,
          timestamp: reminder.timestamp.toISOString()
        }))
      },
      favorites: user.favorites.map(favorite => ({
        ...favorite,
        setOn: favorite.setOn.toISOString()
      }))
    };
  }

  mapUsersForAdminArea(users) {
    return users.map(this.mapUserForAdminArea);
  }

  mapExternalAccountForAdminArea(externalAccount) {
    return externalAccount;
  }

  mapExternalAccountsForAdminArea(externalAccounts) {
    return externalAccounts.map(this.mapExternalAccountForAdminArea);
  }

  createProposedSections(docOrRevision, targetRoomId) {
    return docOrRevision.sections.reduce((proposedSections, section) => {
      if (!this._isDeletedSection(section)) {
        const info = this.pluginRegistry.tryGetInfo(section.type);
        const redactedContent = info?.redactContent?.(section.content, targetRoomId) || null;
        if (redactedContent) {
          proposedSections.push({
            ...section,
            key: uniqueId.create(),
            revision: null,
            content: redactedContent
          });
        }
      }

      return proposedSections;
    }, []);
  }

  async mapDocOrRevision(docOrRevision, user) {
    const grantedPermissions = getAllUserPermissions(user);
    const userMap = await this._getUserMapForDocsOrRevisions([docOrRevision]);

    return this._mapDocOrRevision(docOrRevision, userMap, grantedPermissions);
  }

  async mapDocsOrRevisions(docsOrRevisions, user) {
    const grantedPermissions = getAllUserPermissions(user);
    const userMap = await this._getUserMapForDocsOrRevisions(docsOrRevisions.filter(x => !!x));

    return docsOrRevisions.map(docOrRevision => {
      return docOrRevision
        ? this._mapDocOrRevision(docOrRevision, userMap, grantedPermissions)
        : docOrRevision;
    });
  }

  async mapBatches(batches, user) {
    const grantedPermissions = getAllUserPermissions(user);
    const userIdSet = new Set(batches.map(batch => batch.createdBy));
    const users = await this.userStore.getUsersByIds(Array.from(userIdSet));

    if (users.length !== userIdSet.size) {
      throw new Error(`Was searching for ${userIdSet.size} users, but found ${users.length}`);
    }

    const userMap = new Map(users.map(u => [u._id, u]));
    return batches.map(batch => this._mapBatch(batch, userMap.get(batch.createdBy), grantedPermissions));
  }

  async mapBatch(batch, user) {
    const mappedBatches = await this.mapBatches([batch], user);
    return mappedBatches[0];
  }

  async mapUserOwnRoomInvitations(invitation) {
    const room = await this.roomStore.getRoomById(invitation.roomId);
    const owner = await this.userStore.getUserById(room.owner);

    return {
      _id: invitation._id,
      token: invitation.token,
      sentOn: invitation.sentOn.toISOString(),
      expiresOn: invitation.expiresOn.toISOString(),
      room: {
        _id: room._id,
        name: room.name,
        documentsMode: room.documentsMode,
        owner: {
          _id: owner._id,
          displayName: owner.displayName
        }
      }
    };
  }

  async mapRoom(room, viewingUser) {
    const mappedRoom = cloneDeep(room);
    const grantedPermissions = getAllUserPermissions(viewingUser);

    const owner = await this.userStore.getUserById(room.owner);
    mappedRoom.owner = this._mapOtherUser({ user: owner, grantedPermissions });

    const memberUsers = await this.userStore.getUsersByIds(room.members.map(member => member.userId));

    mappedRoom.members = room.members.map(member => {
      const memberUser = memberUsers.find(m => member.userId === m._id);
      const mappedMemberUser = this.mapWebsitePublicUser({ viewedUser: memberUser, viewingUser });
      return {
        userId: member.userId,
        joinedOn: member.joinedOn && member.joinedOn.toISOString(),
        displayName: mappedMemberUser.displayName,
        email: mappedMemberUser.email,
        avatarUrl: mappedMemberUser.avatarUrl
      };
    });

    return {
      ...mappedRoom,
      createdOn: mappedRoom.createdOn.toISOString(),
      updatedOn: mappedRoom.updatedOn.toISOString()
    };
  }

  mapRooms(rooms) {
    return Promise.all(rooms.map(room => this.mapRoom(room)));
  }

  mapRoomInvitations(invitations) {
    return invitations.map(invitation => this._mapRoomInvitation(invitation));
  }

  mapSamlIdentityProvider(provider) {
    return {
      key: provider.key,
      displayName: provider.displayName,
      logoUrl: provider.logoUrl || null
    };
  }

  mapUserActivities(activities) {
    return activities.map(activity => ({ ...activity, timestamp: activity.timestamp.toISOString() }));
  }

  async mapUserFavorites(favorites, user) {
    const mappedUserFavorites = [];

    for (const favorite of favorites) {
      mappedUserFavorites.push(await this._mapFavorite({ favorite, user }));
    }

    return mappedUserFavorites;
  }

  async mapComment(comment) {
    const userMap = await this._getUserMapForComments([comment]);
    return this._mapComment(comment, userMap);
  }

  async mapComments(comments) {
    const userMap = await this._getUserMapForComments(comments);
    return comments.map(comment => this._mapComment(comment, userMap));
  }

  async _mapFavorite({ favorite, user }) {
    const mappedFavorite = {
      ...favorite,
      setOn: favorite.setOn.toISOString()
    };

    switch (favorite.type) {
      case FAVORITE_TYPE.user:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapWebsitePublicUser({ viewedUser: favorite.data, viewingUser: user }) : null
        };
      case FAVORITE_TYPE.room:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapRoom(favorite.data, user) : null
        };
      case FAVORITE_TYPE.document:
        return {
          ...mappedFavorite,
          data: favorite.data ? await this.mapDocOrRevision(favorite.data, user) : null
        };
      default:
        return mappedFavorite;
    }
  }

  _mapComment(comment, userMap) {
    const mappedComment = cloneDeep(comment);
    const createdBy = this._mapOtherUser({ user: userMap.get(comment.createdBy) });
    const deletedBy = this._mapOtherUser({ user: userMap.get(comment.deletedBy) });

    return {
      ...mappedComment,
      createdBy,
      deletedBy,
      createdOn: mappedComment.createdOn.toISOString(),
      deletedOn: mappedComment.deletedOn && mappedComment.deletedOn.toISOString()
    };
  }

  _mapOtherUser({ user, grantedPermissions = [] }) {
    if (!user) {
      return null;
    }

    const mappedUser = {
      _id: user._id,
      displayName: user.displayName
    };

    if (grantedPermissions.includes(permissions.SEE_USER_EMAIL)) {
      mappedUser.email = user.email;
    }

    return mappedUser;
  }

  _mapTaskParams(rawTaskParams, taskType) {
    switch (taskType) {
      case TASK_TYPE.documentValidation:
      case TASK_TYPE.documentRegeneration:
      case TASK_TYPE.cdnResourcesConsolidation:
      case TASK_TYPE.cdnUploadDirectoryCreation:
        return {
          ...rawTaskParams
        };
      default:
        throw new Error(`Task param mapping for task type ${taskType} is not implemented`);
    }
  }

  _mapTaskAttempt(rawTaskAttempt) {
    const startedOn = rawTaskAttempt.startedOn && rawTaskAttempt.startedOn.toISOString();
    const completedOn = rawTaskAttempt.completedOn && rawTaskAttempt.completedOn.toISOString();

    return {
      ...rawTaskAttempt,
      startedOn,
      completedOn
    };
  }

  _mapTask(rawTask) {
    const taskParams = rawTask.taskParams && this._mapTaskParams(rawTask.taskParams, rawTask.taskType);
    const attempts = rawTask.attempts && rawTask.attempts.map(attempt => this._mapTaskAttempt(attempt));

    return {
      ...rawTask,
      taskParams,
      attempts
    };
  }

  _mapBatchParams(rawBatchParams, batchType) {
    switch (batchType) {
      case BATCH_TYPE.documentValidation:
      case BATCH_TYPE.documentRegeneration:
      case BATCH_TYPE.cdnResourcesConsolidation:
      case BATCH_TYPE.cdnUploadDirectoryCreation:
        return {
          ...rawBatchParams
        };
      default:
        throw new Error(`Batch param mapping for batch type ${batchType} is not implemented`);
    }
  }

  _mapBatch(rawBatch, rawUser, grantedPermissions) {
    const createdOn = rawBatch.createdOn && rawBatch.createdOn.toISOString();
    const completedOn = rawBatch.completedOn && rawBatch.completedOn.toISOString();
    const createdBy = this._mapOtherUser({ user: rawUser, grantedPermissions });
    const batchParams = this._mapBatchParams(rawBatch.batchParams, rawBatch.batchType);
    const tasks = rawBatch.tasks && rawBatch.tasks.map(task => this._mapTask(task));

    return {
      ...rawBatch,
      createdOn,
      completedOn,
      createdBy,
      batchParams,
      tasks
    };
  }

  _mapRoomInvitation(rawInvitation) {
    const sentOn = rawInvitation.sentOn && rawInvitation.sentOn.toISOString();
    const expiresOn = rawInvitation.expiresOn && rawInvitation.expiresOn.toISOString();

    return {
      ...rawInvitation,
      sentOn,
      expiresOn
    };
  }

  _mapDocumentSection(section, userMap, grantedPermissions) {
    return {
      ...section,
      deletedOn: section.deletedOn ? section.deletedOn.toISOString() : section.deletedOn,
      deletedBy: section.deletedBy ? this._mapOtherUser({ user: userMap.get(section.deletedBy), grantedPermissions }) : section.deletedBy
    };
  }

  _mapDocOrRevision(docOrRevision, userMap, grantedPermissions) {
    if (!docOrRevision) {
      return docOrRevision;
    }

    const result = {};

    for (const [key, value] of Object.entries(docOrRevision)) {
      switch (key) {
        case 'createdOn':
        case 'updatedOn':
          result[key] = value ? value.toISOString() : value;
          break;
        case 'createdBy':
        case 'updatedBy':
          result[key] = value ? this._mapOtherUser({ user: userMap.get(value), grantedPermissions }) : value;
          break;
        case 'contributors':
          result[key] = value.map(c => this._mapOtherUser({ user: userMap.get(c), grantedPermissions }));
          break;
        case 'sections':
          result[key] = value.map(s => this._mapDocumentSection(s, userMap, grantedPermissions));
          break;
        case 'cdnResources':
          break;
        default:
          result[key] = value;
          break;
      }
    }

    return result;
  }

  _isDeletedSection(section) {
    return section.deletedOn
      || section.deletedBy
      || section.deletedBecause
      || !section.content;
  }

  async _getUserMapForDocsOrRevisions(docsOrRevisions) {
    const userIds = extractUserIdsFromDocsOrRevisions(docsOrRevisions);
    const users = await this.userStore.getUsersByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }

  async _getUserMapForComments(comments) {
    const createdByUserIds = comments.map(comment => comment.createdBy).filter(comment => comment);
    const deletedByUserIds = comments.map(comment => comment.deletedBy).filter(comment => comment);

    const userIds = [...new Set([...createdByUserIds, ...deletedByUserIds])];
    const users = await this.userStore.getUsersByIds(userIds);

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${userIds.length} users, but found ${users.length}`);
    }

    return new Map(users.map(u => [u._id, u]));
  }
}

export default ClientDataMappingService;
