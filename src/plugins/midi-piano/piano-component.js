import PropTypes from 'prop-types';
import midiPlayerNs from 'midi-player-js';
import React, { useEffect, useState } from 'react';
import { KeyWhite, KeyWhiteWithBlack } from './keys.js';
import { create as createId } from '../../utils/unique-id.js';

export default function PianoComponent(props) {

  // 0 represents white and black key, 1 respresents white key. Second element is midiValue for white key.
  const pianoLayout = [
    [0, 21], [1, 23], [0, 24], [0, 26], [1, 28], [0, 29], [0, 31], [0, 33], [1, 35], [0, 36], [0, 38], [1, 40], [0, 41], [0, 43], [0, 45], [1, 47], [0, 48],
    [0, 50], [1, 52], [0, 53], [0, 55], [0, 57], [1, 59], [0, 60], [0, 62], [1, 64], [0, 65], [0, 67], [0, 69], [1, 71], [0, 72], [0, 74], [1, 76], [0, 77],
    [0, 79], [0, 81], [1, 83], [0, 84], [0, 86], [1, 88], [0, 89], [0, 91], [0, 93], [1, 95], [0, 96], [0], 98, [1, 100], [0, 101], [0, 103], [0, 105],
    [1, 107], [1, 108]
  ];

  const { NOTES } = midiPlayerNs.Constants;
  const [pianoId, setPianoId] = useState('defaultPianoId');
  const { noteRange, sampler, samplerHasLoaded, colors } = props;
  const keyRangeLayout = pianoLayout.slice(noteRange.first, noteRange.last);

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
    }, 150);
  };

  const handleMouseEnter = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    e.target.style.backgroundColor = colors.activeKey;
  };

  const handleMouseLeave = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    e.target.style.backgroundColor = e.target.classList.contains('MidiPiano-keyWhite') ? colors.white : colors.blackKey;
  };

  const handleMouseDown = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    e.preventDefault;
    playNote(parseInt(e.target.dataset.midiValue, 10));
  };

  const handleMouseUp = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    e.preventDefault;
    stopNote(parseInt(e.target.dataset.midiValue, 10));
  };

  const isNumberCharacter = char => {
    const numberChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (numberChars.includes(char)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    let id = '';
    // Id as a CSS selector must not start with a number
    do {
      id = createId();
    } while (isNumberCharacter(id[0]));
    setPianoId(id);
  }, []);

  useEffect(() => {
    if (pianoId === 'defaultPianoId' || !samplerHasLoaded) {
      return;
    }
    const piano = document.querySelector(`#${pianoId}`);
    piano.addEventListener('mousedown', e => {
      handleMouseDown(e);
    });
    piano.addEventListener('mouseup', e => {
      handleMouseUp(e);
    });
  }, [pianoId, samplerHasLoaded]);

  return (
    <div id={pianoId} className="MidiPiano-pianoContainer">
      {keyRangeLayout.map((elem, index) => {
        if (elem[0] === 0 && index < keyRangeLayout.length - 1) {
          return <KeyWhiteWithBlack key={createId()} midiValue={elem[1]} />;
        }
        return <KeyWhite key={createId()} midiValue={elem[1]} />;
      })}
    </div>
  );
}

PianoComponent.propTypes = {
  colors: PropTypes.object.isRequired,
  noteRange: PropTypes.object.isRequired,
  sampler: PropTypes.object,
  samplerHasLoaded: PropTypes.bool.isRequired
};

PianoComponent.defaultProps = {
  sampler: {}
};
