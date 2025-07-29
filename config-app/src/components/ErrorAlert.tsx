import React from 'react';

interface ErrorAlertProps {
  error: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="app-error-alert">
      {error}
    </div>
  );
};

export default ErrorAlert;
