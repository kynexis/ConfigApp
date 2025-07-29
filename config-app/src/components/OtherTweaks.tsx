import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigNumberInput from './ConfigNumberInput';
import ConfigToggle from './ConfigToggle';

interface OtherTweaksProps {
  ot: {
    enabled: boolean;
    skillExpBuffs?: boolean;
    signalPistolInSpecialSlots?: boolean;
    unexaminedItemsAreBack?: boolean;
    fasterExamineTime?: boolean;
    removeBackpackRestrictions?: boolean;
    removeDiscardLimit?: boolean;
    reshalaAlwaysHasGoldenTT?: boolean;
    biggerAmmoStacks?: { enabled?: boolean; stackMultiplier?: number; botAmmoStackFix?: boolean };
    questChanges?: boolean;
    removeRaidItemLimits?: boolean;
    biggerCurrencyStacks?: boolean;
    currencyStackSizes?: { euros?: number; dollars?: number; gpcoin?: number; roubles?: number };
    smallContainersInSpecialSlots?: boolean;
  };
  originalConfig: { otherTweaks: OtherTweaksProps['ot'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

const fields = [
  { key: 'enabled', label: 'Enable Other Tweaks', type: 'toggle', tooltip: 'Master toggle for all other tweaks.' },
  { key: 'skillExpBuffs', label: 'Skill Exp Buffs', type: 'toggle', tooltip: 'Buffs to skill experience gain.' },
  { key: 'signalPistolInSpecialSlots', label: 'Signal Pistol In Special Slots', type: 'toggle', tooltip: 'Allows signal pistol in special slots.' },
  { key: 'unexaminedItemsAreBack', label: 'Unexamined Items Are Back', type: 'toggle', tooltip: 'Unexamined items are back.' },
  { key: 'fasterExamineTime', label: 'Faster Examine Time', type: 'toggle', tooltip: 'Faster examine time for items.' },
  { key: 'removeBackpackRestrictions', label: 'Remove Backpack Restrictions', type: 'toggle', tooltip: 'Removes backpack restrictions.' },
  { key: 'removeDiscardLimit', label: 'Remove Discard Limit', type: 'toggle', tooltip: 'Removes discard limit.' },
  { key: 'reshalaAlwaysHasGoldenTT', label: 'Reshala Always Has Golden TT', type: 'toggle', tooltip: 'Reshala always has Golden TT.' },
  { key: 'biggerAmmoStacks.enabled', label: 'Bigger Ammo Stacks', type: 'toggle', tooltip: 'Enable bigger ammo stacks.' },
  { key: 'biggerAmmoStacks.stackMultiplier', label: 'Ammo Stack Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Multiplier for ammo stack size.' },
  { key: 'biggerAmmoStacks.botAmmoStackFix', label: 'Bot Ammo Stack Fix', type: 'toggle', tooltip: 'Fixes bot ammo stack issues.' },
  { key: 'questChanges', label: 'Quest Changes', type: 'toggle', tooltip: 'Enable quest changes.' },
  { key: 'removeRaidItemLimits', label: 'Remove Raid Item Limits', type: 'toggle', tooltip: 'Removes raid item limits.' },
  { key: 'biggerCurrencyStacks', label: 'Bigger Currency Stacks', type: 'toggle', tooltip: 'Enable bigger currency stacks.' },
  { key: 'currencyStackSizes.euros', label: 'Euros Stack Size', type: 'number', min: 1, max: 1000000, step: 1, tooltip: 'Maximum stack size for euros.' },
  { key: 'currencyStackSizes.dollars', label: 'Dollars Stack Size', type: 'number', min: 1, max: 1000000, step: 1, tooltip: 'Maximum stack size for dollars.' },
  { key: 'currencyStackSizes.gpcoin', label: 'GP Coin Stack Size', type: 'number', min: 1, max: 1000000, step: 1, tooltip: 'Maximum stack size for GP coins.' },
  { key: 'currencyStackSizes.roubles', label: 'Roubles Stack Size', type: 'number', min: 1, max: 1000000, step: 1, tooltip: 'Maximum stack size for roubles.' },
  { key: 'smallContainersInSpecialSlots', label: 'Small Containers In Special Slots', type: 'toggle', tooltip: 'Allow small containers in special slots.' },
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

const OtherTweaks: React.FC<OtherTweaksProps> = ({ ot, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.otherTweaks, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).otherTweaks, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).otherTweaks, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(ot, field.key) !== getValue(original, field.key));
  }, [ot, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Other Tweaks</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).otherTweaks = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(ot, field.key);
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

export default OtherTweaks;
