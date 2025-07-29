// Utility functions for config patching, getting original values, etc.
import type { Config } from '../types/config';

export function getOriginal(originalConfig: Config | null, path: string[]): unknown {
  if (!originalConfig) return undefined;
  let obj: any = originalConfig.hideoutOptions;
  for (let i = 0; i < path.length; ++i) {
    if (obj == null) return undefined;
    obj = obj[path[i]];
  }
  return obj;
}

export async function patchValue(ipcRenderer: any, filePath: string, path: string[], value: unknown, setConfig: (updater: (prev: any) => any) => void, setDirty: (dirty: boolean) => void, setError: (err: string) => void) {
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
}
