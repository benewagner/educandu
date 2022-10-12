import joi from 'joi';
import { DOCUMENT_IMPORT_TYPE } from '../../domain/constants.js';
import { boolStringSchema, idOrKeySchema } from './shared-schemas.js';

const importedDocumentSchema = joi.object({
  _id: idOrKeySchema.required(),
  title: joi.string().allow('').required(),
  slug: joi.string().allow('').required(),
  language: joi.string().required(),
  updatedOn: joi.string().required(),
  importType: joi.string().valid(...Object.values(DOCUMENT_IMPORT_TYPE))
});

export const getImportsQuerySchema = joi.object({
  hostName: joi.string().required()
});

export const createImportQuerySchema = joi.object({
  source: joi.string().required()
});

export const postImportBodySchema = joi.object({
  hostName: joi.string().required(),
  documentsToImport: joi.array().required().items(importedDocumentSchema),
  nativeImport: boolStringSchema
});
