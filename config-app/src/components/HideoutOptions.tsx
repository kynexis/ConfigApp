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
  // Local state for number fields
  const [btcPrice, setBtcPrice] = useState<number | ''>(ho ? (ho.fasterBitcoinFarming.bitcoinPrice ?? '') : '');
  const [btcTime, setBtcTime] = useState<number | ''>(ho ? ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier : '');
  const [gpuEff, setGpuEff] = useState<number | ''>(ho ? ho.fasterBitcoinFarming.gpuEfficiency : '');
  const [craftTime, setCraftTime] = useState<number | ''>(ho ? ho.fasterCraftingTime.baseCraftingTimeMultiplier : '');

  useEffect(() => {
    if (!ho) return;
    setBtcPrice(ho.fasterBitcoinFarming.bitcoinPrice ?? '');
    setBtcTime(ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier);
    setGpuEff(ho.fasterBitcoinFarming.gpuEfficiency);
    setCraftTime(ho.fasterCraftingTime.baseCraftingTimeMultiplier);
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

  // Number input helpers
  const handleNumberInput = (setter: (v: number | '') => void) => (val: number | '') => {
    if (val === '' || Number(val) >= 0) {
      setter(val);
      setError('');
    } else {
      setError('Value cannot be negative.');
    }
  };
  const handleNumberKey = (patch: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      patch();
      (e.target as HTMLInputElement).blur();
      setTimeout(() => { saveConfig(); }, 0);
    }
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
          <ConfigToggle
            checked={ho.fasterBitcoinFarming.enabled}
            onChange={checked => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'enabled'], checked, setConfig, setDirty, setError)}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'enabled'], getOriginal(originalConfig, ['fasterBitcoinFarming', 'enabled']), setConfig, setDirty, setError)}
            resetEnabled={ho.fasterBitcoinFarming.enabled !== getOriginal(originalConfig, ['fasterBitcoinFarming', 'enabled'])}
            label="Faster Bitcoin Farming"
            tooltip="Enable/disable faster bitcoin farming"
          />
          <ConfigNumberInput
            value={btcPrice}
            onChange={handleNumberInput(setBtcPrice)}
            onBlur={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice, setConfig, setDirty, setError)}
            onKeyDown={handleNumberKey(() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice, setConfig, setDirty, setError))}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'bitcoinPrice'], getOriginal(originalConfig, ['fasterBitcoinFarming', 'bitcoinPrice']), setConfig, setDirty, setError)}
            resetEnabled={btcPrice !== getOriginal(originalConfig, ['fasterBitcoinFarming', 'bitcoinPrice'])}
            label="Bitcoin Price"
            tooltip="Set the price of bitcoin in the handbook. Default is 100000. Set to null or remove to not change price."
          />
          <ConfigNumberInput
            value={btcTime}
            onChange={handleNumberInput(setBtcTime)}
            onBlur={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime, setConfig, setDirty, setError)}
            onKeyDown={handleNumberKey(() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime, setConfig, setDirty, setError))}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], getOriginal(originalConfig, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier']), setConfig, setDirty, setError)}
            resetEnabled={btcTime !== getOriginal(originalConfig, ['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'])}
            label="Base Time Multiplier"
            tooltip="Base time multiplier for bitcoin production. Lower = slower, higher = faster."
          />
          <ConfigNumberInput
            value={gpuEff}
            onChange={handleNumberInput(setGpuEff)}
            onBlur={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff, setConfig, setDirty, setError)}
            onKeyDown={handleNumberKey(() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff, setConfig, setDirty, setError))}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterBitcoinFarming', 'gpuEfficiency'], getOriginal(originalConfig, ['fasterBitcoinFarming', 'gpuEfficiency']), setConfig, setDirty, setError)}
            resetEnabled={gpuEff !== getOriginal(originalConfig, ['fasterBitcoinFarming', 'gpuEfficiency'])}
            label="GPU Efficiency"
            tooltip="GPU efficiency for bitcoin farm. Higher = more bitcoin per GPU."
          />
          <ConfigToggle
            checked={ho.fasterCraftingTime.enabled}
            onChange={checked => patchValue(ipcRenderer, filePath, ['fasterCraftingTime', 'enabled'], checked, setConfig, setDirty, setError)}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterCraftingTime', 'enabled'], getOriginal(originalConfig, ['fasterCraftingTime', 'enabled']), setConfig, setDirty, setError)}
            resetEnabled={ho.fasterCraftingTime.enabled !== getOriginal(originalConfig, ['fasterCraftingTime', 'enabled'])}
            label="Faster Crafting Time"
            tooltip="Enable/disable faster crafting time for all crafts except bitcoin, moonshine, and purified water"
          />
          <ConfigNumberInput
            value={craftTime}
            onChange={handleNumberInput(setCraftTime)}
            onBlur={() => patchValue(ipcRenderer, filePath, ['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime, setConfig, setDirty, setError)}
            onKeyDown={handleNumberKey(() => patchValue(ipcRenderer, filePath, ['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime, setConfig, setDirty, setError))}
            onReset={() => patchValue(ipcRenderer, filePath, ['fasterCraftingTime', 'baseCraftingTimeMultiplier'], getOriginal(originalConfig, ['fasterCraftingTime', 'baseCraftingTimeMultiplier']), setConfig, setDirty, setError)}
            resetEnabled={craftTime !== getOriginal(originalConfig, ['fasterCraftingTime', 'baseCraftingTimeMultiplier'])}
            label="Base Crafting Time Multiplier"
            tooltip="Base time multiplier for all crafts except bitcoin, moonshine, and purified water. Higher = faster."
          />
          <ConfigToggle
            checked={ho.hideoutContainers.enabled}
            onChange={checked => patchValue(ipcRenderer, filePath, ['hideoutContainers', 'enabled'], checked, setConfig, setDirty, setError)}
            onReset={() => patchValue(ipcRenderer, filePath, ['hideoutContainers', 'enabled'], getOriginal(originalConfig, ['hideoutContainers', 'enabled']), setConfig, setDirty, setError)}
            resetEnabled={ho.hideoutContainers.enabled !== getOriginal(originalConfig, ['hideoutContainers', 'enabled'])}
            label="Hideout Containers Enabled"
            tooltip="Enable/disable basic hideout containers (Medicine case, Holodilnick, Magazine case, Item case, Weapon case, Keytool)"
          />
        </div>
      </div>
    </div>
  );
};

export default HideoutOptions;
