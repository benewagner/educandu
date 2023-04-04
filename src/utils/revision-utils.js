import deepEqual from 'fast-deep-equal';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator } from './room-utils.js';

export function checkRevisionOnDocumentCreation({ newRevision, room, user }) {
  if (!hasUserPermission(user, permissions.CREATE_CONTENT)) {
    throw new Error('User is not allowed to create documents');
  }

  const { publicContext, roomContext } = newRevision;

  if (room) {
    const userIsRoomOwner = isRoomOwner({ room, userId: user._id });
    const userIsRoomOwnerOrInvitedCollaborator = isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id });

    if (roomContext.draft && !userIsRoomOwner) {
      throw new Error('Only room owners can create a draft document');
    }

    if (!userIsRoomOwnerOrInvitedCollaborator) {
      throw new Error('Only room owners or collaborators can create a room document');
    }
  }

  if (!room) {
    const { allowedEditors } = publicContext;
    const userCanManagePublicContext = hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT);
    const userCanProtectOwnDocWhenCreating = hasUserPermission(user, permissions.PROTECT_OWN_PUBLIC_CONTENT);

    if (allowedEditors.length) {
      const userIsOnlyAllowedEditor = allowedEditors.length === 1 && allowedEditors[0] === user._id;

      if (!userIsOnlyAllowedEditor && !userCanManagePublicContext) {
        throw new Error('User is not allowed to assign allowed editors');
      }

      if (userIsOnlyAllowedEditor && !userCanManagePublicContext && !userCanProtectOwnDocWhenCreating) {
        throw new Error('User is not allowed to assign themselves as allowed editor');
      }
    }

    if (publicContext.protected && !userCanManagePublicContext && !userCanProtectOwnDocWhenCreating) {
      throw new Error('User is not allowed to create a protected document');
    }

    if (publicContext.archived && !userCanManagePublicContext) {
      throw new Error('User is not allowed to create an archived document');
    }

    if (publicContext.verified && !userCanManagePublicContext) {
      throw new Error('User is not allowed to create a verified document');
    }

    if (publicContext.review && !userCanManagePublicContext) {
      throw new Error('User is not allowed to create a document with review');
    }
  }
}

export function checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }) {
  if (!hasUserPermission(user, permissions.CREATE_CONTENT)) {
    throw new Error('User is not allowed to update documents');
  }

  const { publicContext: previousPublicContext, roomContext: previousRoomContext } = previousRevision;
  const { publicContext: newPublicContext } = newRevision;

  if (previousRevision.roomId !== newRevision.roomId) {
    throw new Error('Documents cannot be moved between rooms or public space');
  }

  if (room) {
    const userIsRoomOwner = isRoomOwner({ room, userId: user._id });
    const userIsRoomOwnerOrInvitedCollaborator = isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id });

    if (previousRoomContext.draft && !userIsRoomOwner) {
      throw new Error('Only room owners can update a draft document');
    }

    if (!userIsRoomOwnerOrInvitedCollaborator) {
      throw new Error('Only room owners or collaborators can update a room document');
    }
  }

  if (!room) {
    const userCanManagePublicContext = hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT);
    const userIsAllowedEditorForThisDocument = previousPublicContext.allowedEditors.includes(user._id);

    if (previousPublicContext.protected && !userCanManagePublicContext && !userIsAllowedEditorForThisDocument) {
      throw new Error('User is not allowed to update a protected document');
    }

    const { allowedEditors: previousAllowedEditors } = previousPublicContext;
    const { allowedEditors: newAllowedEditors } = newPublicContext;

    if (!deepEqual(previousAllowedEditors, newAllowedEditors) && !userCanManagePublicContext) {
      throw new Error('User is not allowed to update allowed editors');
    }

    if (previousPublicContext.protected !== newPublicContext.protected && !userCanManagePublicContext) {
      throw new Error('User is not allowed to change the protected state of a document');
    }

    if (previousPublicContext.archived !== newPublicContext.archived && !userCanManagePublicContext) {
      throw new Error('User is not allowed to change the archived state of a document');
    }

    if (previousPublicContext.verified !== newPublicContext.verified && !userCanManagePublicContext) {
      throw new Error('User is not allowed to change the verified state of a document');
    }

    if (previousPublicContext.review !== newPublicContext.review && !userCanManagePublicContext) {
      throw new Error('User is not allowed to update the review of a document');
    }
  }
}
