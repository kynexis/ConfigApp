import { useState, useRef, useEffect } from 'react';
import type { Config, HideoutOptions } from './types/config';
import './App.css';
import './AppStyles.css';

// Toggle switch CSS (20% larger, input border matches toggle blue)
const toggleStyle = `
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  margin-left: 8px;
  vertical-align: middle;
}
.switch input { display: none; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #444;
  transition: .3s;
  border-radius: 26px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 17px;
  width: 17px;
  left: 5px;
  bottom: 4.5px;
  background-color: #fff;
  transition: .3s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #2980d0;
}
input:checked + .slider:before {
  transform: translateX(18px);
}
input[type="number"], input[type="text"] {
  border: 1.5px solid #444;
  outline: none;
  transition: border-color 0.2s;
}
input[type="number"]:focus, input[type="text"]:focus {
  border-color: #2980d0;
}
`;

declare global {
  interface Window {
    require: any;
  }
}

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;


function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [originalConfig, setOriginalConfig] = useState<Config | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [section, setSection] = useState<string>('hideoutOptions');
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const [fadeSaved, setFadeSaved] = useState<boolean>(false);
  const [dirty, setDirty] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  const openConfig = async () => {
    setError('');
    if (!ipcRenderer) {
      setError('Electron IPC not available.');
      return;
    }
    const result = await ipcRenderer.invoke('open-config-dialog');
    if (result.canceled) return;
    if (result.error) {
      setError(result.error);
      setConfig(null);
      setFilePath(result.filePath || '');
    } else {
      setConfig(result.data);
      setOriginalConfig(JSON.parse(JSON.stringify(result.data)));
      setFilePath(result.filePath);
    }
  };

  // Auto-load config by fixed path in production
  useEffect(() => {
    if (!ipcRenderer) return;
    if (process.env.NODE_ENV !== 'development') {
      (async () => {
        const result = await ipcRenderer.invoke('auto-load-config');
        if (result.success) {
          setConfig(result.data);
          setOriginalConfig(JSON.parse(JSON.stringify(result.data)));
          setFilePath(result.filePath);
        } else {
          setError(result.error || 'Failed to auto-load config');
        }
      })();
    }
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!dirty) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveConfig();
    }, 5000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, config]);

  // Save config (full save, rarely needed now)
  const saveConfig = async () => {
    setError('');
    if (!ipcRenderer) {
      setError('Electron IPC not available.');
      return;
    }
    if (!filePath) {
      setError('No file loaded.');
      return;
    }
    const result = await ipcRenderer.invoke('save-config-file', { filePath, data: config });
    if (!result.success) {
      setError(result.error || 'Unknown error');
    } else {
      setShowSaved(true);
      setFadeSaved(false);
      setDirty(false);
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      fadeTimeout.current = setTimeout(() => setFadeSaved(true), 900);
      setTimeout(() => {
        setShowSaved(false);
        setFadeSaved(false);
      }, 1500);
    }
  };

  // Hardcoded section list for sidebar
  const sections = [
    { key: 'hideoutOptions', label: 'Hideout Options' },
    { key: 'stashOptions', label: 'Stash Options' },
    { key: 'traderChanges', label: 'Trader Changes' },
    { key: 'craftingChanges', label: 'Crafting Changes' },
    { key: 'insuranceChanges', label: 'Insurance Changes' },
    { key: 'secureContainersOptions', label: 'Secure Containers' },
    { key: 'economyOptions', label: 'Economy Options' },
    { key: 'otherTweaks', label: 'Other Tweaks' },
  ];

  // Example: Hardcoded UI for Hideout Options
  function HideoutOptions() {
    // Helper: get original value for a given path
    const getOriginal = (path: string[]): unknown => {
      if (!originalConfig) return undefined;
      let obj: any = originalConfig.hideoutOptions;
      for (let i = 0; i < path.length; ++i) {
        if (obj == null) return undefined;
        obj = obj[path[i]];
      }
      return obj;
    };

    // SVG Undo Icons
    const UndoIcon = (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4V8H8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8C5.5 5.5 8 4 10.5 4C14.5 4 18 7.5 18 11.5C18 15.5 14.5 19 10.5 19C7.5 19 5 16.5 4 14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
    const UndoIconLarge = (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6V12H12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12C8 8.5 12 6 16 6C21 6 26 11 26 16C26 21 21 26 16 26C11.5 26 8 22.5 6 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    );
    // Helper: check if any field in hideoutOptions differs from original
    const isSectionDirty = () => {
      if (!originalConfig || !config) return false;
      const orig = originalConfig.hideoutOptions;
      const curr = config.hideoutOptions;
      return JSON.stringify(orig) !== JSON.stringify(curr);
    };

    // Reset all hideout options to original values
    const resetSection = async () => {
      if (!originalConfig || !config) return;
      if (!ipcRenderer || !filePath) return;
      // Patch the entire hideoutOptions object
      const result = await ipcRenderer.invoke('patch-config-value', { filePath, path: ['hideoutOptions'], value: originalConfig.hideoutOptions });
      if (!result.success) {
        setError(result.error || 'Failed to reset section');
        return;
      }
      setConfig(prev => prev ? { ...prev, hideoutOptions: JSON.parse(JSON.stringify(originalConfig.hideoutOptions)) } : prev);
      setDirty(true);
      setError('');
      setTimeout(() => { saveConfig(); }, 0);
    };
    // Always call hooks first
    const ho: HideoutOptions | undefined = config?.hideoutOptions;
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
    }, [ho?.fasterBitcoinFarming.bitcoinPrice, ho?.fasterBitcoinFarming.baseBitcoinTimeMultiplier, ho?.fasterBitcoinFarming.gpuEfficiency, ho?.fasterCraftingTime.baseCraftingTimeMultiplier]);

    // Patch config value via IPC, then update local state, and mark dirty
    const patchValue = async (path: string[], value: unknown) => {
      // Validate number fields: prevent negative values
      const numberFields = [
        'bitcoinPrice',
        'baseBitcoinTimeMultiplier',
        'gpuEfficiency',
        'baseCraftingTimeMultiplier',
      ];
      if (numberFields.includes(path[path.length - 1]) && typeof value === 'number' && value < 0) {
        setError('Value cannot be negative.');
        return;
      }
      if (!ipcRenderer || !filePath) return;
      const result = await ipcRenderer.invoke('patch-config-value', { filePath, path: ['hideoutOptions', ...path], value });
      if (!result.success) {
        setError(result.error || 'Failed to update config');
        return;
      }
      setConfig((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        let obj: Record<string, unknown> = next.hideoutOptions as unknown as Record<string, unknown>;
        for (let i = 0; i < path.length - 1; ++i) {
          if (typeof obj[path[i]] !== 'object' || obj[path[i]] === undefined || obj[path[i]] === null) return prev;
          obj = obj[path[i]] as Record<string, unknown>;
        }
        obj[path[path.length - 1]] = value;
        return next;
      });
      setDirty(true);
      setError('');
    };

    // Helper for Enter key: patch value, blur, and trigger immediate save
    const handleNumberKey = (e: React.KeyboardEvent<HTMLInputElement>, patch: () => void) => {
      if (e.key === 'Enter') {
        patch();
        (e.target as HTMLInputElement).blur();
        setTimeout(() => {
          saveConfig();
        }, 0);
      }
    };

    if (!ho) return <div>No Hideout Options found.</div>;

    // Helper to prevent negative input at the UI level
    const handleNumberInput = (setter: (v: number | '') => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || Number(val) >= 0) {
        setter(val === '' ? '' : Number(val));
        setError('');
      } else {
        setError('Value cannot be negative.');
      }
    };
    return (
      <div className="hideout-section">
        {/* Inject toggle switch CSS */}
        <style>{toggleStyle}</style>
        <div className="hideout-section-title-row">
          <h2 className="hideout-section-title">Hideout Options</h2>
          <div className="hideout-section-reset">
            <span className={`hideout-section-reset-label${isSectionDirty() ? '' : ' disabled'}`}>Reset</span>
            <button
              className="hideout-section-reset-btn"
              title="Reset all Hideout Options to original values"
              disabled={!isSectionDirty()}
              onClick={resetSection}
            >
              {UndoIconLarge}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="hideout-options-grid">
            <span className="config-label" title="Enable/disable faster bitcoin farming">Faster Bitcoin Farming</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <label className="switch">
                <input type="checkbox" checked={ho.fasterBitcoinFarming.enabled} onChange={e => patchValue(['fasterBitcoinFarming', 'enabled'], e.target.checked)} />
                <span className="slider"></span>
              </label>
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={ho.fasterBitcoinFarming.enabled === getOriginal(['fasterBitcoinFarming', 'enabled'])}
                style={{ opacity: ho.fasterBitcoinFarming.enabled !== getOriginal(['fasterBitcoinFarming', 'enabled']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterBitcoinFarming', 'enabled'], getOriginal(['fasterBitcoinFarming', 'enabled']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="Set the price of bitcoin in the handbook. Default is 100000. Set to null or remove to not change price.">Bitcoin Price</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <input
                type="number"
                value={btcPrice}
                className="config-input"
                min={0}
                onChange={handleNumberInput(setBtcPrice)}
                onBlur={() => patchValue(['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice)}
                onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice))}
              />
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={btcPrice === getOriginal(['fasterBitcoinFarming', 'bitcoinPrice'])}
                style={{ opacity: btcPrice !== getOriginal(['fasterBitcoinFarming', 'bitcoinPrice']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterBitcoinFarming', 'bitcoinPrice'], getOriginal(['fasterBitcoinFarming', 'bitcoinPrice']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="Base time multiplier for bitcoin production. Lower = slower, higher = faster.">Base Time Multiplier</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <input
                type="number"
                value={btcTime}
                className="config-input"
                min={0}
                onChange={handleNumberInput(setBtcTime)}
                onBlur={() => patchValue(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime)}
                onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime))}
              />
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={btcTime === getOriginal(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'])}
                style={{ opacity: btcTime !== getOriginal(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], getOriginal(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="GPU efficiency for bitcoin farm. Higher = more bitcoin per GPU.">GPU Efficiency</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <input
                type="number"
                value={gpuEff}
                className="config-input"
                min={0}
                onChange={handleNumberInput(setGpuEff)}
                onBlur={() => patchValue(['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff)}
                onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff))}
              />
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={gpuEff === getOriginal(['fasterBitcoinFarming', 'gpuEfficiency'])}
                style={{ opacity: gpuEff !== getOriginal(['fasterBitcoinFarming', 'gpuEfficiency']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterBitcoinFarming', 'gpuEfficiency'], getOriginal(['fasterBitcoinFarming', 'gpuEfficiency']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="Enable/disable faster crafting time for all crafts except bitcoin, moonshine, and purified water">Faster Crafting Time</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <label className="switch">
                <input type="checkbox" checked={ho.fasterCraftingTime.enabled} onChange={e => patchValue(['fasterCraftingTime', 'enabled'], e.target.checked)} />
                <span className="slider"></span>
              </label>
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={ho.fasterCraftingTime.enabled === getOriginal(['fasterCraftingTime', 'enabled'])}
                style={{ opacity: ho.fasterCraftingTime.enabled !== getOriginal(['fasterCraftingTime', 'enabled']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterCraftingTime', 'enabled'], getOriginal(['fasterCraftingTime', 'enabled']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="Base time multiplier for all crafts except bitcoin, moonshine, and purified water. Higher = faster.">Base Crafting Time Multiplier</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <input
                type="number"
                value={craftTime}
                className="config-input"
                min={0}
                onChange={handleNumberInput(setCraftTime)}
                onBlur={() => patchValue(['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime)}
                onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime))}
              />
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={craftTime === getOriginal(['fasterCraftingTime', 'baseCraftingTimeMultiplier'])}
                style={{ opacity: craftTime !== getOriginal(['fasterCraftingTime', 'baseCraftingTimeMultiplier']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['fasterCraftingTime', 'baseCraftingTimeMultiplier'], getOriginal(['fasterCraftingTime', 'baseCraftingTimeMultiplier']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
            <span className="config-label" title="Enable/disable basic hideout containers (Medicine case, Holodilnick, Magazine case, Item case, Weapon case, Keytool)">Hideout Containers Enabled</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <label className="switch">
                <input type="checkbox" checked={ho.hideoutContainers.enabled} onChange={e => patchValue(['hideoutContainers', 'enabled'], e.target.checked)} />
                <span className="slider"></span>
              </label>
              <button
                className="field-undo-btn"
                title="Reset to original"
                disabled={ho.hideoutContainers.enabled === getOriginal(['hideoutContainers', 'enabled'])}
                style={{ opacity: ho.hideoutContainers.enabled !== getOriginal(['hideoutContainers', 'enabled']) ? 1 : 0.25 }}
                onClick={() => {
                  patchValue(['hideoutContainers', 'enabled'], getOriginal(['hideoutContainers', 'enabled']));
                  setTimeout(() => { saveConfig(); }, 0);
                }}
              >{UndoIcon}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSection() {
    if (!config) return <div>Load a config file to begin.</div>;
    switch (section) {
      case 'hideoutOptions': return <HideoutOptions />;
      // Add more cases for other sections
      default: return <div>Section not implemented yet.</div>;
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', background: '#222' }}>
      <div className="app-sidebar">
        <h2>SoftcoreRedux</h2>
        {sections.map(s => (
          <button
            key={s.key}
            className={`sidebar-section-btn${section === s.key ? ' active' : ''}`}
            onClick={() => setSection(s.key)}
          >
            {s.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <button className="sidebar-bottom-btn" onClick={openConfig}>Open Config</button>
          <button className="sidebar-bottom-btn" onClick={saveConfig} disabled={!filePath || !config}>Save Config</button>
        </div>
        {filePath && <div className="sidebar-filepath"><b>File:</b> {filePath}</div>}
        {error && <div className="sidebar-error">{error}</div>}
      </div>
      <div className="app-main">
        {error && (
          <div className="app-error-alert">
            {error}
          </div>
        )}
        {renderSection()}
      </div>
      {showSaved && (
        <div
          className="file-saved-alert"
          style={{ opacity: fadeSaved ? 0 : 1 }}
        >
          File Saved!
        </div>
      )}
    </div>
  );
}

export default App;
