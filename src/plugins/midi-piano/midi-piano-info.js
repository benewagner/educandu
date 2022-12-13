import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MidiPianoDisplay from './midi-piano-display.js';
import { MIDI_SOURCE_TYPE } from '../../domain/constants.js';
import MidiPianoIcon from './midi-piano-icon.js';

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

  getDefaultContent() {
    return {
      sourceType: MIDI_SOURCE_TYPE.internal,
      sourceUrl: '',
      noteRange: {
        first: 0,
        last: 52
      },
      hasMidiFile: false,
      midiTrackTitle: '',
      activeNotes: [],
      colors: {
        blackKey: 'rgb(56, 56, 56)',
        activeKey: 'rgb(127, 202, 230)',
        whiteKey: 'rgb(255, 255, 255)'
      },
      samplesType: 'harpsichord'
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
