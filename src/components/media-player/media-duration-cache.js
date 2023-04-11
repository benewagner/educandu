import Logger from '../../common/logger.js';
import { isBrowser } from '../../ui/browser-helper.js';
import { determineMediaDuration } from '../../utils/media-utils.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../../common/di.js';

const logger = new Logger(import.meta.url);

const MAX_FAILED_ATTEMPTS = 3;
const FAILED_ENTRIES_LIFETIME_IN_MS = 5000;

class MediaDurationCache {
  constructor() {
    this._isDisposed = false;
    this._entries = new Map();
    this._subscribers = new Set();
    this._errorCountPerSourceUrl = new Map();
  }

  getEntry(sourceUrl) {
    this._throwIfDisposed();
    let entry = this._entries.get(sourceUrl);
    if (!entry) {
      entry = this._createUnresolvedEntry(sourceUrl);
      if (isBrowser()) {
        this._entries.set(sourceUrl, entry);
        this._determineDuration(sourceUrl);
      }
    }

    return entry;
  }

  getEntries(sourceUrls) {
    this._throwIfDisposed();
    return sourceUrls.map(sourceUrl => this.getEntry(sourceUrl));
  }

  setEntry(sourceUrl, duration) {
    this._throwIfDisposed();
    this._handleDurationDetermined(sourceUrl, duration, null);
  }

  subscribe(callback) {
    this._throwIfDisposed();
    if (isBrowser()) {
      this._subscribers.add(callback);
    }
  }

  unsubscribe(callback) {
    this._throwIfDisposed();
    if (isBrowser()) {
      this._subscribers.delete(callback);
    }
  }

  _createUnresolvedEntry(sourceUrl) {
    return {
      sourceUrl,
      hasError: false,
      isResolved: false,
      duration: 0
    };
  }

  _createResolvedEntry(sourceUrl, duration, error) {
    return {
      sourceUrl,
      hasError: !!error,
      isResolved: true,
      duration: error ? 0 : duration
    };
  }

  async _determineDuration(sourceUrl) {
    if (!isBrowser()) {
      return;
    }

    try {
      const duration = await determineMediaDuration(sourceUrl);
      this._handleDurationDetermined(sourceUrl, duration, null);
    } catch (error) {
      logger.error(error);
      this._handleDurationDetermined(sourceUrl, null, error);
      const newErrorCount = (this._errorCountPerSourceUrl.get(sourceUrl) || 0) + 1;
      if (newErrorCount < MAX_FAILED_ATTEMPTS) {
        this._errorCountPerSourceUrl.set(sourceUrl, newErrorCount);
        this._registerForDeletion(sourceUrl);
      } else {
        this._errorCountPerSourceUrl.set(sourceUrl, MAX_FAILED_ATTEMPTS);
      }
    }
  }

  _handleDurationDetermined(sourceUrl, duration, error) {
    if (!this._isDisposed) {
      const newEntry = this._createResolvedEntry(sourceUrl, duration, error);
      this._entries.set(sourceUrl, newEntry);
      this._notifySubscribers();
    }
  }

  _notifySubscribers() {
    for (const subscriber of this._subscribers) {
      try {
        subscriber();
      } catch (error) {
        logger.error(error);
      }
    }
  }

  _registerForDeletion(sourceUrl) {
    window.setTimeout(() => {
      if (!this._isDisposed) {
        this._entries.delete(sourceUrl);
        this._notifySubscribers();
      }
    }, FAILED_ENTRIES_LIFETIME_IN_MS);
  }

  _throwIfDisposed() {
    if (this._isDisposed) {
      throw new Error('Cannot use a disposed instance');
    }
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => {
        this._entries.clear();
        this._subscribers.clear();
        this._isDisposed = true;
      }
    };
  }
}

export default MediaDurationCache;
