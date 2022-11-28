import React from 'react';
import PropTypes from 'prop-types';
import KeyWhite from './keyWhite.js';
import midiPlayerNs from 'midi-player-js';
import KeyWhiteWithBlack from './keyWhiteWithBlack.js';

export default function PianoComponent(props) {

  const { NOTES } = midiPlayerNs.Constants;
  const { noteRange, sampler, samplerHasLoaded } = props;
  const numberOfKeys = noteRange.last - noteRange.first;

  const pianoLayout = [
    0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,
    0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1
  ];

  const getNoteNameFromMidiValue = midiValue => {
    return NOTES[midiValue];
  };

  const playNote = midiValue => {
    if (!samplerHasLoaded) {
      return;
    }
    sampler.current.triggerAttack(getNoteNameFromMidiValue(midiValue));
  };

  const stopNote = midiValue => {
    setTimeout(() => {
      sampler.current.triggerRelease(getNoteNameFromMidiValue(midiValue));
    }, 200);
  };

  // const numberArr = () => {
  //   const arr = [];
  //   let counter = 0;
  //   for (let i = noteRange.first; i < numberOfKeys; i += 1) {
  //     if (i % 3 === 0 || i % 3 === 1) {
  //       arr.push(0);
  //     } else {
  //       switch (counter) {
  //         case 0:
  //           arr.push(1);
  //           counter = 1;
  //           break;
  //         case 1:
  //           arr.push(0);
  //           counter = 0;
  //           break;
  //         default:
  //           throw Error;
  //       }
  //     }
  //   }
  //   return arr;
  // };

  // const scheisse = pianoLayout.slice(noteRange.first - 21, noteRange.last - 21);
  const scheisse = pianoLayout;

  return (
    <div className="MidiPiano-pianoContainer">
      {scheisse.map((elem, index) => {
        if (elem === 0) {
          return <KeyWhiteWithBlack key={index} />;
        }
        return <KeyWhite key={index} />;
      })}
      <KeyWhite key={999} />
    </div>
  );
}

PianoComponent.propTypes = {
  noteRange: PropTypes.object.isRequired,
  sampler: PropTypes.object,
  samplerHasLoaded: PropTypes.bool.isRequired
};

PianoComponent.defaultProps = {
  sampler: {}
};
