import { useState, useRef, useEffect } from 'react';
import type { Config } from './types/config';
import './App.css';
import './AppStyles.css';
import Sidebar from './components/Sidebar';
import FileSavedAlert from './components/FileSavedAlert';
import ErrorAlert from './components/ErrorAlert';

import * as HideoutOptionsModule from './components/HideoutOptions';
import * as StashOptionsModule from './components/StashOptions';
import * as TraderChangesModule from './components/TraderChanges';
import * as CraftingChangesModule from './components/CraftingChanges';
import * as InsuranceChangesModule from './components/InsuranceChanges';

declare global {
  interface Window {
    require: NodeRequire;
  }
}

const electron = window.require ? window.require('electron') : null;
const ipcRenderer: typeof import('electron').ipcRenderer | null = electron ? electron.ipcRenderer : null;


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

  function renderSection() {
    if (!config) return <div>Load a config file to begin.</div>;
    switch (section) {
      case 'hideoutOptions':
        if (!originalConfig) return null;
        return (
          <HideoutOptionsModule.default
            ho={config.hideoutOptions}
            originalConfig={originalConfig as { hideoutOptions: import('./types/config').HideoutOptions }}
            filePath={filePath}
            ipcRenderer={ipcRenderer}
            setConfig={setConfig as unknown as (fn: (prev: unknown) => unknown) => void}
            setDirty={setDirty}
            setError={setError}
            saveConfig={saveConfig}
          />
        );
      case 'stashOptions':
        if (!originalConfig) return null;
        return (
          <StashOptionsModule.default
            so={config.stashOptions}
            originalConfig={originalConfig as unknown as { stashOptions: import('./types/config').Config['stashOptions'] }}
            filePath={filePath}
            ipcRenderer={ipcRenderer}
            setConfig={setConfig as unknown as (fn: (prev: unknown) => unknown) => void}
            setDirty={setDirty}
            setError={setError}
            saveConfig={saveConfig}
          />
        );
      case 'traderChanges':
        if (!originalConfig) return null;
        return (
          <TraderChangesModule.default
            tc={config.traderChanges}
            originalConfig={originalConfig as unknown as { traderChanges: import('./types/config').Config['traderChanges'] }}
            filePath={filePath}
            ipcRenderer={ipcRenderer}
            setConfig={setConfig as unknown as (fn: (prev: unknown) => unknown) => void}
            setDirty={setDirty}
            setError={setError}
            saveConfig={saveConfig}
          />
        );
      case 'craftingChanges':
        if (!originalConfig) return null;
        return (
          <CraftingChangesModule.default
            cc={config.craftingChanges}
            originalConfig={originalConfig as unknown as { craftingChanges: import('./types/config').Config['craftingChanges'] }}
            filePath={filePath}
            ipcRenderer={ipcRenderer}
            setConfig={setConfig as unknown as (fn: (prev: unknown) => unknown) => void}
            setDirty={setDirty}
            setError={setError}
            saveConfig={saveConfig}
          />
        );
      case 'insuranceChanges':
        if (!originalConfig) return null;
        return (
          <InsuranceChangesModule.default
            ic={config.insuranceChanges}
            originalConfig={originalConfig as unknown as { insuranceChanges: import('./types/config').Config['insuranceChanges'] }}
            filePath={filePath}
            ipcRenderer={ipcRenderer}
            setConfig={setConfig as unknown as (fn: (prev: unknown) => unknown) => void}
            setDirty={setDirty}
            setError={setError}
            saveConfig={saveConfig}
          />
        );
      default: return <div>Section not implemented yet.</div>;
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', background: '#222' }}>
      <Sidebar
        sections={sections}
        section={section}
        setSection={setSection}
        openConfig={openConfig}
        saveConfig={saveConfig}
        filePath={filePath}
        error={error}
        configLoaded={!!config}
      />
      <div className="app-main">
        <ErrorAlert error={error} />
        {renderSection()}
      </div>
      <FileSavedAlert show={showSaved} fade={fadeSaved} />
    </div>
  );
}

export default App;
