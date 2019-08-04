const PropTypes = require('prop-types');

const sectionDisplayProps = {
  docKey: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  content: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired
};

const sectionEditorProps = {
  ...sectionDisplayProps,
  onContentChanged: PropTypes.func.isRequired
};

const clientSettingsProps = {
  clientSettings: PropTypes.shape({
    env: PropTypes.string.isRequired,
    cdnRootUrl: PropTypes.string.isRequired
  }).isRequired
};

const requestProps = {
  request: PropTypes.shape({
    ip: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    protocol: PropTypes.string.isRequired,
    originalUrl: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired
  }).isRequired
};

const settingsShape = PropTypes.shape({
  landingPageDocumentId: PropTypes.string
});

const userProfileShape = PropTypes.shape({
  city: PropTypes.string,
  country: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  postalCode: PropTypes.string,
  street: PropTypes.string,
  streetSupplement: PropTypes.string
});

const userShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  provider: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  expires: PropTypes.string,
  lockedOut: PropTypes.bool,
  profile: userProfileShape
});

const userProps = {
  user: userShape
};

const dataProps = {
  data: PropTypes.object.isRequired
};

const docMetadataShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string
});

const docShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  updatedBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});

const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  order: PropTypes.number,
  type: PropTypes.string.isRequired,
  content: PropTypes.any.isRequired,
  createdOn: PropTypes.string,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  })
});

const menuNodeShape = PropTypes.any;

const menuShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  defaultDocumentKey: PropTypes.string,
  nodes: PropTypes.arrayOf(menuNodeShape).isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  updatedBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});

module.exports = {
  sectionDisplayProps,
  sectionEditorProps,
  clientSettingsProps,
  requestProps,
  settingsShape,
  userProps,
  dataProps,
  docMetadataShape,
  docShape,
  sectionShape,
  menuNodeShape,
  menuShape,
  userShape
};
