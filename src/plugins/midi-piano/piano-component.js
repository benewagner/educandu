import PropTypes from 'prop-types';
import midiPlayerNs from 'midi-player-js';
import React, { useEffect, useRef } from 'react';
import { KeyWhite, KeyWhiteWithBlack } from './keys.js';
import { create as createId } from '../../utils/unique-id.js';

export default function PianoComponent(props) {

  // 0 represents white and black key, 1 respresents white key. Second element is midiValue for white key.
  const pianoLayout = [
    [0, 21], [1, 23], [0, 24], [0, 26], [1, 28], [0, 29], [0, 31], [0, 33], [1, 35], [0, 36], [0, 38], [1, 40], [0, 41], [0, 43], [0, 45], [1, 47], [0, 48],
    [0, 50], [1, 52], [0, 53], [0, 55], [0, 57], [1, 59], [0, 60], [0, 62], [1, 64], [0, 65], [0, 67], [0, 69], [1, 71], [0, 72], [0, 74], [1, 76], [0, 77],
    [0, 79], [0, 81], [1, 83], [0, 84], [0, 86], [1, 88], [0, 89], [0, 91], [0, 93], [1, 95], [0, 96], [0, 98], [1, 100], [0, 101], [0, 103], [0, 105],
    [1, 107], [1, 108]
  ];

  const piano = useRef(null);
  const { NOTES } = midiPlayerNs.Constants;
  const { noteRange,
    samplerHasLoaded,
    colors,
    pianoId,
    keys,
    activeNotes,
    updateActiveNotes } = props;
  const keyRangeLayout = pianoLayout.slice(noteRange.first, noteRange.last);

  const getNoteNameFromMidiValue = midiValue => {
    return NOTES[midiValue];
  };

  const isBlackKey = key => {
    if (key.classList.contains('MidiPiano-keyBlack')) {
      return true;
    }
    return false;
  };

  const playNote = midiValue => {
    if (!samplerHasLoaded) {
      return;
    }
    document.toneJsSampler.triggerAttack(getNoteNameFromMidiValue(midiValue));
  };

  const stopNote = midiValue => {
    setTimeout(() => {
      document.toneJsSampler.triggerRelease(getNoteNameFromMidiValue(midiValue));
    }, 150);
  };

  const handleMouseDown = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    const midiValue = parseInt(e.target.dataset.midiValue, 10);
    updateActiveNotes('Note on', midiValue);
    playNote(midiValue);
  };

  const handleMouseUp = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    const midiValue = parseInt(e.target.dataset.midiValue, 10);
    updateActiveNotes('Note off', midiValue);
    stopNote(midiValue);
  };

  const handleMouseOver = e => {
    const key = e.target;
    if (isBlackKey(key)) {
      e.preventDefault();
      const parent = key.parentElement;
      parent.style.backgroundColor = parent.dataset.defaultColor;
      const parentMidiValue = parseInt(parent.dataset.midiValue, 10);
      const index = activeNotes.current.indexOf(parentMidiValue);
      if (index !== -1) {
        updateActiveNotes('Note off', parentMidiValue);
        stopNote(parentMidiValue);
      }
    }
    key.style.backgroundColor = colors.activeKey;
  };

  const handleMouseOut = e => {
    const key = e.target;
    const midiValue = parseInt(key.dataset.midiValue, 10);
    const index = activeNotes.current.indexOf(midiValue);
    key.style.backgroundColor = key.dataset.defaultColor;
    if (index !== -1) {
      activeNotes.current.splice(index, 1);
      updateActiveNotes('Note off', midiValue);
      stopNote(midiValue);
    }
  };

  useEffect(() => {
    if (!samplerHasLoaded) {
      return;
    }
    piano.current.addEventListener('mousedown', handleMouseDown);
    piano.current.addEventListener('mouseup', handleMouseUp);
  }, [samplerHasLoaded]);

  useEffect(() => {
    const keyElems = document.querySelectorAll(`#${pianoId} .MidiPiano-key`);
    for (const key of keyElems) {
      key.addEventListener('mouseover', handleMouseOver);
      key.addEventListener('mouseleave', handleMouseOut);
    }
    keys.current = [];
    for (let i = 0; i < keyElems.length; i += 1) {
      const index = parseInt(keyElems[i].dataset.midiValue, 10);
      keys.current[index] = keyElems[i];
    }
  });

  return (
    <div ref={piano} id={pianoId} className="MidiPiano-pianoContainer">
      {keyRangeLayout.map((elem, index) => {
        if (elem[0] === 0 && index < keyRangeLayout.length - 1) {
          return <KeyWhiteWithBlack key={createId()} midiValue={elem[1]} colors={colors} />;
        }
        return <KeyWhite key={createId()} midiValue={elem[1]} colors={colors} />;
      })}
    </div>
  );
}

PianoComponent.propTypes = {
  activeNotes: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  keys: PropTypes.object.isRequired,
  noteRange: PropTypes.object.isRequired,
  pianoId: PropTypes.string.isRequired,
  samplerHasLoaded: PropTypes.bool.isRequired,
  updateActiveNotes: PropTypes.func.isRequired
};
