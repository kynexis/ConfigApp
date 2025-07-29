import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigToggle from './ConfigToggle';
import ConfigNumberInput from './ConfigNumberInput';
import type { Config } from '../types/config';
import '../AppStyles.css';

interface StashOptionsProps {
  so: Config['stashOptions'];
  originalConfig: { stashOptions: Config['stashOptions'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

// Field definitions for rendering, with tooltips from config.json5 comments
const fields = [
  { key: 'biggerStash', label: 'Bigger Stash', type: 'toggle', tooltip: 'Bigger stash option, from 28/38/48/68 to 50/100/150/200 lines.' },
  { key: 'progressiveStash', label: 'Progressive Stash', type: 'toggle', tooltip: 'Makes every new profile start with LVL1 stash.' },
  { key: 'lessCurrencyForConstruction', label: 'Less Currency For Construction', type: 'toggle', tooltip: 'Reduces ridiculous cash requirements for stage construction by a multiplier (e.g. 0.20 = 20% of original cost).' },
  { key: 'currencyRequirementMultiplier', label: 'Currency Requirement Multiplier', type: 'number', min: 0, max: 1, step: 0.01, tooltip: 'Multiplier for stash construction currency requirements (default 0.20 = 20% of original cost).' },
  { key: 'easierLoyalty', label: 'Easier Loyalty', type: 'toggle', tooltip: 'Reduces loyalty level requirements for stage construction (Prapor, Ragman and Peacekeeper) by 1.' },
];

function getValue(obj: unknown, path: string) {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}
function setValue(obj: unknown, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const ref = keys.reduce((o, k) => {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
    return o[k] as Record<string, unknown>;
  }, obj as Record<string, unknown>);
  ref[last] = value;
}
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const StashOptions: React.FC<StashOptionsProps> = ({ so, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.stashOptions, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).stashOptions, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).stashOptions, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  // Section reset enabled if any field is changed
  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(so, field.key) !== getValue(original, field.key));
  }, [so, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Stash Options</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).stashOptions = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(so, field.key);
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
                  (() => {
                    let numValue: number | '' = '';
                    if (typeof value === 'number') numValue = value;
                    else if (value === null || value === undefined) numValue = '';
                    return (
                      <ConfigNumberInput
                        value={numValue}
                        onChange={v => handleChange(field.key, v)}
                        onBlur={() => {}}
                        onKeyDown={() => {}}
                        onReset={() => handleUndo(field.key)}
                        resetEnabled={changed}
                        label=""
                        tooltip={field.tooltip}
                      />
                    );
                  })()
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StashOptions;
