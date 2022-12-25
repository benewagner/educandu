/* eslint-disable no-console */
const noteNames = ['C-1', 'Db-1', 'D-1', 'Eb-1', 'E-1', 'F-1', 'Gb-1', 'G-1', 'Ab-1', 'A-1', 'Bb-1', 'B-1', 'C0', 'Db0', 'D0', 'Eb0', 'E0', 'F0', 'Gb0', 'G0', 'Ab0', 'A0', 'Bb0', 'B0', 'C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2', 'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6', 'Eb6', 'E6', 'F6', 'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'B6', 'C7', 'Db7', 'D7', 'Eb7', 'E7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'B7', 'C8', 'Db8', 'D8', 'Eb8', 'E8', 'F8', 'Gb8', 'G8', 'Ab8', 'A8', 'Bb8', 'B8', 'C9', 'Db9', 'D9', 'Eb9', 'E9', 'F9', 'Gb9', 'G9', 'Ab9', 'A9', 'Bb9', 'B9'];

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

function createNoteConversionMap() {
  const map = new Map();

  map.set(abcNoteNames[0], noteNames[0]);
  map.set(`^${abcNoteNames[0]}`, noteNames[1]);
  map.set(`^^${abcNoteNames[0]}`, noteNames[2]);

  let midiValue = 2;

  for (let i = 1; i < abcNoteNames.length - 2; i += 1) {
    map.set(abcNoteNames[i], noteNames[midiValue]);
    map.set(`^${abcNoteNames[i]}`, noteNames[midiValue + 1]);
    map.set(`^^${abcNoteNames[i]}`, noteNames[midiValue + 2]);
    map.set(`_${abcNoteNames[i]}`, noteNames[midiValue - 1]);
    map.set(`__${abcNoteNames[i]}`, noteNames[midiValue - 2]);

    midiValue += incrementBy.get(abcNoteNames[i][0]);
  }

  map.set(abcNoteNames[abcNoteNames.length - 1], noteNames[noteNames.length - 1]);
  map.set(`_${abcNoteNames[abcNoteNames.length - 1]}`, noteNames[noteNames.length - 2]);
  map.set(`__${abcNoteNames[abcNoteNames.length - 1]}`, noteNames[noteNames.length - 3]);

  return map;
}

export const noteConversionMap = createNoteConversionMap();

const melody = [['C', 1], ['D', 2], ['E', 2], ['F', 2], ['G', 2], ['A', 2], ['B', 2], ['c', 1], ['B', 2], ['A', 2], ['G', 2], ['F', 2], ['E', 2], ['D', 2], ['C', 1]];

function deleteChars(string, charsArray) {
  let newString = string;

  charsArray.forEach(elem => {
    newString = newString.replaceAll(elem, '');
  });

  return newString;
}

const charsToDelete = [' ', '|', '=', '(', ')', '-'];

// const abcString = 'd3e ^f2a2|_b2^^g2__e4|';
const abcString = `X:1
K:C
Q:1/4=80
%
d3e ^f2 a2|_b2^^g2 __e4|`;

const noteNameLetters = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'z'];
const prefixes = ['^', '_'];
const suffixes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ','];

function convertABC(string) {
  const array = [];
  let newString = deleteChars(string, charsToDelete);
  newString = newString.replace(/[\r\n]+/gm, '');

  let index = newString.indexOf('%');

  while (index !== -1) {
    newString = newString.substring(index + 1);
    index = newString.indexOf('%');
  }

  while (newString.length > 0) {

    let letterIndex = 0;
    let indexStart = 0;
    let indexEnd = 0;

    console.log(newString, indexStart);

    while (!noteNameLetters.includes(newString[indexStart].toLowerCase())) {
      indexStart += 1;
      letterIndex += 1;
      indexEnd += 1;
      if (typeof newString[indexStart] === 'undefined') {
        return array;
      }
    }

    let e = 1;

    while (prefixes.includes(newString[letterIndex - e])) {
      indexStart -= 1;
      e += 1;
    }

    e = 1;
    while (suffixes.includes(newString[letterIndex + e])) {
      indexEnd += 1;
      e += 1;
    }
    indexEnd = indexEnd > letterIndex ? indexEnd : letterIndex;
    const noteString = newString.substring(0, indexEnd + 1);

    newString = newString.substring(indexEnd + 1);
    array.push(noteString);
  }

  return array;
}

const notesArray = convertABC(abcString);

console.log(notesArray);

function convertNotesArray(arr) {
  const newArr = [];
  arr.forEach(elem => {
    let factor = 1;
    if (suffixes.includes(elem[elem.length - 1])) {
      if (elem[elem.length - 1] !== ',') {
        factor = parseInt(elem[elem.length - 1], 10);
      }
    }
    let subString = elem;
    if (suffixes.includes(subString[subString.length - 1])) {
      subString = elem.substring(0, elem.length - 1);
    }
    newArr.push([subString, factor]);
  });

  return newArr;
}

const melodyArray = convertNotesArray(notesArray);

console.log(melodyArray);

function wait(factor) {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, 300 * factor);
  });
}

async function playNote(melodyArr, i) {
  if (melodyArr[i][0] !== 'z') {
    console.log(noteConversionMap.get(melodyArr[i][0]));
  }
  await wait(melodyArr[i][1]);
}

async function playMelody(melodyArr) {

  for (let i = 0; i < melodyArr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await playNote(melodyArr, i);
  }
}

playMelody(melodyArray);

// Haltebogen funktioniert noch nicht, weil minus rausgefiltert wird.
