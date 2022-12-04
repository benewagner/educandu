import React from 'react';
import PropTypes from 'prop-types';

export function KeyWhite({ midiValue, colors }) {

  return (
    <div className="MidiPiano-key MidiPiano-keyWhite" data-midi-value={midiValue} data-default-color={colors.whiteKey} />
  );
}

export function KeyWhiteWithBlack({ midiValue, colors }) {
  return (
    <div className="MidiPiano-key MidiPiano-keyWhite" data-midi-value={midiValue} data-default-color={colors.whiteKey} >
      <div className="MidiPiano-key MidiPiano-keyBlack" data-midi-value={midiValue + 1} data-default-color={colors.blackKey} />
    </div>
  );
}

const keyProps = {
  colors: PropTypes.object.isRequired,
  midiValue: PropTypes.number.isRequired
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};
