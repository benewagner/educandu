import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import inputValidators from '../../utils/input-validators.js';

const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});

const documentRevisionAppendToSchema = joi.object({
  key: idOrKeySchema.required(),
  ancestorId: idOrKeySchema.required()
});

export const getSearchDocumentsByTagsSchema = joi.object({
  query: joi.string().trim().min(3).required()
});

export const getRevisionsByKeyQuerySchema = joi.object({
  key: idOrKeySchema.required()
});

export const slugSchema = joi.string().pattern(inputValidators.slugValidationPattern).allow('').required();

export const createRevisionBodySchema = joi.object({
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionSchema).required(),
  appendTo: documentRevisionAppendToSchema.optional(),
  tags: joi.array(),
  archived: joi.boolean()
});

export const restoreRevisionBodySchema = joi.object({
  documentKey: idOrKeySchema.required(),
  revisionId: idOrKeySchema.required()
});

export const hardDeleteSectionBodySchema = joi.object({
  documentKey: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required(),
  sectionRevision: idOrKeySchema.required(),
  reason: joi.string().min(3).required(),
  deleteAllRevisions: joi.boolean().required()
});

export const hardDeleteDocumentBodySchema = joi.object({
  documentKey: idOrKeySchema.required()
});
