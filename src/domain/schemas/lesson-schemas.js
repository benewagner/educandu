import joi from 'joi';
import { idOrKeySchema, slugSchema, sectionDBSchema } from './shared-schemas.js';

const scheduleSchema = joi.object({
  startsOn: joi.string().required()
});

export const lessonDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionDBSchema).required(),
  cdnResources: joi.array().items(joi.string()).required(),
  schedule: scheduleSchema.allow(null)
});

export const getLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required(),
  lessonSlug: joi.string()
}).unknown(true);

export const postLessonBodySchema = joi.object({
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  schedule: scheduleSchema.allow(null)
});
