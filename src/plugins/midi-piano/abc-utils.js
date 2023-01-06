import { noteConversionMap } from './constants.js';

export function filterAbcString(string) {
  const charsToDelete = [' ', '|', '=', '(', ')', '[', ']', '-', 'z', 'x', '1', '2', '3', '4', '5', '6', '7', '8'];
  let newString = string;

  charsToDelete.forEach(elem => {
    newString = newString.replaceAll(elem, '');
  });

  return newString;
}

// Converts abc code to an array of note names, which (the note names) can be played by Tone.js sampler.
export function analyizeABC(string) {
  if (string.length === 0) {
    return [];
  }

  const abcNotes = [];
  const noteNameSequence = [];
  const noteNameLetters = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x'];
  const noteStartChars = ['^', '_', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  let newString = filterAbcString(string);

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
        noteNameSequence.push(noteConversionMap.get(newString.substring(0)));
        return [abcNotes, noteNameSequence];
      }
    }

    const substring = newString.substring(noteStartIndex, nextNoteStartIndex);
    const noteName = noteConversionMap.get(substring);
    abcNotes.push(substring);
    noteNameSequence.push(noteName);

    newString = newString.substring(nextNoteStartIndex);

    if (typeof newString[0] === 'undefined') {
      return [abcNotes, noteNameSequence];
    }
  }
  return [abcNotes, noteNameSequence];
}

export async function playNoteSequence(sequence, callback, noteDuration) {

  function wait(pauseDuration) {
    return new Promise(res => {
      setTimeout(() => {
        res();
      }, pauseDuration);
    });
  }

  async function playNoteAndWait(noteName, cb, duration) {
    cb(noteName);
    await wait(duration);
  }

  for (let i = 0; i < sequence.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await playNoteAndWait(sequence[i], callback, noteDuration);
  }
}
