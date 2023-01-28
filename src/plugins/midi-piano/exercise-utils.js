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

export const isWhiteKeysOnly = test => {
  return test.exerciseType === EXERCISE_TYPES.noteSequence
    && !test.isCustomNoteSequence
    && test.whiteKeysOnly;
};

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

// const isInRange = (keyRange, midiValue) => {
//   const firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.first];
//   const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
//   return midiValue >= firstKeyRangeMidiValue && midiValue <= lastKeyRangeMidiValue;
// };

export const randomIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomArrayElem = array => {
  return array[randomIntBetween(0, array.length - 1)];
};

const getIndicationMidiValue = (test, keyRange) => {
  const firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.first];
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  let midiValue = randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);
  const isWhiteKey = WHITE_KEYS_MIDI_VALUES.indexOf(midiValue) !== -1;
  if (test.whiteKeysOnly && !isWhiteKey) {
    midiValue = midiValue + 1 <= lastKeyRangeMidiValue ? midiValue + 1 : midiValue - 1;
  }
  return midiValue;
};

const getWhiteKey = (midiValue, vector) => {
  return vector < 0 ? midiValue + vector - 1 : midiValue + vector + 1;
};

export const u = {
  // isInRange,
  getWhiteKey,
  isKeyOutOfRange,
  isWhiteKeysOnly,
  randomArrayElem,
  isChordExercise,
  randomIntBetween,
  usesWhiteKeysOnly,
  isIntervalExercise,
  allowsLargeIntervals,
  playNotesSuccessively,
  getIndicationMidiValue,
  playNotesSimultaneously,
  isRandomNoteSequenceExercise,
  isCustomNoteSequenceExercise
};
