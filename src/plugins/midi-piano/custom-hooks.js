import * as Tone from 'tone';
import { useEffect, useState, useCallback } from 'react';
import HttpClient from '../../api-clients/http-client.js';
import { create as createId } from '../../utils/unique-id.js';
import { randomIntBetween, randomArrayElem } from './utils.js';
import { WHITE_KEYS_MIDI_VALUES, EXERCISE_TYPES, INTERVAL_VECTORS, INTERVAL_NAMES, ABC_NOTE_NAMES, MIDI_NOTE_NAMES } from './constants.js';

const getMidiValueFromNoteName = noteName => MIDI_NOTE_NAMES.indexOf(noteName);
const getMidiValueFromWhiteKeyIndex = index => WHITE_KEYS_MIDI_VALUES[index];
const isWhiteKey = midiValue => WHITE_KEYS_MIDI_VALUES.indexOf(midiValue) !== -1;
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

  const getKeyRange = useCallback(paramObj => {
    const { intervalVectors, midiNoteNameSequence, noteRange } = paramObj;
    const exerciseType = currentTest().exerciseType;

    let firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.first);
    let lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.last);

    if (exerciseType === EXERCISE_TYPES.noteSequence && currentTest().isCustomNoteSequence) {

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

    if (exerciseType === EXERCISE_TYPES.noteSequence && !currentTest().isCustomNoteSequence) {
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
    firstKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES.includes(firstKeyRangeMidiValue) ? firstKeyRangeMidiValue : firstKeyRangeMidiValue - 1;
    lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES.includes(lastKeyRangeMidiValue) ? lastKeyRangeMidiValue : lastKeyRangeMidiValue + 1;

    const keyRange = {};

    // Convert midi values to white key indices which are needed for rendering CustomPiano
    keyRange.first = WHITE_KEYS_MIDI_VALUES.indexOf(firstKeyRangeMidiValue);
    keyRange.last = WHITE_KEYS_MIDI_VALUES.indexOf(lastKeyRangeMidiValue);

    return keyRange;

  }, [currentTest]);

  const getIntervalVectors = useCallback(intervalCheckboxStates => {

    const test = currentTest();
    const exerciseType = test.exerciseType;
    const whiteKeysOnly = test.whiteKeysOnly;
    const isCustomNoteSequence = test.isCustomNoteSequence;

    let intervalVectors = [];
    if (intervalCheckboxStates.all) {
      intervalVectors = INTERVAL_VECTORS.all;
      return intervalVectors;
    }

    for (const interval of INTERVAL_NAMES) {
      if (typeof intervalCheckboxStates[interval].minor !== 'undefined') {
        const isMinorIntervalTypeChecked = intervalCheckboxStates[interval].minor;
        const isMajorIntervalTypeChecked = intervalCheckboxStates[interval].major;

        /**
         * If white keys only and interval is checked, only minor interval type vector is included.
         * If minor interval type vector leads to black key, minor interval type vector + 1 (major interval type vector) will be used to generate new note.
         */
        if (whiteKeysOnly
          && exerciseType === EXERCISE_TYPES.noteSequence
          && !isCustomNoteSequence) {
          (isMinorIntervalTypeChecked || isMajorIntervalTypeChecked) && intervalVectors.push(INTERVAL_VECTORS[interval].minor);
        } else {
          intervalVectors.push(isMinorIntervalTypeChecked ? INTERVAL_VECTORS[interval].minor : null);
          intervalVectors.push(isMajorIntervalTypeChecked ? INTERVAL_VECTORS[interval].major : null);
        }
      } else {
        intervalVectors.push(intervalCheckboxStates[interval] ? INTERVAL_VECTORS[interval] : null);
      }
    }
    intervalVectors = intervalVectors.filter(interval => interval !== null);
    return intervalVectors;
  }, [currentTest]);

  const getSequences = useCallback((keyRange, intervalVectors) => {
    const exerciseType = currentTest().exerciseType;

    const midiValueSequence = [];
    const abcNoteNameSequence = [];
    const midiNoteNameSequence = [];

    const firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.first);
    const lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(keyRange.last);

    let indicationMidiValue = randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);
    const whiteKeysOnly = currentTest().whiteKeysOnly;
    if (exerciseType === EXERCISE_TYPES.noteSequence
      && !currentTest().isCustomNoteSequence
      && whiteKeysOnly
      && !isWhiteKey(indicationMidiValue)) {
      indicationMidiValue += 1;
    }
    midiValueSequence.push(indicationMidiValue);
    abcNoteNameSequence.push(ABC_NOTE_NAMES[indicationMidiValue]);
    midiNoteNameSequence.push(MIDI_NOTE_NAMES[indicationMidiValue]);

    let currentMidiValue = indicationMidiValue;
    let numberOfNotes = currentTest().numberOfNotes;

    if (exerciseType === EXERCISE_TYPES.interval) {
      numberOfNotes = 2;
    }

    for (let i = 0; i < numberOfNotes - 1; i += 1) {
      let vector = randomArrayElem(intervalVectors);

      while (firstKeyRangeMidiValue + vector > lastKeyRangeMidiValue || lastKeyRangeMidiValue - vector < firstKeyRangeMidiValue) {
        vector = randomArrayElem(intervalVectors);
      }

      let vectorWithDirection = vector * randomArrayElem([-1, 1]);

      let nextMidiValue = currentMidiValue + vectorWithDirection;

      if (nextMidiValue < firstKeyRangeMidiValue || nextMidiValue > lastKeyRangeMidiValue) {
        vectorWithDirection = -vectorWithDirection;
        nextMidiValue = currentMidiValue + vectorWithDirection;
      }

      if (exerciseType === EXERCISE_TYPES.noteSequence
        && !currentTest().isCustomNoteSequence
        && whiteKeysOnly
        && !isWhiteKey(nextMidiValue)) {
        if (vectorWithDirection < 0) {
          nextMidiValue = currentMidiValue + vectorWithDirection - 1;
        }
        if (vectorWithDirection > 0) {
          nextMidiValue = currentMidiValue + vectorWithDirection + 1;
        }
      }

      midiValueSequence.push(nextMidiValue);
      abcNoteNameSequence.push(ABC_NOTE_NAMES[nextMidiValue]);
      midiNoteNameSequence.push(MIDI_NOTE_NAMES[nextMidiValue]);

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

  const getData = useCallback(
    () => {
      if (content.tests.length === 0) {
        return null;
      }

      const test = currentTest();
      const contentKeyRange = content.keyRange;

      if (test.exerciseType === EXERCISE_TYPES.noteSequence && test.isCustomNoteSequence) {
        const noteSequence = currentNoteSequence();
        const midiNoteNameSequence = noteSequence.midiNoteNameSequence;
        const noteRange = noteSequence.noteRange;
        const keyRange = getKeyRange({ midiNoteNameSequence, noteRange });

        return { keyRange,
          midiNoteNameSequence,
          clef: currentNoteSequence().clef,
          solution: noteSequence.filteredAbc,
          indication: noteSequence.abcNoteNameSequence[0],
          midiValueSequence: currentNoteSequence().midiValueSequence,
          abcNoteNameSequence: currentNoteSequence().abcNoteNameSequence,
          indicationMidiValue: currentNoteSequence().midiValueSequence[0] };
      }

      if (test.exerciseType === EXERCISE_TYPES.noteSequence && !test.isCustomNoteSequence) {
        const intervalCheckboxStates = currentTest().noteSequenceCheckboxStates;
        const intervalVectors = getIntervalVectors(intervalCheckboxStates);
        const noteRange = currentTest().noteRange;
        const keyRange = getKeyRange({ intervalVectors, noteRange });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequences(keyRange, intervalVectors);
        const solution = getSolution(abcNoteNameSequence);

        return {
          keyRange,
          solution,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          clef: currentTest().clef,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      if (test.exerciseType === EXERCISE_TYPES.interval) {
        const noteRange = currentTest().noteRange;
        const checkboxStates = currentTest().intervalCheckboxStates;
        const intervalVectors = getIntervalVectors(checkboxStates);
        const keyRange = getKeyRange({ noteRange, intervalVectors });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequences(keyRange, intervalVectors);
        const solution = getSolution(abcNoteNameSequence);

        return {
          keyRange,
          solution,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          clef: currentTest().clef,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };

      }

      return {
        keyRange: contentKeyRange
      };
    },
    [content.keyRange, content.tests.length, currentNoteSequence, currentTest, getIntervalVectors, getKeyRange, getSequences, getSolution]
  );

  const defaultData = {
    abcNoteNameSequence: [],
    keyRange: getData().keyRange,
    indication: '',
    solution: ''
  };

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
