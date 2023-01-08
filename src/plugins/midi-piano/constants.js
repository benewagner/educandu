export const MIDI_NOTE_NAMES = ['C-1', 'Db-1', 'D-1', 'Eb-1', 'E-1', 'F-1', 'Gb-1', 'G-1', 'Ab-1', 'A-1', 'Bb-1', 'B-1', 'C0', 'Db0', 'D0', 'Eb0', 'E0', 'F0', 'Gb0', 'G0', 'Ab0', 'A0', 'Bb0', 'B0', 'C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2', 'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6', 'Eb6', 'E6', 'F6', 'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'B6', 'C7', 'Db7', 'D7', 'Eb7', 'E7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'B7', 'C8', 'Db8', 'D8', 'Eb8', 'E8', 'F8', 'Gb8', 'G8', 'Ab8', 'A8', 'Bb8', 'B8', 'C9', 'Db9', 'D9', 'Eb9', 'E9', 'F9', 'Gb9', 'G9', 'Ab9', 'A9', 'Bb9', 'B9'];
const abcNoteNames = ['C,,,,,', 'D,,,,,', 'E,,,,,', 'F,,,,,', 'G,,,,,', 'A,,,,,', 'B,,,,,', 'C,,,,', 'D,,,,', 'E,,,,', 'F,,,,', 'G,,,,', 'A,,,,', 'B,,,,', 'C,,,', 'D,,,', 'E,,,', 'F,,,', 'G,,,', 'A,,,', 'B,,,', 'C,,', 'D,,', 'E,,', 'F,,', 'G,,', 'A,,', 'B,,', 'C,', 'D,', 'E,', 'F,', 'G,', 'A,', 'B,', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c\'', 'd\'', 'e\'', 'f\'', 'g\'', 'a\'', 'b\'', 'c\'\'', 'd\'\'', 'e\'\'', 'f\'\'', 'g\'\'', 'a\'\'', 'b\'\'', 'c\'\'\'', 'd\'\'\'', 'e\'\'\'', 'f\'\'\'', 'g\'\'\'', 'a\'\'\'', 'b\'\'\'', 'c\'\'\'\'', 'd\'\'\'\'', 'e\'\'\'\'', 'f\'\'\'\'', 'g\'\'\'\'', 'a\'\'\'\'', 'b\'\'\'\''];

const incrementBy = new Map();
incrementBy.set('c', 2);
incrementBy.set('C', 2);
incrementBy.set('d', 2);
incrementBy.set('D', 2);
incrementBy.set('e', 1);
incrementBy.set('E', 1);
incrementBy.set('f', 2);
incrementBy.set('F', 2);
incrementBy.set('g', 2);
incrementBy.set('G', 2);
incrementBy.set('a', 2);
incrementBy.set('A', 2);
incrementBy.set('b', 1);
incrementBy.set('B', 1);

// Converts abc note names to midi note names which Tone.js sampler can play.
export const NOTE_CONVERSION_MAP = (() => {
  const map = new Map();

  map.set(abcNoteNames[0], MIDI_NOTE_NAMES[0]);
  map.set(`^${abcNoteNames[0]}`, MIDI_NOTE_NAMES[1]);
  map.set(`^^${abcNoteNames[0]}`, MIDI_NOTE_NAMES[2]);

  let midiValue = 2;

  for (let i = 1; i < abcNoteNames.length - 2; i += 1) {
    map.set(abcNoteNames[i], MIDI_NOTE_NAMES[midiValue]);
    map.set(`^${abcNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue + 1]);
    map.set(`^^${abcNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue + 2]);
    map.set(`_${abcNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue - 1]);
    map.set(`__${abcNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue - 2]);

    midiValue += incrementBy.get(abcNoteNames[i][0]);
  }

  map.set(abcNoteNames[abcNoteNames.length - 1], MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 1]);
  map.set(`_${abcNoteNames[abcNoteNames.length - 1]}`, MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 2]);
  map.set(`__${abcNoteNames[abcNoteNames.length - 1]}`, MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 3]);

  return map;
})();

// Provides midi values for all white keys.
export const WHITE_KEYS_MIDI_VALUES = (() => {
  const arr = [];
  const octave = [0, 2, 4, 5, 7, 9, 11];
  let summand = 24;

  arr.push(21);
  arr.push(23);

  for (let i = 0; i < 7; i += 1) {
    for (const value of octave) {
      arr.push(value + summand);
    }
    summand += 12;
  }
  arr.push(108);

  return arr;
})();

export const SAMPLE_TYPES = {
  piano: 'piano'
};

// Also included in midiPlayerNs
export const NOTES = [
  'C-1', 'Db-1', 'D-1', 'Eb-1', 'E-1', 'F-1', 'Gb-1', 'G-1', 'Ab-1', 'A-1', 'Bb-1', 'B-1', 'C0', 'Db0', 'D0', 'Eb0', 'E0', 'F0', 'Gb0', 'G0', 'Ab0',
  'A0', 'Bb0', 'B0', 'C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2',
  'Ab2', 'A2', 'Bb2', 'B2', 'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4',
  'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6', 'Eb6', 'E6', 'F6',
  'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'B6', 'C7', 'Db7', 'D7', 'Eb7', 'E7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'B7', 'C8', 'Db8', 'D8', 'Eb8', 'E8',
  'F8', 'Gb8', 'G8', 'Ab8', 'A8', 'Bb8', 'B8', 'C9', 'Db9', 'D9', 'Eb9', 'E9', 'F9', 'Gb9', 'G9', 'Ab9', 'A9', 'Bb9', 'B9'
];
