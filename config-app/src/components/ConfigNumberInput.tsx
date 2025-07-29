import React from 'react';

interface ConfigNumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onReset: () => void;
  resetEnabled: boolean;
  label: string;
  tooltip?: string;
}

const ConfigNumberInput: React.FC<ConfigNumberInputProps> = ({ value, onChange, onBlur, onKeyDown, onReset, resetEnabled, label, tooltip }) => (
  <>
    <span className="config-label" title={tooltip}>{label}</span>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <input
        type="number"
        value={value}
        className="config-input"
        min={0}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <button
        className="field-undo-btn"
        title="Reset to original"
        disabled={!resetEnabled}
        style={{ opacity: resetEnabled ? 1 : 0.25 }}
        onClick={onReset}
      >↺</button>
    </div>
  </>
);

export default ConfigNumberInput;
