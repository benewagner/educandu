import { validate } from '../validation.js';
import uniqueId from '../../utils/unique-id.js';
import { lessonDBSchema } from './lesson-schemas.js';

describe('lessonDBSchema', () => {
  const lesson = {
    _id: uniqueId.create(),
    roomId: uniqueId.create(),
    createdOn: new Date(),
    createdBy: uniqueId.create(),
    updatedOn: new Date(),
    updatedBy: uniqueId.create(),
    title: 'the title',
    slug: '0123-123',
    language: 'en',
    cdnResources: [],
    schedule: null,
    sections: [
      {
        key: 'JD9fjjdj00e8jfkjdhjHNFLD436',
        type: 'markdown',
        content: {
          text: 'Hello world!'
        }
      }
    ]
  };

  const validTestCases = [
    {
      description: 'a valid lesson',
      data: {
        ...lesson
      }
    }
  ];

  const invalidTestCases = [
    {
      description: 'a lesson with an invalid language',
      data: {
        ...lesson,
        language: 'DE'
      }
    },
    {
      description: 'a lesson with an invalid slug',
      data: {
        ...lesson,
        slug: null
      }
    },
    {
      description: 'a lesson with an invalid title',
      data: {
        ...lesson,
        title: ''
      }
    },
    {
      description: 'a lesson with missing sections',
      data: {
        ...lesson,
        sections: null
      }
    },
    {
      description: 'a lesson with an invalid sections',
      data: {
        ...lesson,
        sections: [{ something: 'invalid' }]
      }
    },
    {
      description: 'a lesson with missing createdBy',
      data: {
        ...lesson,
        createdBy: null
      }
    },
    {
      description: 'a lesson with missing createdOn',
      data: {
        ...lesson,
        createdOn: null
      }
    },
    {
      description: 'a lesson with missing updatedOn',
      data: {
        ...lesson,
        updatedOn: null
      }
    },
    {
      description: 'a lesson with missing updatedBy',
      data: {
        ...lesson,
        updatedBy: null
      }
    }
  ];

  validTestCases.forEach(({ description, data }) => {
    describe(`when called with ${description}`, () => {
      it('should pass validation', () => expect(() => validate(data, lessonDBSchema)).not.toThrow());
    });
  });

  invalidTestCases.forEach(({ description, data }) => {
    describe(`when called with ${description}`, () => {
      it('should fail validation', () => expect(() => validate(data, lessonDBSchema)).toThrow());
    });
  });
});
