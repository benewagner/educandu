import deepEqual from 'fast-deep-equal';
import { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import MediaDurationCache from './media-duration-cache.js';
import YoutubeThumbnailUrlCache from './youtube-thumbnail-url-cache.js';
import RunningAudioContextCache from './running-audio-context-cache.js';

export function useMediaDurations(urls) {
  const [, setSemaphore] = useState(0);
  const cache = useService(MediaDurationCache);
  const [lastReturnedValue, setLastReturnedValue] = useState(null);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache, setSemaphore]);

  const currentValue = cache.getEntries(urls);

  if (deepEqual(currentValue, lastReturnedValue)) {
    return lastReturnedValue;
  }

  setLastReturnedValue(currentValue);
  return currentValue;
}

export function useYoutubeThumbnailUrl(url) {
  const [, setSemaphore] = useState(0);
  const cache = useService(YoutubeThumbnailUrlCache);
  const [lastReturnedValue, setLastReturnedValue] = useState(null);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache]);

  const currentValue = cache.getEntry(url);

  if (deepEqual(currentValue, lastReturnedValue)) {
    return lastReturnedValue;
  }

  setLastReturnedValue(currentValue);
  return currentValue;
}

export function useRunningAudioContext() {
  const [, setSemaphore] = useState(0);
  const cache = useService(RunningAudioContextCache);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache, setSemaphore]);

  return cache.value;
}
