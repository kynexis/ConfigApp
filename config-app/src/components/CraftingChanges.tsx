import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigToggle from './ConfigToggle';
import '../AppStyles.css';
import type { Config } from '../types/config';

interface CraftingChangesProps {
  cc: Config['craftingChanges'];
  originalConfig: { craftingChanges: Config['craftingChanges'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

// Field definitions for rendering, with tooltips from config.json5 comments
const fields = [
  { key: 'enabled', label: 'Enable Crafting Changes', type: 'toggle', tooltip: 'Major rebalance of crafting recipes balanced around components rarities, usefulness, trader prices and plain "lore" logic. Some nerfs, but a lot of huge buffs. Main idea was to make most of the crafts useful and/or profitable.' },
  { key: 'craftingRebalance', label: 'Crafting Rebalance', type: 'toggle', tooltip: 'Enable/disable crafting rebalance.' },
  { key: 'additionalCraftingRecipes', label: 'Additional Crafting Recipes', type: 'toggle', tooltip: 'New custom lore-friendly and balanced crafting recipes added for 3-b-TG, Adrenaline, L1, AHF1, CALOK, Ophthalmoscope, Zagustin, Obdolbos, OLOLO.' },
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

const CraftingChanges: React.FC<CraftingChangesProps> = ({ cc, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.craftingChanges, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).craftingChanges, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).craftingChanges, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  // Section reset enabled if any field is changed
  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(cc, field.key) !== getValue(original, field.key));
  }, [cc, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Crafting Changes</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).craftingChanges = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(cc, field.key);
          const origValue = getValue(original, field.key);
          const changed = value !== origValue;
          return (
            <React.Fragment key={field.key}>
              <div className="config-label" style={{ justifySelf: 'start' }} title={field.tooltip}>{field.label}</div>
              <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 140 }}>
                <ConfigToggle
                  checked={!!value}
                  onChange={v => handleChange(field.key, v)}
                  onReset={() => handleUndo(field.key)}
                  resetEnabled={changed}
                  label=""
                  tooltip={field.tooltip}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CraftingChanges;
