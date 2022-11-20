import PropTypes from 'prop-types';
import midiPlayerNs from 'midi-player-js';
import React, { useEffect, useState, useRef } from 'react';

export default function PianoComponent(props) {

  const { noteRange, sampler, samplerHasLoaded } = props;
  const defaultKeyWidth = 30;
  const pianoContainer = useRef(null);
  const pianoWrapperWidth = useRef(null);
  const prevContainerWidth = useRef(null);
  const { NOTES } = midiPlayerNs.Constants;
  const [pianoWrapperDimensions, setPianoWrapperDimensions] = useState({});

  const numberOfKeysRendered = noteRange.last - noteRange.first + 1;

  const getNoteNameFromMidiValue = midiValue => {
    return NOTES[midiValue];
  };

  const getPianoWrapperDimensions = clientWidth => {
    let width;
    let height;
    if (numberOfKeysRendered > 39) {
      width = clientWidth;
      const keyWidth = clientWidth / numberOfKeysRendered;
      height = keyWidth * 5.5;
      pianoWrapperWidth.current = width;
      return { width: `${width}px`, height: `${height}px` };
    }
    const neededWidth = numberOfKeysRendered * defaultKeyWidth;
    if (neededWidth > clientWidth) {
      width = clientWidth;
      const keyWidth = clientWidth / numberOfKeysRendered;
      height = keyWidth * 5.5;
    } else {
      height = 160;
      width = numberOfKeysRendered * defaultKeyWidth;
    }
    pianoWrapperWidth.current = width;
    return { width: `${width}px`, height: `${height}px` };
  };

  const handleWindowResize = () => {
    const neededWidth = numberOfKeysRendered * defaultKeyWidth;
    if (pianoContainer.current.clientWidth === prevContainerWidth.current) {
      return;
    }
    if (pianoContainer.current.clientWidth < prevContainerWidth.current && pianoContainer.current.clientWidth > pianoWrapperWidth.current) {
      return;
    }
    if (pianoContainer.current.clientWidth > prevContainerWidth.current && neededWidth < pianoContainer.current.clientWidth) {
      return;
    }
    const obj = getPianoWrapperDimensions(pianoContainer.current.clientWidth);
    setPianoWrapperDimensions(obj);
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

  useEffect(() => {
    if (pianoContainer.current.clientWidth === prevContainerWidth.current) {
      return;
    }
    prevContainerWidth.current = pianoContainer.current.clientWidth;
    const obj = getPianoWrapperDimensions(pianoContainer.current.clientWidth);
    setPianoWrapperDimensions(obj);
  });

  useEffect(() => {

    window.addEventListener('resize', handleWindowResize);
    return function cleanUp() {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return (
    <div ref={pianoContainer} className="MidiPiano-pianoContainer">
      <div className="MidiPiano-pianoWrapper" style={{ width: pianoWrapperDimensions.width || '100%', height: pianoWrapperDimensions.height || '160px' }}>
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
        <div className="MidiPiano-key MidiPiano-keyBlack" />
        <div className="MidiPiano-key MidiPiano-keyWhite" />
      </div>
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
