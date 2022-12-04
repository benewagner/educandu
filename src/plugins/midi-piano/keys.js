import React from 'react';
import PropTypes from 'prop-types';

export function KeyWhite({ midiValue }) {

  const number = 50;

  return (
    <div className="MidiPiano-key MidiPiano-keyWhite" data-midi-value={midiValue} />
  );
}

export function KeyWhiteWithBlack({ midiValue }) {
  return (
    <div className="MidiPiano-key MidiPiano-keyWhite" data-midi-value={midiValue} >
      <div className="MidiPiano-key MidiPiano-keyBlack" data-midi-value={midiValue + 1} />
    </div>
  );
}

const keyProps = {
  midiValue: PropTypes.number.isRequired
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};
