import by from 'thenby';
import deepEqual from 'fast-deep-equal';
import uniqueId from '../utils/unique-id.js';
import LessonStore from '../stores/lesson-store.js';
import { extractCdnResources } from './section-helper.js';
import PluginRegistry from '../plugins/plugin-registry.js';

class LessonService {
  static get inject() {
    return [LessonStore, PluginRegistry];
  }

  constructor(lessonStore, pluginRegistry) {
    this.lessonStore = lessonStore;
    this.pluginRegistry = pluginRegistry;
  }

  async getLessonById(lessonId) {
    const lesson = await this.lessonStore.getLessonById(lessonId);
    return lesson;
  }

  async getLessonsMetadata(roomId) {
    const lessons = await this.lessonStore.getLessonsMetadataByRoomId(roomId);
    return lessons.sort(by(l => l.schedule?.startsOn || 0));
  }

  async createLesson({ userId, roomId, title, slug, language, schedule }) {
    const mappedSchedule = schedule
      ? {
        startsOn: new Date(schedule.startsOn)
      }
      : null;

    const lesson = {
      _id: uniqueId.create(),
      roomId,
      createdOn: new Date(),
      createdBy: userId,
      updatedOn: new Date(),
      updatedBy: userId,
      title,
      slug,
      language,
      sections: [],
      cdnResources: [],
      schedule: mappedSchedule
    };

    await this.lessonStore.saveLesson(lesson);

    return lesson;
  }

  async updateLessonMetadata(lessonId, { userId, title, slug, language, schedule }) {
    const lesson = await this.getLessonById(lessonId);

    const mappedSchedule = schedule
      ? { startsOn: new Date(schedule.startsOn) }
      : null;

    const updatedLesson = {
      ...lesson,
      title,
      slug: slug || '',
      language,
      schedule: mappedSchedule,
      updatedOn: new Date(),
      updatedBy: userId
    };

    await this.lessonStore.saveLesson(updatedLesson);
    return updatedLesson;
  }

  async updateLessonSections(lessonId, { userId, sections }) {
    const lesson = await this.getLessonById(lessonId);

    const updatedLesson = {
      ...lesson,
      sections,
      cdnResources: extractCdnResources(sections, this.pluginRegistry),
      updatedOn: new Date(),
      updatedBy: userId
    };

    await this.lessonStore.saveLesson(updatedLesson);
    return updatedLesson;
  }

  async deleteLessonById(lessonId) {
    await this.lessonStore.deleteLessonById(lessonId);
  }

  async consolidateCdnResources(lessonId) {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('HÄ?', lessonId);
    }

    const updatedLesson = {
      ...lesson,
      cdnResources: extractCdnResources(lesson.sections, this.pluginRegistry)
    };

    if (!deepEqual(lesson, updatedLesson)) {
      await this.lessonStore.saveLesson(updatedLesson);
    }
  }
}

export default LessonService;
