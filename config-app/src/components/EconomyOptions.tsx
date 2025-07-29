import React, { useMemo, useCallback } from 'react';
import SectionResetButton from './SectionResetButton';
import ConfigNumberInput from './ConfigNumberInput';
import ConfigToggle from './ConfigToggle';

interface EconomyOptionsProps {
  eo: {
    enabled: boolean;
    disableFleaMarketCompletely?: boolean;
    priceRebalance?: { enabled?: boolean; itemFixes?: boolean };
    pacifistFleaMarket?: {
      enabled?: boolean;
      whitelist?: { enabled?: boolean; priceMultiplier?: number };
      questKeys?: { enabled?: boolean; priceMultiplier?: number };
      markedKeys?: { enabled?: boolean; priceMultiplier?: number };
    };
    barterEconomy?: {
      enabled?: boolean;
      cashOffersPercentage?: number;
      barterPriceVariance?: number;
      offerItemCount?: { min?: number; max?: number };
      nonStackableCount?: { min?: number; max?: number };
      itemCountMax?: number;
      unbanBitcoinsForBarters?: boolean;
    };
    otherFleaMarketChanges?: {
      enabled?: boolean;
      sellingOnFlea?: boolean;
      fleaMarketOpenAtLevel?: number;
      fleaPricesIncreased?: number;
      fleaPristineItems?: boolean;
      onlyFoundInRaidItemsAllowedForBarters?: boolean;
    };
  };
  originalConfig: { economyOptions: EconomyOptionsProps['eo'] };
  filePath: string;
  ipcRenderer: unknown;
  setConfig: (fn: (prev: unknown) => unknown) => void;
  setDirty: (dirty: boolean) => void;
  setError: (err: string) => void;
  saveConfig: () => void;
}

const fields = [
  { key: 'enabled', label: 'Enable Economy Options', type: 'toggle', tooltip: 'Master toggle for all economy options.' },
  { key: 'disableFleaMarketCompletely', label: 'Disable Flea Market Completely', type: 'toggle', tooltip: 'Completely disable flea market for a true HARDCORE experience.' },
  { key: 'priceRebalance.enabled', label: 'Enable Price Rebalance', type: 'toggle', tooltip: 'Removes SPT flea prices snapshot from LIVE, matches to handbook/trader prices.' },
  { key: 'priceRebalance.itemFixes', label: 'Enable Item Fixes', type: 'toggle', tooltip: 'Fix for important items like intel folder and military flash drive.' },
  { key: 'pacifistFleaMarket.enabled', label: 'Enable Pacifist Flea Market', type: 'toggle', tooltip: 'Only meds, barter items, food and info items can be bought on flea market.' },
  { key: 'pacifistFleaMarket.whitelist.enabled', label: 'Whitelist Enabled', type: 'toggle', tooltip: 'Small list of items used in crafts and trader barters is available on flea.' },
  { key: 'pacifistFleaMarket.whitelist.priceMultiplier', label: 'Whitelist Price Multiplier', type: 'number', min: 1, max: 10, step: 0.1, tooltip: 'Price multiplier for whitelist items.' },
  { key: 'pacifistFleaMarket.questKeys.enabled', label: 'Quest Keys Enabled', type: 'toggle', tooltip: 'Random-only QUEST keys are available on flea.' },
  { key: 'pacifistFleaMarket.questKeys.priceMultiplier', label: 'Quest Keys Price Multiplier', type: 'number', min: 1, max: 10, step: 0.1, tooltip: 'Price multiplier for quest keys.' },
  { key: 'pacifistFleaMarket.markedKeys.enabled', label: 'Marked Keys Enabled', type: 'toggle', tooltip: 'Marked keys are available on flea market.' },
  { key: 'pacifistFleaMarket.markedKeys.priceMultiplier', label: 'Marked Keys Price Multiplier', type: 'number', min: 1, max: 10, step: 0.1, tooltip: 'Price multiplier for marked keys.' },
  { key: 'barterEconomy.enabled', label: 'Enable Barter Economy', type: 'toggle', tooltip: 'Only allows to buy items on flea using other random FiR or crafted items.' },
  { key: 'barterEconomy.cashOffersPercentage', label: 'Cash Offers Percentage', type: 'number', min: 0, max: 100, step: 1, tooltip: 'Allow small, random percentage of listings to be buyable for cash.' },
  { key: 'barterEconomy.barterPriceVariance', label: 'Barter Price Variance (%)', type: 'number', min: 0, max: 100, step: 1, tooltip: 'Percent of price variance between item listing and barter value.' },
  { key: 'barterEconomy.offerItemCount.min', label: 'Offer Item Count Min', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Min number of different offers of an item.' },
  { key: 'barterEconomy.offerItemCount.max', label: 'Offer Item Count Max', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Max number of different offers of an item.' },
  { key: 'barterEconomy.nonStackableCount.min', label: 'Non-Stackable Count Min', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Min number of items per individual offer.' },
  { key: 'barterEconomy.nonStackableCount.max', label: 'Non-Stackable Count Max', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Max number of items per individual offer.' },
  { key: 'barterEconomy.itemCountMax', label: 'Item Count Max', type: 'number', min: 1, max: 100, step: 1, tooltip: 'Limits maximum number of items asked for barter.' },
  { key: 'barterEconomy.unbanBitcoinsForBarters', label: 'Unban Bitcoins For Barters', type: 'toggle', tooltip: 'Allow bitcoins for barters.' },
  { key: 'otherFleaMarketChanges.enabled', label: 'Other Flea Market Changes Enabled', type: 'toggle', tooltip: 'Master toggle for all other flea market changes.' },
  { key: 'otherFleaMarketChanges.sellingOnFlea', label: 'Selling On Flea', type: 'toggle', tooltip: 'Allow selling on flea market.' },
  { key: 'otherFleaMarketChanges.fleaMarketOpenAtLevel', label: 'Flea Market Open At Level', type: 'number', min: 1, max: 99, step: 1, tooltip: 'PMC level flea market opens at.' },
  { key: 'otherFleaMarketChanges.fleaPricesIncreased', label: 'Flea Prices Increased', type: 'number', min: 1, max: 10, step: 0.1, tooltip: 'Slightly increase flea market prices.' },
  { key: 'otherFleaMarketChanges.fleaPristineItems', label: 'Flea Pristine Items', type: 'toggle', tooltip: 'Only pristine condition items are offered on flea.' },
  { key: 'otherFleaMarketChanges.onlyFoundInRaidItemsAllowedForBarters', label: 'Only FiR Items Allowed For Barters', type: 'toggle', tooltip: 'Only found in raid items allowed for barters.' },
];

function getValue(obj: unknown, path: string) {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}
function setValue(obj: unknown, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const ref = keys.reduce<Record<string, unknown>>((o, k) => {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
    return o[k] as Record<string, unknown>;
  }, obj as Record<string, unknown>);
  (ref as Record<string, unknown>)[last] = value;
}
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const EconomyOptions: React.FC<EconomyOptionsProps> = ({ eo, originalConfig, setConfig, setDirty }) => {
  const original = useMemo(() => originalConfig?.economyOptions, [originalConfig]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).economyOptions, key, value);
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty]);

  const handleUndo = useCallback((key: string) => {
    setConfig((prev: unknown) => {
      const next = deepClone(prev);
      setValue((next as Record<string, unknown>).economyOptions, key, getValue(original, key));
      return next;
    });
    setDirty(true);
  }, [setConfig, setDirty, original]);

  const sectionChanged = useMemo(() => {
    return fields.some(field => getValue(eo, field.key) !== getValue(original, field.key));
  }, [eo, original]);

  return (
    <div className="hideout-section">
      <div className="hideout-section-title-row">
        <div className="hideout-section-title">Economy Options</div>
        <SectionResetButton
          onReset={() => {
            setConfig((prev: unknown) => {
              const next = deepClone(prev);
              (next as Record<string, unknown>).economyOptions = deepClone(original);
              return next;
            });
            setDirty(true);
          }}
          enabled={sectionChanged}
        />
      </div>
      <div className="hideout-options-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr' }}>
        {fields.map((field) => {
          const value = getValue(eo, field.key);
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
                  <ConfigNumberInput
                    value={typeof value === 'number' ? value : ''}
                    onChange={v => handleChange(field.key, v)}
                    onBlur={() => {}}
                    onKeyDown={() => {}}
                    onReset={() => handleUndo(field.key)}
                    resetEnabled={changed}
                    label=""
                    tooltip={field.tooltip}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default EconomyOptions;
