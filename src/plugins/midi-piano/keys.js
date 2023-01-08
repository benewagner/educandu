import React from 'react';
import PropTypes from 'prop-types';

export function KeyWhite({ midiValue, colors, index, updateKeyRangeSelection }) {
  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      />
  );
}

export function KeyWhiteWithBlack({ midiValue, colors, index, updateKeyRangeSelection }) {
  return (
    <div className="MidiPiano-key MidiPiano-keyWhite" onClick={updateKeyRangeSelection} data-midi-value={midiValue} data-default-color={colors.whiteKey} data-index={index} >
      <div className="MidiPiano-key MidiPiano-keyBlack" data-midi-value={midiValue + 1} data-default-color={colors.blackKey} />
    </div>
  );
}

const keyProps = {
  colors: PropTypes.object.isRequired,
  midiValue: PropTypes.number,
  updateKeyRangeSelection: PropTypes.func
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhite.defaultProps = {
  midiValue: null,
  updateKeyRangeSelection: () => {}
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.defaultProps = {
  midiValue: null,
  updateKeyRangeSelection: null
};
