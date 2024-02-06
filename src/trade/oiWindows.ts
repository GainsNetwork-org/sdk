import { OiWindows, OiWindowsSettings } from "../trade/types";

export const getCurrentOiWindowId = (
  oiWindowSettings: OiWindowsSettings
): number => {
  return Math.floor(
    (Math.floor(Date.now() / 1000) - oiWindowSettings.startTs) /
      oiWindowSettings.windowsDuration
  );
};

export const getActiveOi = (
  currentOiWindowId: number,
  windowsCount: number,
  oiWindows: OiWindows | undefined,
  buy: boolean
): number => {
  if (oiWindows === undefined || windowsCount === 0) return 0;

  let activeOi = 0;

  for (
    let id = currentOiWindowId - (windowsCount - 1);
    id <= currentOiWindowId;
    id++
  ) {
    activeOi +=
      (buy ? oiWindows?.[id]?.oiLongUsd : oiWindows?.[id]?.oiShortUsd) || 0;
  }

  return activeOi;
};
