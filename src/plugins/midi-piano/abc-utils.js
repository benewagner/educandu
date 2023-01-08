import { NOTE_CONVERSION_MAP, MIDI_NOTE_NAMES } from './constants.js';

export const getAbcNoteNameFromMidiValue = midiValue => {
  NOTE_CONVERSION_MAP.get(MIDI_NOTE_NAMES[midiValue]);
};

export function filterAbcString(string) {
  const charsToDelete = [' ', '|', '=', '(', ')', '[', ']', '-', 'z', 'x', '1', '2', '3', '4', '5', '6', '7', '8'];
  let newString = string;

  charsToDelete.forEach(elem => {
    newString = newString.replaceAll(elem, '');
  });

  return newString;
}

// Returns two arrays (= sequences) of abc note names and note names Tone.js sampler can play.
export function analyizeABC(string) {
  if (string.length === 0) {
    return [null, null, null];
  }

  const noteNameLetters = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const noteStartChars = ['^', '_', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const abcNotes = [];
  const noteNameSequence = [];
  let newString = filterAbcString(string);
  const filteredAbc = newString;

  while (newString.length > 0 || typeof newString !== 'undefined') {

    let index = 0;
    let noteNameLetterIndex;
    let isNoteNameLetterFound = false;

    while (!noteStartChars.includes(newString[index])) {
      index += 1;
    }

    if (noteNameLetters.includes(newString[index])) {
      isNoteNameLetterFound = true;
      noteNameLetterIndex = index;
    }

    const noteStartIndex = index;
    let nextNoteStartIndex;
    index += 1;

    while (!isNoteNameLetterFound || typeof nextNoteStartIndex === 'undefined') {
      if (typeof newString[index] === 'undefined') {
        break;
      }
      if (!isNoteNameLetterFound && noteNameLetters.includes(newString[index].toLowerCase())) {
        isNoteNameLetterFound = true;
        noteNameLetterIndex = index;
      }
      if (isNoteNameLetterFound && noteNameLetterIndex !== index && noteStartChars.includes(newString[index])) {
        nextNoteStartIndex = index;
      }
      index += 1;
    }

    // Optimierbar? XXX
    // Checks if only last note is remaining.
    if (typeof nextNoteStartIndex === 'undefined') {
      let lastNote = true;
      for (let i = index; i < newString.length; i += 1) {
        if (noteNameLetters.includes(newString[i])) {
          lastNote = false;
        }
      }
      if (lastNote) {
        abcNotes.push(newString.substring(0));
        noteNameSequence.push(NOTE_CONVERSION_MAP.get(newString.substring(0)));
        return [abcNotes, noteNameSequence, filteredAbc];
      }
    }

    const substring = newString.substring(noteStartIndex, nextNoteStartIndex);
    const noteName = NOTE_CONVERSION_MAP.get(substring);
    abcNotes.push(substring);
    noteNameSequence.push(noteName);

    newString = newString.substring(nextNoteStartIndex);

    if (typeof newString[0] === 'undefined') {
      return [abcNotes, noteNameSequence, filteredAbc];
    }
  }
  return [abcNotes, noteNameSequence, filteredAbc];
}

// export async function playExerciseArray(exerciseArray, callback, noteDuration) {

//   for (let i = 0; i < exerciseArray.length; i += 1) {
//     callback(exerciseArray[i]);
//     // eslint-disable-next-line no-await-in-loop
//     await new Promise(res => {
//       setTimeout(() => {
//         res();
//       }, noteDuration);
//     });
//   }
// }

// const callback = noteName => console.log(noteName);

// playExerciseArray(['C5', 'D5', 'E5', 'F5', 'G5'], callback, 1000);
