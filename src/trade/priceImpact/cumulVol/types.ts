export type DepthBands = {
  totalDepthUsd: number; // Total depth in USD
  bands: number[]; // 30 band percentages (0-1, where 1 = 100%)
};

export type PairDepthBands = {
  above: DepthBands | undefined;
  below: DepthBands | undefined;
};

export type DepthBandsMapping = {
  bands: number[]; // 30 band offset values (0-1, where 0.01 = 1%)
};
