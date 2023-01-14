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
      noteRange: { first: 12, last: 39 }
    };
  }

  getDefaultTest() {
    const defaultIntervalCheckboxStates = {
      all: false,
      prime: false,
      second: {
        minor: false,
        major: false
      },
      third: {
        minor: false,
        major: false
      },
      fourth: false,
      tritone: false,
      fifth: false,
      sixth: {
        minor: false,
        major: false
      },
      seventh: {
        minor: false,
        major: false
      },
      octave: false
    };

    return {
      exerciseType: 'noteSequence',
      noteRange: { first: 12, last: 39 },
      whiteKeysOnly: false,
      numberOfNotes: 4,
      clef: 'treble',
      isCustomNoteSequence: true,
      customNoteSequences: [this.getDefaultCustomNoteSequence()],
      directionCheckboxStates: {
        up: true,
        down: false
      },
      triadCheckboxStates: {
        majorTriad: false,
        minorTriad: false,
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
        fundamental: false,
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
      keyRange: {
        first: 12,
        last: 39
      },
      hasMidiFile: false,
      midiTrackTitle: '',
      colors: {
        blackKey: 'rgb(56, 56, 56)',
        activeKey: 'rgb(127, 202, 230)',
        whiteKey: 'rgb(255, 255, 255)'
      },
      samplesType: 'piano',
      tests: [this.getDefaultTest()]
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
