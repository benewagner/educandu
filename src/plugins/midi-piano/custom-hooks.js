import * as Tone from 'tone';
import { useEffect, useState, useCallback } from 'react';
import HttpClient from '../../api-clients/http-client.js';
import { create as createId } from '../../utils/unique-id.js';
import { NOTES, WHITE_KEYS_MIDI_VALUES } from './constants.js';

const getMidiValueFromNoteName = noteName => NOTES.indexOf(noteName);
const getMidiValueFromWhiteKeyIndex = index => WHITE_KEYS_MIDI_VALUES[index];
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
        setMidiData(response.data);
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
  const [samplerHasLoaded, setSamplerHasLoaded] = useState(false);
  const [sampler, setSampler] = useState(null);

  useEffect(() => {

    if (document.toneJsSamplers?.[sampleType]) {
      if (!samplerHasLoaded) {
        setSamplerHasLoaded(true);
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
        setSamplerHasLoaded(true);
        setSampler(document.toneJsSamplers[sampleType]);
      },
      baseUrl: `https://anmeldung-sprechstunde.herokuapp.com/instrument-samples/${sampleType}/` // Samples better be hosted in project. XXX
    }).toDestination();
  }, [samplerHasLoaded, setSamplerHasLoaded, sampleType]);

  return [sampler, samplerHasLoaded];
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

  const getData = useCallback(
    () => {
      if (content.tests.length === 0) {
        return content.keyRange;
      }

      const test = currentTest();
      const contentKeyRange = content.keyRange;

      if (test.exerciseType === 'noteSequence' && test.isCustomNoteSequence) {
        const noteSequence = currentNoteSequence();
        const midiNoteNameSequence = noteSequence.midiNoteNameSequence;
        const currentKeyRange = {};

        let firstMidiValue = getMidiValueFromWhiteKeyIndex(noteSequence.noteRange.first);
        let lastMidiValue = getMidiValueFromWhiteKeyIndex(noteSequence.noteRange.last);

        for (let i = 0; i < midiNoteNameSequence.length; i += 1) {
          const midiValue = getMidiValueFromNoteName(midiNoteNameSequence[i]);
          if (midiValue < firstMidiValue) {
            firstMidiValue = midiValue;
          }
          if (midiValue > lastMidiValue) {
            lastMidiValue = midiValue;
          }
        }

        // Make sure first and last midi value belongs to white key
        firstMidiValue = WHITE_KEYS_MIDI_VALUES.includes(firstMidiValue) ? firstMidiValue : firstMidiValue - 1;
        lastMidiValue = WHITE_KEYS_MIDI_VALUES.includes(lastMidiValue) ? lastMidiValue : lastMidiValue + 1;

        // Convert midi values to white key indices which are needed for rendering custom piano
        currentKeyRange.first = WHITE_KEYS_MIDI_VALUES.indexOf(firstMidiValue);
        currentKeyRange.last = WHITE_KEYS_MIDI_VALUES.indexOf(lastMidiValue);

        // CustomNoteSequence mode does not autogenerate exercises
        const midiValueRange = null;

        return { currentKeyRange,
          midiValueRange,
          exerciseArray: midiNoteNameSequence,
          indication: noteSequence.abcNoteNameSequence[0],
          solution: noteSequence.filteredAbc };
      }

      return contentKeyRange;
    },
    [content.keyRange, content.tests.length, currentNoteSequence, currentTest]
  );

  const [data, setData] = useState(() => getData());

  useEffect(() => {
    setData(() => getData());
  }, [currentTestIndex, getData]);

  return [
    data.currentKeyRange,
    data.midiValueRange,
    data.exerciseArray,
    data.indication,
    data.solution
  ];
}
