import PropTypes from 'prop-types';
import { Piano } from 'react-piano';
import React, { useEffect, useState, useRef } from 'react';

export default function PianoComponent(props) {

  const defaultKeyWidth = 29.2;
  const pianoContainer = useRef(null);
  const pianoWrapperWidth = useRef(null);
  const prevContainerWidth = useRef(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [canRenderPiano, setCanRenderPiano] = useState(false);
  const { noteRange, playNote, stopNote, updateActiveNotesRef } = props;
  const [pianoWrapperDimensions, setPianoWrapperDimensions] = useState({});

  const numberOfKeysRendered = noteRange.last - noteRange.first + 1;

  const updateActiveNotes = (eventType, midiValue) => {
    switch (eventType) {
      case 'Note on':
        setActiveNotes(prev => {
          const array = [...prev, midiValue];
          return array;
        });
        break;
      case 'Note off':
        setActiveNotes(prev => {
          const array = [...prev];
          array.splice(array.indexOf(midiValue), 1);
          return array;
        });
        break;
      case 'Pause from button':
        setActiveNotes([]);
        break;
      case 'Stop from button':
        setActiveNotes([]);
        break;
      default:
        break;
    }
  };

  if (!updateActiveNotesRef.current) {
    updateActiveNotesRef.current = updateActiveNotes;
  }

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

  useEffect(() => {
    if (pianoContainer.current.clientWidth === prevContainerWidth.current) {
      return;
    }
    prevContainerWidth.current = pianoContainer.current.clientWidth;
    const obj = getPianoWrapperDimensions(pianoContainer.current.clientWidth);
    setCanRenderPiano(true);
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
        {canRenderPiano
        && (<Piano
          noteRange={noteRange}
          playNote={playNote}
          stopNote={stopNote}
          activeNotes={activeNotes}
          />)}
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  noteRange: PropTypes.object.isRequired,
  playNote: PropTypes.func.isRequired,
  stopNote: PropTypes.func.isRequired,
  updateActiveNotesRef: PropTypes.object
};

PianoComponent.defaultProps = {
  updateActiveNotesRef: {}
};
