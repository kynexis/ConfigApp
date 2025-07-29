// src/types/config.ts

export interface HideoutOptions {
  fasterBitcoinFarming: {
    enabled: boolean;
    bitcoinPrice: number | null;
    baseBitcoinTimeMultiplier: number;
    gpuEfficiency: number;
  };
  fasterCraftingTime: {
    enabled: boolean;
    baseCraftingTimeMultiplier: number;
    hideoutSkillExpFix: {
      enabled: boolean;
      hideoutSkillExpMultiplier: number;
    };
    fasterMoonshineProduction: {
      enabled: boolean;
      baseCraftingTimeMultiplier: number;
    };
    fasterPurifiedWaterProduction: {
      enabled: boolean;
      baseCraftingTimeMultiplier: number;
    };
    fasterCultistCircle: {
      enabled: boolean;
      baseCraftingTimeMultiplier: number;
    };
  };
  hideoutContainers: {
    enabled: boolean;
    biggerHideoutContainers: boolean;
    siccCaseBuff: boolean;
  };
  fuelConsumption: {
    enabled: boolean;
    fuelConsumptionMultiplier: number;
  };
  fasterHideoutConstruction: {
    enabled: boolean;
    hideoutConstructionTimeMultiplier: number;
  };
  scavCaseOptions: {
    enabled: boolean;
    betterRewards: boolean;
    rebalance: boolean;
    fasterScavcase: {
      enabled: boolean;
      speedMultiplier: number;
    };
  };
  allowGymTrainingWithMusclePain: boolean;
  disableFIRHideout: boolean;
}

export interface Config {
  hideoutOptions: HideoutOptions;
  // Add other sections as needed, e.g. stashOptions, traderChanges, etc.
  [key: string]: any;
}
