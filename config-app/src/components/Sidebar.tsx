import React from 'react';

interface Section {
  key: string;
  label: string;
}

interface SidebarProps {
  sections: Section[];
  section: string;
  setSection: (key: string) => void;
  openConfig: () => void;
  saveConfig: () => void;
  filePath: string;
  error: string;
  configLoaded: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sections,
  section,
  setSection,
  openConfig,
  saveConfig,
  filePath,
  error,
  configLoaded
}) => (
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
      <button className="sidebar-bottom-btn" onClick={saveConfig} disabled={!filePath || !configLoaded}>Save Config</button>
    </div>
    {filePath && <div className="sidebar-filepath"><b>File:</b> {filePath}</div>}
    {error && <div className="sidebar-error">{error}</div>}
  </div>
);

export default Sidebar;
