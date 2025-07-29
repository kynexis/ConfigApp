import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigToggle from './ConfigToggle';
import ConfigNumberInput from './ConfigNumberInput';
import type { Config } from '../types/config';
import '../AppStyles.css';

interface TraderChangesProps {
  tc: Config['traderChanges'];
  originalConfig: { traderChanges: Config['traderChanges'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

// Field definitions for rendering, with tooltips from config.json5 comments
const fields = [
  { key: 'enabled', label: 'Enable Trader Changes', type: 'toggle', tooltip: 'Master toggle for all trader changes' },
  { key: 'betterSalesToTraders', label: 'Better Sales To Traders', type: 'toggle', tooltip: 'Traders buy more items for better prices' },
  { key: 'alternativeCategories', label: 'Alternative Categories', type: 'toggle', tooltip: 'Traders have alternative buy categories' },
  { key: 'pacifistFence.enabled', label: 'Pacifist Fence', type: 'toggle', tooltip: 'Enable Pacifist Fence settings' },
  { key: 'pacifistFence.numberOfFenceOffers', label: 'Number Of Fence Offers', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Number of Fence offers' },
  { key: 'reasonablyPricedCases', label: 'Reasonably Priced Cases', type: 'toggle', tooltip: 'Reasonably priced cases' },
  { key: 'skierUsesEuros', label: 'Skier Uses Euros', type: 'toggle', tooltip: 'Skier uses Euros' },
  { key: 'biggerLimits.enabled', label: 'Bigger Trader Limits', type: 'toggle', tooltip: 'Bigger buy/sell limits for traders' },
  { key: 'biggerLimits.multiplier', label: 'Trader Limit Multiplier', type: 'number', min: 1, max: 10, step: 1, tooltip: 'Multiplier for trader buy/sell limits' },
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

const TraderChanges: React.FC<TraderChangesProps> = ({ tc, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.traderChanges, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).traderChanges, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).traderChanges, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  // Section reset enabled if any field is changed
  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(tc, field.key) !== getValue(original, field.key));
  }, [tc, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Trader Changes</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).traderChanges = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(tc, field.key);
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

export default TraderChanges;
