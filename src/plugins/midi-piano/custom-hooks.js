/* eslint-disable max-lines */
/* eslint-disable complexity */
import * as Tone from 'tone';
import { C } from './constants.js';
import { u } from './exercise-utils.js';
import HttpClient from '../../api-clients/http-client.js';
import { create as createId } from '../../utils/unique-id.js';
import { useEffect, useState, useCallback, useMemo } from 'react';

const getMidiValueFromNoteName = noteName => C.MIDI_NOTE_NAMES.indexOf(noteName);
const getMidiValueFromWhiteKeyIndex = index => C.WHITE_KEYS_MIDI_VALUES[index];
const isWhiteKey = midiValue => C.WHITE_KEYS_MIDI_VALUES.indexOf(midiValue) !== -1;
// X const getWhiteKeyIndexFromMidiValue = midiValue => WHITE_KEYS_MIDI_VALUES.indexOf(midiValue); XXX

/**
 * This hook uses the Web MIDI API for checking if a MIDI device is connected.
 * If true, stores the Midi Acces Object on browser document object to be accessed by each piano on the page.
 */
export function useMidiDevice() {
  const [isMidiDeviceConnected, setIsMidiDeviceConnected] = useState(false);

  useEffect(() => {
    if (isMidiDeviceConnected) {
      return;
    }
    if (typeof document.midiAccessObj !== 'undefined' && document.midiAccessObj.inputs.size > 0) {
      setIsMidiDeviceConnected(true);
      return;
    }
    // Triggers if browser supports Web MIDI API, even if no MIDI device is connected
    function onMIDISuccess(midiAccessObj) {
      if (midiAccessObj.inputs.size > 0) {
        setIsMidiDeviceConnected(true);
      }
      if (!document.midiAccessObj) {
        document.midiAccessObj = midiAccessObj;
      }
    }
    function onMIDIFailure(error) {
      console.log(error);
    }

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }, [isMidiDeviceConnected]);

  return isMidiDeviceConnected;
}

// Load the midi file defined in midi-piano-editor.js
export function useMidiLoader(src) {
  const [midiData, setMidiData] = useState(null);

  useEffect(() => {
    if (!src || midiData) {
      return;
    }
    const httpClient = new HttpClient();
    httpClient.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        setMidiData(response.exerciseData);
      });
  }, [src, midiData]);

  return midiData;
}

/**
 * This Hook initiates a Tone.js sampler used for playback of any notes.
 * The Sampler is stored on the browser document object so that it can be accessed by every piano on the page.
 * Currently there are only piano samples available. By including the sampleType variable it will be easy to add further samples like Harpsichord later.
 */
export function useToneJsSampler(sampleType) {
  const [hasSamplerLoaded, setHasSamplerLoaded] = useState(false);
  const [sampler, setSampler] = useState(null);

  useEffect(() => {

    if (document.toneJsSamplers?.[sampleType]) {
      if (!hasSamplerLoaded) {
        setHasSamplerLoaded(true);
        setSampler(document.toneJsSamplers[sampleType]);
      }
      return;
    }

    if (!document.toneJsSamplers) {
      document.toneJsSamplers = {};
    }

    document.toneJsSamplers[sampleType] = new Tone.Sampler({
      urls: {
        'A0': 'A0.mp3',
        'C1': 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        'A1': 'A1.mp3',
        'C2': 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        'A2': 'A2.mp3',
        'C3': 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
        'C5': 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        'A5': 'A5.mp3',
        'C6': 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        'A6': 'A6.mp3',
        'C7': 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        'A7': 'A7.mp3',
        'C8': 'C8.mp3'
      },
      onload: () => {
        setHasSamplerLoaded(true);
        setSampler(document.toneJsSamplers[sampleType]);
      },
      baseUrl: `https://anmeldung-sprechstunde.herokuapp.com/instrument-samples/${sampleType}/` // Samples better be hosted in project. XXX
    }).toDestination();
  }, [hasSamplerLoaded, setHasSamplerLoaded, sampleType]);

  return [sampler, hasSamplerLoaded];
}

// Set unique pianoId which does not start with a number character for use as CSS selector in updateMidiInputSwitches in midi-piano-display.js
export function usePianoId(defaultValue) {
  const [pianoId, setPianoId] = useState(defaultValue);

  useEffect(() => {
    const id = `ID${createId()}`;
    setPianoId(id);
  }, []);

  return pianoId;
}

export function useExercise(content, currentTestIndex, currentExerciseIndex) {

  const currentTest = useCallback(() => content.tests[currentTestIndex], [content.tests, currentTestIndex]);
  const currentNoteSequence = useCallback(() => currentTest().customNoteSequences[currentExerciseIndex], [currentExerciseIndex, currentTest]);

  // Used for all exercise modes except chord mode. NoteRange defined in editor becomes rendered piano keyRange.
  // Checks if noteRange is too narrow for exercise and if so widens it.
  const getKeyRange = useCallback(paramObj => {
    const { intervalVectors, midiNoteNameSequence, noteRange } = paramObj;
    const test = currentTest();
    const exerciseType = test.exerciseType;

    let firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.first);
    let lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.last);

    if (u.isCustomNoteSequenceExercise(test)) {

      for (let i = 0; i < midiNoteNameSequence.length; i += 1) {
        const midiValue = getMidiValueFromNoteName(midiNoteNameSequence[i]);
        if (midiValue < firstKeyRangeMidiValue) {
          firstKeyRangeMidiValue = midiValue;
        }
        if (midiValue > lastKeyRangeMidiValue) {
          lastKeyRangeMidiValue = midiValue;
        }
      }
    }

    if (exerciseType === C.EXERCISE_TYPES.noteSequence && !test.isCustomNoteSequence) {
      for (const vector of intervalVectors) {
        if (firstKeyRangeMidiValue > lastKeyRangeMidiValue - vector) {
          firstKeyRangeMidiValue = lastKeyRangeMidiValue - vector;
        }
        if (lastKeyRangeMidiValue < firstKeyRangeMidiValue + vector) {
          lastKeyRangeMidiValue = firstKeyRangeMidiValue + vector;
        }
      }
    }

    // Make sure first and last midi value belongs to white key
    firstKeyRangeMidiValue = C.WHITE_KEYS_MIDI_VALUES.includes(firstKeyRangeMidiValue) ? firstKeyRangeMidiValue : firstKeyRangeMidiValue - 1;
    lastKeyRangeMidiValue = C.WHITE_KEYS_MIDI_VALUES.includes(lastKeyRangeMidiValue) ? lastKeyRangeMidiValue : lastKeyRangeMidiValue + 1;

    const keyRange = {};

    // Convert midi values to white key indices which are needed for rendering CustomPiano
    keyRange.first = C.WHITE_KEYS_MIDI_VALUES.indexOf(firstKeyRangeMidiValue);
    keyRange.last = C.WHITE_KEYS_MIDI_VALUES.indexOf(lastKeyRangeMidiValue);

    return keyRange;

  }, [currentTest]);

  const getIntervalVectors = useCallback(intervalCheckboxStates => {

    if (intervalCheckboxStates.all) {
      return C.INTERVAL_VECTORS.all;
    }

    let intervalVectors = [];

    for (const interval of C.INTERVAL_NAMES) {
      if (typeof intervalCheckboxStates[interval].minor !== 'undefined') {

        /**
         * If white keys only and interval is checked, only minor interval type vector is included.
         * If minor interval type vector leads to black key, minor interval type vector + 1 (major interval type vector) will be used to generate new note.
         */
        if (u.usesWhiteKeysOnly(test)) {
          (intervalCheckboxStates[interval].minor || intervalCheckboxStates[interval].major) && intervalVectors.push(C.INTERVAL_VECTORS[interval].minor);
        } else {
          intervalVectors.push(intervalCheckboxStates[interval].minor ? C.INTERVAL_VECTORS[interval].minor : null);
          intervalVectors.push(intervalCheckboxStates[interval].major ? C.INTERVAL_VECTORS[interval].major : null);
        }
      } else {
        intervalVectors.push(intervalCheckboxStates[interval] ? C.INTERVAL_VECTORS[interval] : null);
      }
    }
    intervalVectors = intervalVectors.filter(interval => interval);
    return intervalVectors;
  }, []);

  // Used for exercise modes 'interval' and 'noteSequence' without customNoteSequence
  const getSequences = useCallback((keyRange, intervalVectors) => {
    const test = currentTest();
    const exerciseType = test.exerciseType;
    const isNoteSequenceExercise = exerciseType === C.EXERCISE_TYPES.noteSequence;

    const midiValueSequence = [];
    const abcNoteNameSequence = [];
    const midiNoteNameSequence = [];

    const firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.first);
    const lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.last);

    let indicationMidiValue = u.randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);

    if (isNoteSequenceExercise
      && !test.isCustomNoteSequence
      && u.usesWhiteKeysOnly(test)
      && !isWhiteKey(indicationMidiValue)) {
      indicationMidiValue += 1;
    }

    let currentMidiValue = indicationMidiValue;
    let numberOfNotes = currentTest().numberOfNotes;

    if (u.isIntervalExercise(test)) {
      numberOfNotes = 2;
    }

    const [useVectorUpOnly, useVectorDownOnly] = (() => {
      if (!u.isIntervalExercise(test)) {
        return [false, false];
      }
      const directionCheckboxStates = currentTest().directionCheckboxStates;
      if (directionCheckboxStates.up && !directionCheckboxStates.down) {
        return [true, false];
      }
      if (!directionCheckboxStates.up && directionCheckboxStates.down) {
        return [false, true];
      }
      return [false, false];
    })();

    for (let i = 0; i < numberOfNotes - 1; i += 1) {
      let vector = u.randomArrayElem(intervalVectors);

      if (useVectorDownOnly) {
        vector *= -1;
      }

      if (midiValueSequence.length === 0) {
        if (indicationMidiValue + vector < firstKeyRangeMidiValue || indicationMidiValue + vector > lastKeyRangeMidiValue) {
          if (indicationMidiValue + vector < firstKeyRangeMidiValue) {
            indicationMidiValue = lastKeyRangeMidiValue;
          } else {
            indicationMidiValue = firstKeyRangeMidiValue;
          }
        }
      }

      let vectorWithDirection;

      if (!useVectorUpOnly && !useVectorDownOnly) {
        vectorWithDirection = vector * u.randomArrayElem([-1, 1]);
      } else {
        vectorWithDirection = vector;
      }

      if (midiValueSequence.length === 0) {
        currentMidiValue = indicationMidiValue;
      }
      let nextMidiValue = currentMidiValue + vectorWithDirection;

      if (!useVectorUpOnly && !useVectorDownOnly) {
        if (nextMidiValue < firstKeyRangeMidiValue || nextMidiValue > lastKeyRangeMidiValue) {
          vectorWithDirection *= -1;
          nextMidiValue = currentMidiValue + vectorWithDirection;
        }
      }

      if (u.allowsLargeIntervals(test)) {
        const possibleNextMidiValues = [];
        if (vectorWithDirection < 0) {
          while ((indicationMidiValue + vectorWithDirection) > firstKeyRangeMidiValue) {
            possibleNextMidiValues.push(indicationMidiValue + vectorWithDirection);
            vectorWithDirection -= 12;
          }
        }
        if (vectorWithDirection > 0) {
          while ((indicationMidiValue + vectorWithDirection) < lastKeyRangeMidiValue) {
            possibleNextMidiValues.push(indicationMidiValue + vectorWithDirection);
            vectorWithDirection += 12;
          }
        }
        if (possibleNextMidiValues.length !== 0) {
          nextMidiValue = u.randomArrayElem(possibleNextMidiValues);
        }
      }

      if (isNoteSequenceExercise
        && !test.isCustomNoteSequence
        && u.usesWhiteKeysOnly(test)
        && !isWhiteKey(nextMidiValue)) {
        if (vectorWithDirection < 0) {
          nextMidiValue = currentMidiValue + vectorWithDirection - 1;
        }
        if (vectorWithDirection > 0) {
          nextMidiValue = currentMidiValue + vectorWithDirection + 1;
        }
      }

      if (midiValueSequence.length === 0) {
        midiValueSequence.push(indicationMidiValue);
        abcNoteNameSequence.push(C.ABC_NOTE_NAMES[indicationMidiValue]);
        midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[indicationMidiValue]);
      }
      midiValueSequence.push(nextMidiValue);
      abcNoteNameSequence.push(C.ABC_NOTE_NAMES[nextMidiValue]);
      midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[nextMidiValue]);

      currentMidiValue = nextMidiValue;
    }

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence];
  }, [currentTest]);

  const getSequencesForRandomNoteSequenceMode = useCallback((keyRange, intervalVectors) => {
    const test = currentTest();

    const midiValueSequence = [];
    const abcNoteNameSequence = [];
    const midiNoteNameSequence = [];

    const [indicationMidiValue, firstVector] = u.getIndicationMidiValueAndFirstVector(test, keyRange, intervalVectors);

    midiValueSequence.push(indicationMidiValue);
    abcNoteNameSequence.push(C.ABC_NOTE_NAMES[indicationMidiValue]);
    midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[indicationMidiValue]);

    let currentMidiValue = indicationMidiValue;
    const numberOfNotes = currentTest().numberOfNotes;

    for (let i = 0; i < numberOfNotes; i += 1) {
      const nextMidiValue = u.getNextNoteSequenceVectorAndMidiValue(test, currentMidiValue, keyRange, intervalVectors, firstVector, i);

      midiValueSequence.push(nextMidiValue);
      abcNoteNameSequence.push(C.ABC_NOTE_NAMES[nextMidiValue]);
      midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[nextMidiValue]);

      currentMidiValue = nextMidiValue;
    }

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence];
  }, [currentTest]);

  const getSolution = useCallback(abcNoteNameSequence => {
    let solution = '';
    for (const noteName of abcNoteNameSequence) {
      solution += noteName;
    }
    return solution;
  }, []);

  const getChordVectors = useCallback(() => {
    const chordVectors = [];
    const test = currentTest();
    const triadCheckboxStates = test.triadCheckboxStates;
    const seventhChordCheckboxStates = test.seventhChordCheckboxStates;
    const inversionCheckboxStates = test.inversionCheckboxStates;
    const triads = Object.keys(triadCheckboxStates).map(key => triadCheckboxStates[key] && key).filter(elem => elem);
    const seventhChords = Object.keys(seventhChordCheckboxStates).map(key => seventhChordCheckboxStates[key] && key).filter(elem => elem);
    const inversions = Object.keys(inversionCheckboxStates).map(key => inversionCheckboxStates[key] && key).filter(elem => elem);

    for (const inversion of inversions) {
      chordVectors.push(...triads.map(triad => C.CHORD_VECTORS.triads[triad][inversion]).filter(elem => elem));
      chordVectors.push(...seventhChords.map(seventhChord => C.CHORD_VECTORS.seventhChords[seventhChord][inversion]));
    }

    return chordVectors;
  }, [currentTest]);

  const getSequencesAndChordVector = useCallback((keyRange, chordVectors) => {

    let midiValueSequence = [];
    const firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.first);
    const lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.last);

    // In chord mode indication key is always bass note. Make sure bassNoteMidiValue is in lower half of keyRange
    const bassNoteMidiValue = u.randomIntBetween(firstKeyRangeMidiValue, (firstKeyRangeMidiValue + lastKeyRangeMidiValue) / 2);
    midiValueSequence.push(bassNoteMidiValue);

    const vector = u.randomArrayElem(chordVectors);

    for (let i = 0; i < vector.length; i += 1) {
      const nextMidiValue = u.getNextChordMidiValue(currentTest(), bassNoteMidiValue, vector[i], keyRange);
      midiValueSequence.push(nextMidiValue);
    }

    midiValueSequence = midiValueSequence.sort((a, b) => {
      return a - b;
    });

    const abcNoteNameSequence = midiValueSequence.map(value => C.ABC_NOTE_NAMES[value]);
    const midiNoteNameSequence = midiValueSequence.map(value => C.MIDI_NOTE_NAMES[value]);

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence, vector];
  }, [currentTest]);

  const getKeyRangeForChordMode = useCallback((noteRange, chordVectors) => {
    let firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.first);
    let lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.last);

    for (const chordVector of chordVectors) {
      for (const number of chordVector) {
        firstKeyRangeMidiValue + number > lastKeyRangeMidiValue && (lastKeyRangeMidiValue = firstKeyRangeMidiValue + number);
        lastKeyRangeMidiValue - number < firstKeyRangeMidiValue && (firstKeyRangeMidiValue = lastKeyRangeMidiValue - number);
      }
    }

    return {
      first: C.WHITE_KEYS_MIDI_VALUES.indexOf(firstKeyRangeMidiValue),
      last: C.WHITE_KEYS_MIDI_VALUES.indexOf(lastKeyRangeMidiValue)
    };
  }, []);

  const getData = useCallback(
    () => {
      if (content.tests.length === 0) {
        return null;
      }

      const test = currentTest();
      const contentKeyRange = content.keyRange;

      if (u.isCustomNoteSequenceExercise(test)) {
        const noteSequence = currentNoteSequence();
        const midiNoteNameSequence = noteSequence.midiNoteNameSequence;
        const keyRange = getKeyRange({ midiNoteNameSequence, noteRange: noteSequence.noteRange });

        return { keyRange,
          midiNoteNameSequence,
          clef: noteSequence.clef,
          solution: noteSequence.filteredAbc,
          indication: noteSequence.abcNoteNameSequence[0],
          midiValueSequence: noteSequence.midiValueSequence,
          abcNoteNameSequence: noteSequence.abcNoteNameSequence,
          indicationMidiValue: noteSequence.midiValueSequence[0] };
      }

      if (u.isRandomNoteSequenceExercise(test)) {
        const intervalCheckboxStates = test.noteSequenceCheckboxStates;
        const intervalVectors = getIntervalVectors(intervalCheckboxStates);
        const keyRange = getKeyRange({ intervalVectors, noteRange: test.noteRange });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequencesForRandomNoteSequenceMode(keyRange, intervalVectors);
        const solution = getSolution(abcNoteNameSequence);

        return {
          keyRange,
          solution,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          clef: test.clef,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      if (u.isIntervalExercise(test)) {
        const checkboxStates = test.intervalCheckboxStates;
        const intervalVectors = getIntervalVectors(checkboxStates);
        const keyRange = getKeyRange({ intervalVectors, noteRange: test.noteRange });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequences(keyRange, intervalVectors);

        return {
          keyRange,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      if (u.isChordExercise(test)) {
        const chordVectors = getChordVectors();
        const keyRange = getKeyRangeForChordMode(test.noteRange, chordVectors);
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence, chordVector] = getSequencesAndChordVector(keyRange, chordVectors);

        return {
          keyRange,
          chordVector,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      return {
        keyRange: contentKeyRange
      };
    },
    [
      currentTest,
      getKeyRange,
      getSolution,
      getSequences,
      getChordVectors,
      content.keyRange,
      getIntervalVectors,
      currentNoteSequence,
      content.tests.length,
      getKeyRangeForChordMode,
      getSequencesAndChordVector,
      getSequencesForRandomNoteSequenceMode
    ]
  );

  // No dependencies needed since needs to execute only once
  const defaultData = useMemo(() => {
    return {
      abcNoteNameSequence: [],
      keyRange: getData().keyRange,
      indication: '',
      solution: ''
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * If getData was called as useState callback, server and client would generate different indicationMidiValues,
   * which would result in blue indication piano key changing on page load. That is why defaultData is used.
   */
  const [exerciseData, setExerciseData] = useState(defaultData);

  useEffect(() => {
    setExerciseData(() => getData());
  }, [currentTestIndex, getData]);

  return exerciseData;
}
