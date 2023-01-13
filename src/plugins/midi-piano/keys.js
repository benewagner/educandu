import React from 'react';
import PropTypes from 'prop-types';

export function KeyWhite({ midiValue, colors, index, updateKeyRangeSelection, indicationMidiValue }) {

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={indicationMidiValue === midiValue ? { backgroundColor: colors.activeKey } : null}
      />
  );
}

export function KeyWhiteWithBlack({ midiValue, colors, index, updateKeyRangeSelection, indicationMidiValue }) {

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={indicationMidiValue === midiValue ? { backgroundColor: colors.activeKey } : null}
      >
      <div
        className="MidiPiano-key MidiPiano-keyBlack"
        data-midi-value={midiValue + 1}
        data-default-color={colors.blackKey}
        style={indicationMidiValue === midiValue + 1 ? { backgroundColor: colors.activeKey } : null}
        />
    </div>
  );
}

const keyProps = {
  colors: PropTypes.object.isRequired,
  indicationMidiValue: PropTypes.number,
  midiValue: PropTypes.number,
  updateKeyRangeSelection: PropTypes.func
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhite.defaultProps = {
  indicationMidiValue: null,
  midiValue: null,
  updateKeyRangeSelection: () => {}
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.defaultProps = {
  indicationMidiValue: null,
  midiValue: null,
  updateKeyRangeSelection: null
};
