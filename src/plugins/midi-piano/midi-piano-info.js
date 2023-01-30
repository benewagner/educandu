import React from 'react';
import MidiPianoIcon from './midi-piano-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import MidiPianoDisplay from './midi-piano-display.js';
import { MIDI_SOURCE_TYPE } from '../../domain/constants.js';

class MidiPianoInfo {

  static get typeName() { return 'midi-piano'; }

  constructor() {
    this.type = 'midi-piano';
  }

  getName(t) {
    return t('midiPiano:name');
  }

  getIcon() {
    return <MidiPianoIcon />;
  }

  getDisplayComponent() {
    return MidiPianoDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./midi-piano-editor.js')).default;
  }

  getDefaultCustomNoteSequence() {
    return {
      abc: 'c',
      abcNoteNameSequence: ['c'],
      clef: 'treble',
      filteredAbc: 'c',
      midiNoteNameSequence: ['C5'],
      midiValueSequence: [72],
      noteRange: { first: 19, last: 39 }
    };
  }

  getDefaultTest() {
    const defaultIntervalCheckboxStates = {
      all: false,
      prime: false,
      second: {
        minor: true,
        major: true
      },
      third: {
        minor: true,
        major: true
      },
      fourth: true,
      tritone: false,
      fifth: true,
      sixth: {
        minor: true,
        major: true
      },
      seventh: {
        minor: true,
        major: true
      },
      octave: false
    };

    return {
      exerciseType: '',
      intervalNoteRange: { first: 12, last: 39 },
      chordNoteRange: { first: 12, last: 39 },
      noteSequenceNoteRange: { first: 19, last: 39 },
      whiteKeysOnly: false,
      numberOfNotes: 4,
      clef: 'treble',
      isCustomNoteSequence: false,
      customNoteSequences: [this.getDefaultCustomNoteSequence()],
      intervalAllowsLargeIntervals: false,
      chordAllowsLargeIntervals: false,
      noteSequenceAllowsLargeIntervals: true,
      directionCheckboxStates: {
        up: true,
        down: false
      },
      triadCheckboxStates: {
        majorTriad: true,
        minorTriad: true,
        diminished: false,
        augmented: false
      },
      seventhChordCheckboxStates: {
        majorTriadMinorSeventh: false,
        majorTriadMajorSeventh: false,
        minorTriadMinorSeventh: false,
        minorTriadMajorSeventh: false,
        halfDiminished: false,
        diminishedSeventh: false
      },
      inversionCheckboxStates: {
        fundamental: true,
        firstInversion: false,
        secondInversion: false,
        thirdInversion: false
      },
      intervalCheckboxStates: {
        ...defaultIntervalCheckboxStates
      },
      noteSequenceCheckboxStates: {
        ...defaultIntervalCheckboxStates
      }
    };
  }

  getDefaultContent() {

    return {
      sourceType: MIDI_SOURCE_TYPE.internal,
      sourceUrl: '',
      keyRange: { first: 12, last: 39 },
      midiTrackTitle: '',
      colors: {
        blackKey: 'rgb(56, 56, 56)',
        whiteKey: 'rgb(255, 255, 255)',
        activeKey: '#82E2FF',
        correct: '#94F09D',
        answer: '#F9F793',
        wrong: '#FF8D8D'
      },
      sampleType: 'piano',
      tests: []
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    return redactedContent;
  }

  getCdnResources(content) {
    return [];
  }
}

export default MidiPianoInfo;
