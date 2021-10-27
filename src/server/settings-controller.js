import express from 'express';
import Database from '../stores/database.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import MailService from '../services/mail-service.js';
import ClientDataMapper from './client-data-mapper.js';
import ServerConfig from '../bootstrap/server-config.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { saveSettingsBodySchema } from '../domain/schemas/settings-schemas.js';

const jsonParser = express.json();

class SettingController {
  static get inject() { return [ServerConfig, Database, SettingService, DocumentService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, database, settingService, documentService, mailService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.database = database;
    this.settingService = settingService;
    this.documentService = documentService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerMiddleware(router) {
    router.use(async (req, _res, next) => {
      req.settings = await this.settingService.getAllSettings();
      next();
    });
  }

  registerPages(app) {
    app.get('/settings', needsPermission(permissions.EDIT_SETTINGS), async (req, res) => {
      const [settings, docs] = await Promise.all([
        this.settingService.getAllSettings(),
        this.documentService.getAllDocumentsMetadata()
      ]);
      const documents = await this.clientDataMapper.mapDocsOrRevisions(docs, req.user);
      const initialState = { settings, documents };
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'settings', initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/settings', [needsPermission(permissions.EDIT_SETTINGS), jsonParser, validateBody(saveSettingsBodySchema)], async (req, res) => {
      const { settings } = req.body;
      await this.settingService.saveSettings(settings);
      return res.send({ settings });
    });
  }
}

export default SettingController;
