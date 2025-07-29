import React from 'react';

interface ConfigToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onReset: () => void;
  resetEnabled: boolean;
  label: string;
  tooltip?: string;
}

const ConfigToggle: React.FC<ConfigToggleProps> = ({ checked, onChange, onReset, resetEnabled, label, tooltip }) => (
  <>
    <span className="config-label" title={tooltip}>{label}</span>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="slider"></span>
      </label>
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

export default ConfigToggle;
