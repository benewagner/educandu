import PropTypes from 'prop-types';
import { Button, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const FINE_TUNNING_STEPS_IN_MS = [100, 500, 1000];

function TimecodeFineTunningInput({ value, lowerLimit, upperLimit, roundToLowerLimit, roundToUpperLimit, onValueChange }) {
  const { t } = useTranslation('timecodeFineTunningInput');
  const [isPlusDisabled, setIsPlusDisabled] = useState(false);
  const [isMinusDisabled, setIsMinusDisabled] = useState(false);
  const [fineTunningStep, setFineTuningStep] = useState(FINE_TUNNING_STEPS_IN_MS[0]);

  useEffect(() => {
    if (roundToLowerLimit) {
      setIsMinusDisabled(value === lowerLimit);
    } else {
      const nextMinusValue = value - fineTunningStep;
      setIsMinusDisabled(nextMinusValue < lowerLimit);
    }

    if (roundToUpperLimit) {
      setIsPlusDisabled(value === upperLimit);
    } else {
      const nextPlusValue = value + fineTunningStep;
      setIsPlusDisabled(nextPlusValue > upperLimit);
    }
  }, [value, lowerLimit, upperLimit, roundToLowerLimit, roundToUpperLimit, fineTunningStep]);

  const handlePlusClick = () => {
    let nextValue = value + fineTunningStep;

    if (roundToUpperLimit) {
      nextValue = Math.min(nextValue, upperLimit);
    }

    onValueChange(nextValue);
  };

  const handleMinusClick = () => {
    let nextValue = value - fineTunningStep;

    if (roundToLowerLimit) {
      nextValue = Math.max(nextValue, lowerLimit);
    }

    onValueChange(nextValue);
  };

  const handleFineTunningStepChange = step => {
    setFineTuningStep(step);
  };

  return (
    <div className="TimecodeFineTunningInput">
      <div>{formatMillisecondsAsDuration(value, { millisecondsLength: 3 })}</div>
      <div className="TimecodeFineTunningInput-controls">
        <Button icon={<PlusOutlined />} disabled={isPlusDisabled} onClick={handlePlusClick} />
        <Button icon={<MinusOutlined />} disabled={isMinusDisabled} onClick={handleMinusClick} />
        <Select
          value={fineTunningStep}
          className="TimecodeFineTunningInput-select"
          options={FINE_TUNNING_STEPS_IN_MS.map(step => ({ label: step, value: step }))}
          onChange={handleFineTunningStepChange}
          />
        <span>{t('milliseconds')}</span>
      </div>
    </div>
  );
}

TimecodeFineTunningInput.propTypes = {
  value: PropTypes.number.isRequired,
  lowerLimit: PropTypes.number.isRequired,
  upperLimit: PropTypes.number.isRequired,
  roundToLowerLimit: PropTypes.bool,
  roundToUpperLimit: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired
};

TimecodeFineTunningInput.defaultProps = {
  roundToLowerLimit: false,
  roundToUpperLimit: false
};

export default TimecodeFineTunningInput;
