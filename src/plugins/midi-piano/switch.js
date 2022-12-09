import PropTypes from 'prop-types';
import React, { useRef } from 'react';

export default function CustomSwitch({ handleSwitchClick, pianoId }) {

  const inputSwitch = useRef(null);

  const onClick = () => {
    inputSwitch.current.classList.toggle('MidiPiano-SwitchChecked');
    handleSwitchClick(inputSwitch.current.classList.contains('MidiPiano-SwitchChecked'));
  };

  return (
    <div ref={inputSwitch} className={`${pianoId} MidiPiano-Switch`} onClick={onClick} >
      <div className="MidiPiano-SwitchHandle" />
    </div>
  );
}

CustomSwitch.propTypes = {
  handleSwitchClick: PropTypes.func.isRequired,
  pianoId: PropTypes.string.isRequired
};
