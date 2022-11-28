import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import KeyWhite from './keyWhite.js';
import midiPlayerNs from 'midi-player-js';
import KeyWhiteWithBlack from './keyWhiteWithBlack.js';
import { create as createId } from '../../utils/unique-id.js';

export default function PianoComponent(props) {

  const pianoId = createId();
  const [keys, setKeys] = useState(null);
  const { NOTES } = midiPlayerNs.Constants;
  const { noteRange, sampler, samplerHasLoaded } = props;

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

  const keyRangeLayout = pianoLayout.slice(noteRange.first, noteRange.last);

  useEffect(() => {

  });

  return (
    <div id={pianoId} className="MidiPiano-pianoContainer">
      {keyRangeLayout.map(elem => {
        if (elem === 0) {
          return <KeyWhiteWithBlack key={createId()} />;
        }
        return <KeyWhite key={createId()} />;
      })}
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
