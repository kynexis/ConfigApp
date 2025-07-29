import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigNumberInput from './ConfigNumberInput';
import ConfigToggle from './ConfigToggle';

interface InsuranceChangesProps {
  ic: {
    enabled: boolean;
    traderInsuranceConfig?: {
      fence?: { insurancePriceCoef?: number; returnChancePercent?: number };
      prapor?: { insurancePriceCoef?: number; returnChancePercent?: number };
      therapist?: { insurancePriceCoef?: number; returnChancePercent?: number };
    };
  };
  originalConfig: { insuranceChanges: InsuranceChangesProps['ic'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

const fields = [
  { key: 'enabled', label: 'Enable Insurance Changes', type: 'toggle', tooltip: 'Master toggle for all insurance changes.' },
  { key: 'traderInsuranceConfig.fence.insurancePriceCoef', label: 'Fence Insurance Price Coef', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Price coefficient for Fence insurance.' },
  { key: 'traderInsuranceConfig.fence.returnChancePercent', label: 'Fence Return Chance (%)', type: 'number', min: 0, max: 100, step: 1, tooltip: 'Chance (percent) to get items back from Fence insurance.' },
  { key: 'traderInsuranceConfig.prapor.insurancePriceCoef', label: 'Prapor Insurance Price Coef', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Price coefficient for Prapor insurance.' },
  { key: 'traderInsuranceConfig.prapor.returnChancePercent', label: 'Prapor Return Chance (%)', type: 'number', min: 0, max: 100, step: 1, tooltip: 'Chance (percent) to get items back from Prapor insurance.' },
  { key: 'traderInsuranceConfig.therapist.insurancePriceCoef', label: 'Therapist Insurance Price Coef', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Price coefficient for Therapist insurance.' },
  { key: 'traderInsuranceConfig.therapist.returnChancePercent', label: 'Therapist Return Chance (%)', type: 'number', min: 0, max: 100, step: 1, tooltip: 'Chance (percent) to get items back from Therapist insurance.' },
];

function getValue(obj: unknown, path: string) {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}
function setValue(obj: unknown, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const ref = keys.reduce<Record<string, unknown>>((o, k) => {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
    return o[k] as Record<string, unknown>;
  }, obj as Record<string, unknown>);
  (ref as Record<string, unknown>)[last] = value;
}
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const InsuranceChanges: React.FC<InsuranceChangesProps> = ({ ic, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.insuranceChanges, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).insuranceChanges, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).insuranceChanges, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(ic, field.key) !== getValue(original, field.key));
  }, [ic, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Insurance Changes</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: any) => {
              const next = deepClone(prev);
              next.insuranceChanges = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(ic, field.key);
          const origValue = getValue(original, field.key);
          const changed = value !== origValue;
          return (
            <React.Fragment key={field.key}>
              <div className="config-label" style={{ justifySelf: 'start' }} title={field.tooltip}>{field.label}</div>
              <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 140 }}>
                {field.type === 'toggle' ? (
                  <ConfigToggle
                    checked={!!value}
                    onChange={v => handleChange(field.key, v)}
                    onReset={() => handleUndo(field.key)}
                    resetEnabled={changed}
                    label=""
                    tooltip={field.tooltip}
                  />
                ) : (
                  <ConfigNumberInput
                    value={typeof value === 'number' ? value : ''}
                    onChange={v => handleChange(field.key, v)}
                    onBlur={() => {}}
                    onKeyDown={() => {}}
                    onReset={() => handleUndo(field.key)}
                    resetEnabled={changed}
                    label=""
                    tooltip={field.tooltip}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default InsuranceChanges;
