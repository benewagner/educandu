import { WHITE_KEYS_MIDI_VALUES, EXERCISE_TYPES } from './constants.js';

export const playNotesSimultaneously = async (sampler, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef) => {
  sampler.triggerAttackRelease(midiNoteNameSequence, noteDurationRef.current / 1000);
  await new Promise(res => {
    setTimeout(() => {
      res();
      isExercisePlayingRef.current = false;
    }, noteDurationRef.current);
  });
};

export const playNotesSuccessively = async (sampler, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef, playExerciseStartIndex) => {
  for (let i = playExerciseStartIndex; i < midiNoteNameSequence.length; i += 1) {
    // Check if stop button has been clicked
    if (!isExercisePlayingRef.current) {
      return;
    }
    sampler.triggerAttackRelease(midiNoteNameSequence[i], noteDurationRef.current / 1000);
    // eslint-disable-next-line no-await-in-loop
    await new Promise(res => {
      setTimeout(() => {
        res();
      }, noteDurationRef.current);
    });
  }
  isExercisePlayingRef.current = false;
};

export const isKeyOutOfRange = (keyRange, midiValue) => {
  if (midiValue < WHITE_KEYS_MIDI_VALUES[keyRange.first] || midiValue > WHITE_KEYS_MIDI_VALUES[keyRange.last]) {
    return true;
  }
  return false;
};

// export const isWhiteKeysOnly = test => {
//   return test.exerciseType === EXERCISE_TYPES.noteSequence
//     && !test.isCustomNoteSequence
//     && test.whiteKeysOnly;
// };

export const isCustomNoteSequenceExercise = test => {
  return test.exerciseType === EXERCISE_TYPES.noteSequence
    && test.isCustomNoteSequence;
};

export const isRandomNoteSequenceExercise = test => {
  return test.exerciseType === EXERCISE_TYPES.noteSequence
    && !test.isCustomNoteSequence;
};

const isIntervalExercise = test => test.exerciseType === EXERCISE_TYPES.interval;
const isChordExercise = test => test.exerciseType === EXERCISE_TYPES.chord;
const allowsLargeIntervals = test => test[`${test.exerciseType}AllowsLargeIntervals`];

const usesWhiteKeysOnly = test => {
  return test.exerciseType === EXERCISE_TYPES.noteSequence
    && !test.isCustomNoteSequence
    && test.whiteKeysOnly;
};

const isInRange = (keyRange, midiValue) => {
  const firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.first];
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  return midiValue >= firstKeyRangeMidiValue && midiValue <= lastKeyRangeMidiValue;
};

export const randomIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomArrayElem = array => {
  return array[randomIntBetween(0, array.length - 1)];
};

const isWhiteKey = midiValue => WHITE_KEYS_MIDI_VALUES.indexOf(midiValue) !== -1;

const getIndicationMidiValueAndFirstVector = (test, keyRange, intervalVectors) => {
  const firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.first];
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  let indicationMidiValue = randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);
  const firstVector = randomArrayElem(intervalVectors);
  if (test.whiteKeysOnly && !isWhiteKey(indicationMidiValue)) {
    indicationMidiValue = indicationMidiValue + 1 <= lastKeyRangeMidiValue ? indicationMidiValue + 1 : indicationMidiValue - 1;
    if ((!isWhiteKey(indicationMidiValue + firstVector) || !isInRange(keyRange, indicationMidiValue + firstVector)) && [5, 7].includes(firstVector)) {
      for (let i = firstKeyRangeMidiValue; i <= lastKeyRangeMidiValue; i += 1) {
        indicationMidiValue = i;
        if (isWhiteKey(indicationMidiValue) && isInRange(keyRange, indicationMidiValue + firstVector) && isWhiteKey(indicationMidiValue + firstVector)) {
          break;
        }
      }
    }
  }
  return [indicationMidiValue, firstVector];
};

const getWhiteKey = (midiValue, vector) => {
  return vector < 0 ? midiValue + vector - 1 : midiValue + vector + 1;
};

const getNextNoteSequenceVectorAndMidiValue = (test, currentMidiValue, keyRange, intervalVectors, firstVector, i) => {
  const firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.first];
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  let newVector = i === 0 ? firstVector : randomArrayElem(intervalVectors) * randomArrayElem([-1, 1]);
  let nextMidiValue = currentMidiValue + newVector;

  while (!isInRange(keyRange, nextMidiValue) || (test.whiteKeysOnly && !isWhiteKey(nextMidiValue))) {
    newVector = randomArrayElem(intervalVectors) * randomArrayElem([-1, 1]);
    nextMidiValue = currentMidiValue + newVector;
  }

  if (allowsLargeIntervals(test)) {
    const possibleNextMidiValues = [];
    if (newVector < 0) {
      while (currentMidiValue + newVector > firstKeyRangeMidiValue) {
        possibleNextMidiValues.push(currentMidiValue + newVector);
        newVector -= 12;
      }
    } else if (newVector > 0) {
      while (currentMidiValue + newVector < lastKeyRangeMidiValue) {
        possibleNextMidiValues.push(currentMidiValue + newVector);
        newVector += 12;
      }
    }
    if (possibleNextMidiValues.length > 0) {
      nextMidiValue = randomArrayElem(possibleNextMidiValues);
    }
  }

  return nextMidiValue;
};

const getNextChordMidiValue = (test, bassNoteMidiValue, vector, keyRange) => {
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  let currentMidiValue = bassNoteMidiValue;
  let nextMidiValue = bassNoteMidiValue + vector;

  if (allowsLargeIntervals(test)) {
    const possibleMidiValues = [];

    while (currentMidiValue + vector < lastKeyRangeMidiValue) {
      possibleMidiValues.push(currentMidiValue + vector);
      currentMidiValue += 12;
    }
    nextMidiValue = randomArrayElem(possibleMidiValues);
  }

  return nextMidiValue;
};

export const u = {
  getWhiteKey,
  isKeyOutOfRange,
  // isWhiteKeysOnly,
  randomArrayElem,
  isChordExercise,
  randomIntBetween,
  usesWhiteKeysOnly,
  isIntervalExercise,
  allowsLargeIntervals,
  getNextChordMidiValue,
  playNotesSuccessively,
  playNotesSimultaneously,
  isRandomNoteSequenceExercise,
  isCustomNoteSequenceExercise,
  getIndicationMidiValueAndFirstVector,
  getNextNoteSequenceVectorAndMidiValue
};
