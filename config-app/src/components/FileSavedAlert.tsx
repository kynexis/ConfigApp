import React from 'react';

interface FileSavedAlertProps {
  show: boolean;
  fade: boolean;
}

const FileSavedAlert: React.FC<FileSavedAlertProps> = ({ show, fade }) => {
  if (!show) return null;
  return (
    <div
      className="file-saved-alert"
      style={{ opacity: fade ? 0 : 1 }}
    >
      File Saved!
    </div>
  );
};

export default FileSavedAlert;
