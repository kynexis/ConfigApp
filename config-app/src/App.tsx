import { useState, useRef, useEffect } from 'react';
import './App.css';

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
  const [config, setConfig] = useState<any>(null);
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
    // Always call hooks first
    const ho = config?.hideoutOptions;
    const [btcPrice, setBtcPrice] = useState(ho ? ho.fasterBitcoinFarming.bitcoinPrice : '');
    const [btcTime, setBtcTime] = useState(ho ? ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier : '');
    const [gpuEff, setGpuEff] = useState(ho ? ho.fasterBitcoinFarming.gpuEfficiency : '');
    const [craftTime, setCraftTime] = useState(ho ? ho.fasterCraftingTime.baseCraftingTimeMultiplier : '');

    useEffect(() => {
      if (!ho) return;
      setBtcPrice(ho.fasterBitcoinFarming.bitcoinPrice);
      setBtcTime(ho.fasterBitcoinFarming.baseBitcoinTimeMultiplier);
      setGpuEff(ho.fasterBitcoinFarming.gpuEfficiency);
      setCraftTime(ho.fasterCraftingTime.baseCraftingTimeMultiplier);
    }, [ho?.fasterBitcoinFarming.bitcoinPrice, ho?.fasterBitcoinFarming.baseBitcoinTimeMultiplier, ho?.fasterBitcoinFarming.gpuEfficiency, ho?.fasterCraftingTime.baseCraftingTimeMultiplier]);

    // Patch config value via IPC, then update local state, and mark dirty
    const patchValue = async (path: string[], value: any) => {
      if (!ipcRenderer || !filePath) return;
      const result = await ipcRenderer.invoke('patch-config-value', { filePath, path: ['hideoutOptions', ...path], value });
      if (!result.success) {
        setError(result.error || 'Failed to update config');
        return;
      }
      setConfig((prev: any) => {
        const next = { ...prev };
        let obj = next.hideoutOptions;
        for (let i = 0; i < path.length - 1; ++i) {
          if (obj[path[i]] === undefined) return prev;
          obj = obj[path[i]];
        }
        obj[path[path.length - 1]] = value;
        return next;
      });
      setDirty(true);
    };

    // Helper for Enter key: patch value, blur, and trigger immediate save
    const handleNumberKey = (e: React.KeyboardEvent<HTMLInputElement>, patch: () => void) => {
      if (e.key === 'Enter') {
        patch();
        (e.target as HTMLInputElement).blur();
        // Immediately save config after Enter
        setTimeout(() => {
          saveConfig();
        }, 0);
      }
    };

    if (!ho) return <div>No Hideout Options found.</div>;

    const labelStyle = { fontSize: 16, fontWeight: 500, textAlign: 'left' as const };
    const inputStyle = { width: 120, height: 28, fontSize: 16, borderRadius: 6, background: '#181a1b', color: '#fff', padding: '2px 8px', justifySelf: 'end', outline: 'none', transition: 'border-color 0.2s' };
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(0,0,0,0.10)', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}>
        {/* Inject toggle switch CSS */}
        <style>{toggleStyle}</style>
        <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 32, fontSize: 28 }}>Hideout Options</h2>

        {/* Main grid: two columns, labels left, controls right */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 420, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 18, columnGap: 24, alignItems: 'center' }}>
            {/* Faster Bitcoin Farming */}
            <span style={labelStyle}>Faster Bitcoin Farming</span>
            <label className="switch" style={{ justifySelf: 'end' }}>
              <input type="checkbox" checked={ho.fasterBitcoinFarming.enabled} onChange={e => patchValue(['fasterBitcoinFarming', 'enabled'], e.target.checked)} />
              <span className="slider"></span>
            </label>

            <span style={labelStyle}>Bitcoin Price</span>
            <input
              type="number"
              value={btcPrice}
              style={inputStyle}
              onChange={e => setBtcPrice(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => patchValue(['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice)}
              onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'bitcoinPrice'], btcPrice))}
            />

            <span style={labelStyle}>Base Time Multiplier</span>
            <input
              type="number"
              value={btcTime}
              style={inputStyle}
              onChange={e => setBtcTime(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => patchValue(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime)}
              onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'baseBitcoinTimeMultiplier'], btcTime))}
            />

            <span style={labelStyle}>GPU Efficiency</span>
            <input
              type="number"
              value={gpuEff}
              style={inputStyle}
              onChange={e => setGpuEff(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => patchValue(['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff)}
              onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterBitcoinFarming', 'gpuEfficiency'], gpuEff))}
            />

            {/* Faster Crafting Time */}
            <span style={labelStyle}>Faster Crafting Time</span>
            <label className="switch" style={{ justifySelf: 'end' }}>
              <input type="checkbox" checked={ho.fasterCraftingTime.enabled} onChange={e => patchValue(['fasterCraftingTime', 'enabled'], e.target.checked)} />
              <span className="slider"></span>
            </label>

            <span style={labelStyle}>Base Crafting Time Multiplier</span>
            <input
              type="number"
              value={craftTime}
              style={inputStyle}
              onChange={e => setCraftTime(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => patchValue(['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime)}
              onKeyDown={e => handleNumberKey(e, () => patchValue(['fasterCraftingTime', 'baseCraftingTimeMultiplier'], craftTime))}
            />

            {/* Hideout Containers Enabled */}
            <span style={labelStyle}>Hideout Containers Enabled</span>
            <label className="switch" style={{ justifySelf: 'end' }}>
              <input type="checkbox" checked={ho.hideoutContainers.enabled} onChange={e => patchValue(['hideoutContainers', 'enabled'], e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Add more fields as needed for other hideout options */}
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
      {/* Sidebar: fixed, detached, transparent */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 240,
          height: '100vh',
          background: 'rgba(24,24,24,0.6)',
          color: '#fff',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          boxShadow: '2px 0 12px 0 rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>Sections</h2>
        {sections.map(s => (
          <button key={s.key} style={{ marginBottom: 8, background: section === s.key ? '#333' : undefined, color: '#fff', textAlign: 'left', width: '100%' }} onClick={() => setSection(s.key)}>
            {s.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={openConfig} style={{ width: '100%', marginBottom: 8 }}>Open Config</button>
          <button onClick={saveConfig} disabled={!filePath || !config} style={{ width: '100%' }}>Save Config</button>
        </div>
        {filePath && <div style={{ fontSize: 12, marginTop: 8, wordBreak: 'break-all' }}><b>File:</b> {filePath}</div>}
        {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}
      </div>
      {/* Main view: margin-left to make space for sidebar */}
      <div
        style={{
          marginLeft: 240,
          minHeight: '100vh',
          background: '#222',
          color: '#fff',
          padding: 32,
          overflow: 'auto',
        }}
      >
        {renderSection()}
      </div>
      {/* File Saved Alert */}
      {showSaved && (
        <div
          style={{
            position: 'fixed',
            right: 32,
            bottom: 32,
            background: 'rgba(41, 114, 163, 0.55)',
            color: '#e4e9ebda',
            padding: '12px 24px',
            borderRadius: 16,
            fontWeight: 600,
            fontSize: 18,
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
            zIndex: 1000,
            transition: 'opacity 0.6s',
            pointerEvents: 'none',
            opacity: fadeSaved ? 0 : 1,
          }}
        >
          File Saved!
        </div>
      )}
    </div>
  );
}

export default App;
