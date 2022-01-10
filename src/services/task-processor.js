import Logger from '../common/logger.js';
import TaskStore from '../stores/task-store.js';
import { serializeError } from 'serialize-error';
import { TASK_TYPE } from '../domain/constants.js';
import ServerConfig from '../bootstrap/server-config.js';
import TaskLockStore from '../stores/task-lock-store.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import DocumentRegenerationTaskProcessor from './document-regeneration-task-processor.js';

const logger = new Logger(import.meta.url);

export default class TaskProcessor {
  static get inject() { return [TaskStore, TaskLockStore, DocumentImportTaskProcessor, DocumentRegenerationTaskProcessor, ServerConfig]; }

  constructor(taskStore, taskLockStore, documentImportTaskProcessor, documentRegenerationTaskProcessor, serverConfig) {
    this.taskStore = taskStore;
    this.taskLockStore = taskLockStore;
    this.serverConfig = serverConfig;

    this.taskProcessors = {
      [TASK_TYPE.documentImport]: documentImportTaskProcessor,
      [TASK_TYPE.documentRegeneration]: documentRegenerationTaskProcessor
    };
  }

  async process(taskId, batchParams, ctx) {
    let lock;
    try {
      lock = await this.taskLockStore.takeLock(taskId);
    } catch (err) {
      logger.debug(`Failed to take lock for task ${taskId}, will return`);
      return;
    }

    try {
      const nextTask = await this.taskStore.findOne({ _id: taskId, processed: false });
      if (!nextTask) {
        logger.debug('Candidate has been already processed, will skip');
        return;
      }

      if (ctx.cancellationRequested) {
        logger.debug('Cancellation requested, will not attempt processing the task');
        return;
      }

      const currentAttempt = {
        startedOn: new Date(),
        completedOn: null,
        errors: []
      };

      const taskProcessor = this.taskProcessors[nextTask.taskType];
      if (!taskProcessor) {
        throw new Error(`Task type ${nextTask.taskType} is unknown`);
      }

      try {
        logger.debug('Processing task');
        await taskProcessor.process(nextTask, batchParams, ctx);
      } catch (processingError) {
        logger.debug(`Error processing task '${nextTask?._id}':`, processingError);
        currentAttempt.errors.push(serializeError(processingError));
      }

      currentAttempt.completedOn = new Date();
      nextTask.attempts.push(currentAttempt);

      const attemptsExhausted = nextTask.attempts.length >= this.serverConfig.taskProcessing.maxAttempts;
      const taskSuccessfullyProcessed = currentAttempt.errors.length === 0;
      if (taskSuccessfullyProcessed || attemptsExhausted) {
        logger.debug(`Marking task as processed due to: ${attemptsExhausted ? 'exhausted attempts' : 'task succesfully processed'}`);
        nextTask.processed = true;
      }

      logger.debug('Saving task');
      await this.taskStore.save(nextTask);
    } finally {
      await this.taskLockStore.releaseLock(lock);
    }
  }
}
