import React from 'react';
import memoizee from 'memoizee';
import ReactDOM from 'react-dom';
import urlUtils from './url-utils.js';
import reactPlayerNs from 'react-player';
import { getResourceType } from './resource-utils.js';
import { getCdnPath, isCdnUrl } from './storage-utils.js';
import validation, { getUrlValidationStatus, URL_VALIDATION_STATUS } from '../ui/validation.js';
import { CDN_URL_PREFIX, INTERNAL_PRIVATE_STORAGE_PATH_PATTERN, INTERNAL_PUBLIC_STORAGE_PATH_PATTERN, MEDIA_SOURCE_TYPE, RESOURCE_TYPE, SOURCE_TYPE } from '../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const MEDIA_TIMEOUT_IN_MS = 5000;

export function analyzeMediaUrl(url) {
  const parsedUrl = new URL(url);

  if (parsedUrl.origin === 'https://www.youtube.com' && parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')) {
    const videoId = parsedUrl.searchParams.get('v');
    const startSecond = Number.parseInt(parsedUrl.searchParams.get('start'), 10);
    const endSecond = Number.parseInt(parsedUrl.searchParams.get('end'), 10);

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      isYoutube: true,
      startTimecode: Number.isInteger(startSecond) ? startSecond * 1000 : null,
      stopTimecode: Number.isInteger(endSecond) ? endSecond * 1000 : null,
      resourceType: RESOURCE_TYPE.video
    };
  }

  if (parsedUrl.origin === 'https://youtu.be' && parsedUrl.pathname && !parsedUrl.pathname.slice(1).includes('/')) {
    const videoId = parsedUrl.pathname.slice(1);
    const startSecond = Number.parseInt(parsedUrl.searchParams.get('t'), 10);

    return {
      sanitizedUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      isYoutube: true,
      startTimecode: Number.isInteger(startSecond) ? startSecond * 1000 : null,
      stopTimecode: null,
      resourceType: RESOURCE_TYPE.video
    };
  }

  return {
    sanitizedUrl: parsedUrl.href,
    isYoutube: false,
    startTimecode: null,
    stopTimecode: null,
    resourceType: getResourceType(url)
  };
}

export const determineMediaDuration = memoizee(async url => {
  const div = window.document.createElement('div');
  div.style.display = 'none';
  window.document.body.appendChild(div);
  let cleanedUp = false;
  const ensureCleanup = () => {
    if (!cleanedUp) {
      ReactDOM.unmountComponentAtNode(div);
      div.remove();
      cleanedUp = true;
    }
  };

  // This function should never throw synchronously,
  // so we have to await for a little moment here!
  await Promise.resolve();

  const playerPromise = new Promise((resolve, reject) => {
    let validUrl;
    if (!url) {
      resolve(null);
    }

    try {
      validUrl = new URL(url).href;
    } catch {
      resolve(null);
    }

    try {
      const element = React.createElement(ReactPlayer, {
        url: validUrl,
        light: false,
        playing: false,
        onDuration: durationInSeconds => {
          const durationInMiliseconds = Math.ceil(durationInSeconds * 1000);
          resolve(durationInMiliseconds);
          ensureCleanup();
        },
        onError: error => {
          reject(error);
          ensureCleanup();
        }
      });
      ReactDOM.render(element, div);
    } catch (error) {
      reject(error);
    }
  });
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout determining duration of ${url}`));
      ensureCleanup();
    }, MEDIA_TIMEOUT_IN_MS);
  });
  return Promise.race([playerPromise, timeoutPromise]);
}, { promise: true });

export function formatMillisecondsAsDuration(milliseconds, { millisecondsLength } = {}) {
  const millisecondsToFormat = !Number.isFinite(milliseconds) || milliseconds < 1 ? 0 : milliseconds;

  const totalSeconds = Math.floor(millisecondsToFormat / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const remainingMilliseconds = (millisecondsToFormat % 1000).toString().padStart(3, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  const hours = totalHours.toString().padStart(2, '0');

  const durationParts = [];
  if (totalHours) {
    durationParts.push(hours);
  }
  durationParts.push(minutes);
  durationParts.push(seconds);

  const millisecondsText = remainingMilliseconds.toString().slice(0, millisecondsLength);

  return millisecondsLength ? `${durationParts.join(':')}.${millisecondsText}` : durationParts.join(':');
}

export function ensureValidMediaPosition(position) {
  return Math.max(0, Math.min(1, Number(position)));
}

export function formatMediaPosition({ formatPercentage, position, duration = 0 }) {
  return duration
    ? formatMillisecondsAsDuration(position * duration)
    : formatPercentage(position);
}

export function getSourcePositionFromTrackPosition(trackPosition, playbackRange) {
  return playbackRange[0] + ((playbackRange[1] - playbackRange[0]) * trackPosition);
}

export function getTrackDurationFromSourceDuration(sourceDuration, playbackRange) {
  return (playbackRange[1] - playbackRange[0]) * sourceDuration;
}

export function getMediaSourceType({ sourceUrl, cdnRootUrl }) {
  if (sourceUrl.startsWith(cdnRootUrl) || sourceUrl.startsWith(CDN_URL_PREFIX)) {
    return MEDIA_SOURCE_TYPE.internal;
  }

  if (sourceUrl.startsWith('https://www.youtube.com/')) {
    return MEDIA_SOURCE_TYPE.youtube;
  }

  return MEDIA_SOURCE_TYPE.external;
}

export function getSourceType({ sourceUrl, cdnRootUrl }) {
  if (!sourceUrl) {
    return SOURCE_TYPE.none;
  }

  if (isCdnUrl({ sourceUrl, cdnRootUrl })) {
    const cdnPath = getCdnPath({ sourceUrl, cdnRootUrl });

    if (INTERNAL_PUBLIC_STORAGE_PATH_PATTERN.test(cdnPath)) {
      return SOURCE_TYPE.internalPublic;
    }
    if (INTERNAL_PRIVATE_STORAGE_PATH_PATTERN.test(cdnPath)) {
      return SOURCE_TYPE.internalPrivate;
    }
  }

  if (sourceUrl.startsWith('https://www.youtube.com/')) {
    return SOURCE_TYPE.youtube;
  }

  if (getUrlValidationStatus(sourceUrl) === URL_VALIDATION_STATUS.valid) {
    return SOURCE_TYPE.external;
  }

  return SOURCE_TYPE.unsupported;
}

export async function getMediaInformation({ url, sourceType, playbackRange, cdnRootUrl, t }) {
  const defaultResult = {
    sanitizedUrl: url,
    duration: 0,
    range: [0, 1],
    resourceType: RESOURCE_TYPE.unknown,
    error: null
  };

  if (!url) {
    return defaultResult;
  }

  try {
    const isInvalidSourceUrl = sourceType !== MEDIA_SOURCE_TYPE.internal && validation.validateUrl(url, t).validateStatus === 'error';
    if (isInvalidSourceUrl) {
      return defaultResult;
    }

    const completeUrl = urlUtils.getMediaUrl({ sourceUrl: url, sourceType, cdnRootUrl });

    const { sanitizedUrl, startTimecode, stopTimecode, resourceType } = analyzeMediaUrl(completeUrl);
    const duration = await determineMediaDuration(completeUrl);
    const range = [
      startTimecode ? ensureValidMediaPosition(startTimecode / duration) : playbackRange[0],
      stopTimecode ? ensureValidMediaPosition(stopTimecode / duration) : playbackRange[1]
    ];
    return { ...defaultResult, sanitizedUrl, duration, range, resourceType };
  } catch (error) {
    return { ...defaultResult, error };
  }
}
