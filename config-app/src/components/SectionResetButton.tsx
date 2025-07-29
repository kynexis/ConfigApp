import React from 'react';

interface SectionResetButtonProps {
  onReset: () => void;
  enabled: boolean;
}

const SectionResetButton: React.FC<SectionResetButtonProps> = ({ onReset, enabled }) => (
  <div className="hideout-section-reset">
    <span className={`hideout-section-reset-label${enabled ? '' : ' disabled'}`}>Reset</span>
    <button
      className="hideout-section-reset-btn"
      title="Reset all options to original values"
      disabled={!enabled}
      onClick={onReset}
    >↺</button>
  </div>
);

export default SectionResetButton;
