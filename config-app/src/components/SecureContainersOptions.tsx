import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigNumberInput from './ConfigNumberInput';
import ConfigToggle from './ConfigToggle';

interface SecureContainersOptionsProps {
  sco: {
    enabled: boolean;
    biggerContainers?: boolean;
    CollectorQuestLevelStart?: number;
    progressiveContainers?: {
      enabled?: boolean;
    };
  };
  originalConfig: { secureContainersOptions: SecureContainersOptionsProps['sco'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

const fields = [
  { key: 'enabled', label: 'Enable Secure Container Tweaks', type: 'toggle', tooltip: 'Master toggle for all secure container options.' },
  { key: 'biggerContainers', label: 'Bigger Containers', type: 'toggle', tooltip: 'Waist Pouch is 2x4, Alpha is now 3x3 (like EoD), Beta 3x4, Epsilon 3x5, Gamma 4x5, Kappa 5x5.' },
  { key: 'CollectorQuestLevelStart', label: 'Collector Quest Level Start', type: 'number', min: 1, max: 99, step: 1, tooltip: 'Collector quest is startable at this level.' },
  { key: 'progressiveContainers.enabled', label: 'Progressive Containers', type: 'toggle', tooltip: 'Start new profile with just a Waist Pouch 2x2 container, and work up to Gamma with custom crafts.' },
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

const SecureContainersOptions: React.FC<SecureContainersOptionsProps> = ({ sco, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.secureContainersOptions, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).secureContainersOptions, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).secureContainersOptions, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(sco, field.key) !== getValue(original, field.key));
  }, [sco, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Secure Containers</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).secureContainersOptions = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(sco, field.key);
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

export default SecureContainersOptions;
