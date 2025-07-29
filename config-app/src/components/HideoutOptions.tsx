import React, { useState, useEffect } from 'react';
import type { HideoutOptions, Config } from '../types/config';
import { getOriginal, patchValue } from '../utils/configUtils';
import ConfigToggle from './ConfigToggle';
import ConfigNumberInput from './ConfigNumberInput';
import SectionResetButton from './SectionResetButton';
import type { IpcRenderer } from 'electron';

interface HideoutOptionsProps {
  ho: HideoutOptions;
  originalConfig: Config | null;
  filePath: string;
  ipcRenderer: IpcRenderer;
  setConfig: React.Dispatch<React.SetStateAction<Config | null>>;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

const HideoutOptions: React.FC<HideoutOptionsProps> = ({
  ho,
  originalConfig,
  filePath,
  ipcRenderer,
  setConfig,
  setDirty,
  setError,
  saveConfig
}) => {

  // Config field definitions for toggles and number inputs


  // Local state for number fields
  const [localValues, setLocalValues] = useState<Record<string, number | ''>>({
    btcPrice: ho ? (ho.fasterBitcoinFarming.bitcoinPrice ?? '') : '',
    btcTime: ho ? ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier : '',
    gpuEff: ho ? ho.fasterBitcoinFarming.gpuEfficiency : '',
    craftTime: ho ? ho.fasterCraftingTime.baseCraftingTimeMultiplier : '',
  });

  useEffect(() => {
    if (!ho) return;
    setLocalValues({
      btcPrice: ho.fasterBitcoinFarming.bitcoinPrice ?? '',
      btcTime: ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier,
      gpuEff: ho.fasterBitcoinFarming.gpuEfficiency,
      craftTime: ho.fasterCraftingTime.baseCraftingTimeMultiplier,
    });
  }, [ho]);

  // Section dirty check
  const isSectionDirty = () => {
    if (!originalConfig || !ho) return false;
    const orig = originalConfig.hideoutOptions;
    return JSON.stringify(orig) !== JSON.stringify(ho);
  };

  // Section reset
  const resetSection = async () => {
    if (!originalConfig || !filePath || !ipcRenderer) return;
    const result = await ipcRenderer.invoke('patch-config-value', { filePath, path: ['hideoutOptions'], value: originalConfig.hideoutOptions });
    if (!result.success) {
      setError(result.error || 'Failed to reset section');
      return;
    }
    setConfig(prev => ({ ...prev, hideoutOptions: JSON.parse(JSON.stringify(originalConfig.hideoutOptions)) }));
    setDirty(true);
    setError('');
    setTimeout(() => { saveConfig(); }, 0);
  };


  // Generic handlers for number input fields
  const handleNumberInput = (key: string) => (val: number | '') => {
    if (val === '' || Number(val) >= 0) {
      setLocalValues(prev => ({ ...prev, [key]: val }));
      setError('');
    } else {
      setError('Value cannot be negative.');
    }
  };
  const handleNumberBlur = (key: string, path: string[]) => () => {
    patchValue(ipcRenderer, filePath, path, localValues[key], setConfig, setDirty, setError);
  };
  const handleNumberKey = (key: string, path: string[]) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      patchValue(ipcRenderer, filePath, path, localValues[key], setConfig, setDirty, setError);
      (e.target as HTMLInputElement).blur();
      setTimeout(() => { saveConfig(); }, 0);
    }
  };
  const handleNumberReset = (key: string, path: string[]) => () => {
    const orig = getOriginal(originalConfig, path) as number | '';
    setLocalValues(prev => ({ ...prev, [key]: orig }));
    patchValue(ipcRenderer, filePath, path, orig, setConfig, setDirty, setError);
  };

  return (
    <div className="hideout-section">
      <style>{`.switch { position: relative; display: inline-block; width: 46px; height: 26px; margin-left: 8px; vertical-align: middle; } .switch input { display: none; } .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .3s; border-radius: 26px; } .slider:before { position: absolute; content: ""; height: 17px; width: 17px; left: 5px; bottom: 4.5px; background-color: #fff; transition: .3s; border-radius: 50%; } input:checked + .slider { background-color: #2980d0; } input:checked + .slider:before { transform: translateX(18px); }`}</style>
      <div className="hideout-section-title-row">
        <h2 className="hideout-section-title">Hideout Options</h2>
        <SectionResetButton onReset={resetSection} enabled={isSectionDirty()} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="hideout-options-grid">
          {/* Field config array for all toggles and number inputs */}
          {[
            {
              type: 'toggle',
              label: 'Faster Bitcoin Farming',
              tooltip: 'Enable/disable faster bitcoin farming',
              path: ['fasterBitcoinFarming', 'enabled'],
              value: !!ho.fasterBitcoinFarming.enabled,
              originalValue: !!getOriginal(originalConfig, ['fasterBitcoinFarming', 'enabled'])
            },
            {
              type: 'number',
              label: 'Bitcoin Price',
              tooltip: 'Set the price of bitcoin in the handbook. Default is 100000. Set to null or remove to not change price.',
              path: ['fasterBitcoinFarming', 'bitcoinPrice'],
              value: localValues.btcPrice,
              originalValue: getOriginal(originalConfig, ['fasterBitcoinFarming', 'bitcoinPrice']) as number | '',
              key: 'btcPrice',
            },
            {
              type: 'number',
              label: 'Base Time Multiplier',
              tooltip: 'Base time multiplier for bitcoin production. Lower = slower, higher = faster.',
              path: ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'],
              value: localValues.btcTime,
              originalValue: getOriginal(originalConfig, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier']) as number | '',
              key: 'btcTime',
            },
            {
              type: 'number',
              label: 'GPU Efficiency',
              tooltip: 'GPU efficiency for bitcoin farm. Higher = more bitcoin per GPU.',
              path: ['fasterBitcoinFarming', 'gpuEfficiency'],
              value: localValues.gpuEff,
              originalValue: getOriginal(originalConfig, ['fasterBitcoinFarming', 'gpuEfficiency']) as number | '',
              key: 'gpuEff',
            },
            {
              type: 'toggle',
              label: 'Faster Crafting Time',
              tooltip: 'Enable/disable faster crafting time for all crafts except bitcoin, moonshine, and purified water',
              path: ['fasterCraftingTime', 'enabled'],
              value: !!ho.fasterCraftingTime.enabled,
              originalValue: !!getOriginal(originalConfig, ['fasterCraftingTime', 'enabled'])
            },
            {
              type: 'number',
              label: 'Base Crafting Time Multiplier',
              tooltip: 'Base time multiplier for all crafts except bitcoin, moonshine, and purified water. Higher = faster.',
              path: ['fasterCraftingTime', 'baseCraftingTimeMultiplier'],
              value: localValues.craftTime,
              originalValue: getOriginal(originalConfig, ['fasterCraftingTime', 'baseCraftingTimeMultiplier']) as number | '',
              key: 'craftTime',
            },
            {
              type: 'toggle',
              label: 'Hideout Containers Enabled',
              tooltip: 'Enable/disable basic hideout containers (Medicine case, Holodilnick, Magazine case, Item case, Weapon case, Keytool)',
              path: ['hideoutContainers', 'enabled'],
              value: !!ho.hideoutContainers.enabled,
              originalValue: !!getOriginal(originalConfig, ['hideoutContainers', 'enabled'])
            },
          ].map((field) => {
            if (field.type === 'toggle') {
              return (
                <ConfigToggle
                  key={field.label}
                  checked={field.value as boolean}
                  onChange={checked => patchValue(ipcRenderer, filePath, field.path as string[], checked, setConfig, setDirty, setError)}
                  onReset={() => patchValue(ipcRenderer, filePath, field.path as string[], field.originalValue as boolean, setConfig, setDirty, setError)}
                  resetEnabled={field.value !== field.originalValue}
                  label={field.label}
                  tooltip={field.tooltip}
                />
              );
            } else if (field.type === 'number' && field.key) {
              return (
                <ConfigNumberInput
                  key={field.label}
                  value={field.value as number | ''}
                  onChange={handleNumberInput(field.key)}
                  onBlur={handleNumberBlur(field.key, field.path as string[])}
                  onKeyDown={handleNumberKey(field.key, field.path as string[])}
                  onReset={handleNumberReset(field.key, field.path as string[])}
                  resetEnabled={field.value !== field.originalValue}
                  label={field.label}
                  tooltip={field.tooltip}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default HideoutOptions;
