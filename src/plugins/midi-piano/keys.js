import React from 'react';
import PropTypes from 'prop-types';

export function KeyWhite({ midiValue, midiValueSequence, colors, index, updateKeyRangeSelection, canShowSolution }) {

  // const indicationMidiValue = midiValueSequence[0];

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      // style={indicationMidiValue === midiValue ? { backgroundColor: colors.activeKey } : null}
      />
  );
}

export function KeyWhiteWithBlack({ midiValue, midiValueSequence, colors, index, updateKeyRangeSelection, canShowSolution }) {

  // const indicationMidiValue = midiValueSequence[0];

  const color = 123;

  const style = {

  };

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      // style={indicationMidiValue === midiValue ? { backgroundColor: colors.activeKey } : null}
      >
      <div
        className="MidiPiano-key MidiPiano-keyBlack"
        data-midi-value={midiValue + 1}
        data-default-color={colors.blackKey}
        // style={indicationMidiValue === midiValue + 1 ? { backgroundColor: colors.activeKey } : null}
        />
    </div>
  );
}

const keyProps = {
  canShowSolution: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  midiValue: PropTypes.number,
  midiValueSequence: PropTypes.number,
  updateKeyRangeSelection: PropTypes.func
};

const defaultKeyProps = {
  canShowSolution: false,
  midiValue: null,
  midiValueSequence: null,
  updateKeyRangeSelection: () => {}
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhite.defaultKeyProps = {
  ...defaultKeyProps
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.defaultKeyProps = {
  ...defaultKeyProps
};
