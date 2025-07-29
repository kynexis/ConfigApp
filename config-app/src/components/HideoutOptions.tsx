
import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigToggle from './ConfigToggle';
import ConfigNumberInput from './ConfigNumberInput';
import type { HideoutOptions } from '../types/config';
import '../AppStyles.css';

interface HideoutOptionsProps {
  ho: HideoutOptions;
  originalConfig: { hideoutOptions: HideoutOptions };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

// Field definitions for rendering, with tooltips from config.json5 comments
const fields = [
  { key: 'fasterBitcoinFarming.enabled', label: 'Faster Bitcoin Farming', type: 'toggle', tooltip: 'Enable/disable faster bitcoin farming' },
  { key: 'fasterBitcoinFarming.bitcoinPrice', label: 'Bitcoin Price', type: 'number', min: 0, max: 10000000, step: 1000, tooltip: 'Set the price of bitcoin in the handbook. Default is 100000. Set to null or remove to not change price.' },
  { key: 'fasterBitcoinFarming.baseBitcoinTimeMultiplier', label: 'Bitcoin Time Multiplier', type: 'number', min: 1, max: 1000, step: 1, tooltip: 'Base bitcoin production time multiplier (higher = faster)' },
  { key: 'fasterBitcoinFarming.gpuEfficiency', label: 'GPU Efficiency', type: 'number', min: 1, max: 100, step: 1, tooltip: 'GPU efficiency for bitcoin farm' },
  { key: 'fasterCraftingTime.enabled', label: 'Faster Crafting Time', type: 'toggle', tooltip: 'Enable/disable faster crafting time for all crafts except bitcoin, moonshine, and purified water' },
  { key: 'fasterCraftingTime.baseCraftingTimeMultiplier', label: 'Crafting Time Multiplier', type: 'number', min: 1, max: 1000, step: 1, tooltip: 'Base crafting time multiplier for most crafts (higher = faster)' },
  { key: 'fasterCraftingTime.hideoutSkillExpFix.enabled', label: 'Hideout Skill Exp Fix', type: 'toggle', tooltip: 'Enable/disable hideout skill exp fix for crafting' },
  { key: 'fasterCraftingTime.hideoutSkillExpFix.hideoutSkillExpMultiplier', label: 'Hideout Skill Exp Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Multiplier for hideout skill exp gain from crafting' },
  { key: 'fasterCraftingTime.fasterMoonshineProduction.enabled', label: 'Faster Moonshine Production', type: 'toggle', tooltip: 'Enable/disable faster moonshine production' },
  { key: 'fasterCraftingTime.fasterMoonshineProduction.baseCraftingTimeMultiplier', label: 'Moonshine Time Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Base crafting time multiplier for moonshine (higher = faster)' },
  { key: 'fasterCraftingTime.fasterPurifiedWaterProduction.enabled', label: 'Faster Purified Water', type: 'toggle', tooltip: 'Enable/disable faster purified water production' },
  { key: 'fasterCraftingTime.fasterPurifiedWaterProduction.baseCraftingTimeMultiplier', label: 'Purified Water Time Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Base crafting time multiplier for purified water (higher = faster)' },
  { key: 'fasterCraftingTime.fasterCultistCircle.enabled', label: 'Faster Cultist Circle', type: 'toggle', tooltip: 'Enable/disable faster cultist circle production' },
  { key: 'fasterCraftingTime.fasterCultistCircle.baseCraftingTimeMultiplier', label: 'Cultist Circle Time Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Base crafting time multiplier for cultist circle (higher = faster)' },
  { key: 'hideoutContainers.enabled', label: 'Hideout Containers', type: 'toggle', tooltip: 'Enable/disable hideout containers tweaks' },
  { key: 'hideoutContainers.biggerHideoutContainers', label: 'Bigger Hideout Containers', type: 'toggle', tooltip: 'Slightly buffs basic hideout containers: Medicine case 7x7 -> 10x10, Holodilnick 8x8 -> 10x10, Magazine case 7x7 -> 7x10, Item case 8x8 -> 10x10, Weapon case 5x10 -> 6x10, Keytool -> 5x5' },
  { key: 'hideoutContainers.siccCaseBuff', label: 'SICC Case Buff', type: 'toggle', tooltip: 'Huge QoL buff to SICC case to make it actually not bad and a direct upgrade to Docs. Allows it to hold keytools and more.' },
  { key: 'fuelConsumption.enabled', label: 'Fuel Consumption', type: 'toggle', tooltip: 'Enable/disable fuel consumption tweaks' },
  { key: 'fuelConsumption.fuelConsumptionMultiplier', label: 'Fuel Consumption Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Fuel consumption multiplier (higher = more fuel used)' },
  { key: 'fasterHideoutConstruction.enabled', label: 'Faster Hideout Construction', type: 'toggle', tooltip: 'Enable/disable faster hideout construction' },
  { key: 'fasterHideoutConstruction.hideoutConstructionTimeMultiplier', label: 'Construction Time Multiplier', type: 'number', min: 1, max: 1000, step: 1, tooltip: 'Construction time multiplier (higher = faster construction)' },
  { key: 'scavCaseOptions.enabled', label: 'Scav Case Options', type: 'toggle', tooltip: 'Enable/disable scav case options' },
  { key: 'scavCaseOptions.betterRewards', label: 'Better Scav Rewards', type: 'toggle', tooltip: 'Improves the quality of scav case rewards' },
  { key: 'scavCaseOptions.rebalance', label: 'Rebalance Scav Case', type: 'toggle', tooltip: 'Rebalances the scav case reward pool and recipes' },
  { key: 'scavCaseOptions.fasterScavcase.enabled', label: 'Faster Scavcase', type: 'toggle', tooltip: 'Enable/disable faster scavcase production' },
  { key: 'scavCaseOptions.fasterScavcase.speedMultiplier', label: 'Scavcase Speed Multiplier', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Speed multiplier for scavcase production' },
  { key: 'allowGymTrainingWithMusclePain', label: 'Allow Gym Training With Muscle Pain', type: 'toggle', tooltip: 'Allows to continue gym training with severe muscle pain at 25% efficiency.' },
  { key: 'disableFIRHideout', label: 'Disable FIR Hideout', type: 'toggle', tooltip: 'Disables Found In Raid requirement for hideout upgrades' },
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


const HideoutOptions: React.FC<HideoutOptionsProps> = ({ ho, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.hideoutOptions, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).hideoutOptions, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).hideoutOptions, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  // Section reset enabled if any field is changed
  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(ho, field.key) !== getValue(original, field.key));
  }, [ho, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Hideout Options</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).hideoutOptions = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(ho, field.key);
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

export default HideoutOptions;
