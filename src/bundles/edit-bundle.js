import Docs from '../components/pages/docs.js';
import Users from '../components/pages/users.js';
import ImportBatches from '../components/pages/import-batches.js';
import EditDoc from '../components/pages/edit-doc.js';
import Settings from '../components/pages/settings.js';
import { hydrateApp } from '../bootstrap/client-bootstrapper.js';
import CreateImport from '../components/pages/create-import.js';
import Import from '../components/pages/import.js';

hydrateApp({
  'docs': Docs,
  'users': Users,
  'edit-doc': EditDoc,
  'settings': Settings,
  'imports-batches': ImportBatches,
  'create-import': CreateImport,
  'import': Import
});
