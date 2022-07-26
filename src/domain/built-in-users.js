import permissions from './permissions.js';

export const exportUser = Object.freeze({
  _id: 'export-user',
  displayName: 'export-user',
  provider: 'builtin/export',
  roles: [],
  permissions: [permissions.MANAGE_EXPORT_WITH_BUILT_IN_USER],
  storage: {
    plan: null,
    usedBytes: 0,
    reminders: []
  }
});

export const ambMetadataUser = Object.freeze({
  _id: 'amb-metadata-user',
  displayName: 'amb-metadata-user',
  provider: 'builtin/ambMetadata',
  roles: [],
  permissions: [permissions.REQUEST_AMB_METADATA_WITH_BUILT_IN_USER],
  storage: {
    plan: null,
    usedBytes: 0,
    reminders: []
  }
});
