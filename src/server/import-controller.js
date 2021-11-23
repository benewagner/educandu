import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import ExportApiClient from '../services/export-api-client.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ImportController {
  static get inject() { return [ImportService, ExportApiClient, ServerConfig, PageRenderer]; }

  constructor(importService, exportApiClient, serverConfig, pageRenderer) {
    this.exportApiClient = exportApiClient;
    this.importService = importService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/import', needsPermission(permissions.MANAGE_IMPORT), (req, res) => {
      const importSources = this.serverConfig.importSources.map(source => ({ name: source.name, baseUrl: source.baseUrl }));
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'import', { importSources });
    });
  }

  registerApi(router) {
    router.get('/api/v1/imports', [needsPermission(permissions.MANAGE_IMPORT)], async (req, res) => {
      const { importSourceName } = req.query;

      if (!importSourceName) {
        res.status(400).send('importSourceName is required');
        return;
      }

      const importSource = this.serverConfig.importSources.find(source => source.name === importSourceName);

      if (!importSource) {
        res.status(400).send('importSourceName is unknown');
        return;
      }

      const documents = await this.importService.getAllImportableDocumentsMetadata(importSource, true);
      res.send({ documents });
    });
  }
}

export default ImportController;
