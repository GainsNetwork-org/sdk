import { OiWindows, OiWindowsSettings } from "@/trade/types";

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
  if (oiWindows === undefined) return 0;

  let activeOi = 0;

  for (
    let id = currentOiWindowId - windowsCount;
    id <= currentOiWindowId;
    id++
  ) {
    activeOi += (buy ? oiWindows?.[id]?.long : oiWindows?.[id]?.short) || 0;
  }

  return activeOi;
};
