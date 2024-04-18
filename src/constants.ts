const CRYPTO = "crypto";
const FOREX = "forex";
const STOCKS = "stocks";
const INDICES = "indices";
const COMMODITIES = "commodities";

export const pairs = {
  "BTC/USD": CRYPTO,
  "ETH/USD": CRYPTO,
  "LINK/USD": CRYPTO,
  "DOGE/USD": CRYPTO,
  "MATIC/USD": CRYPTO,
  "ADA/USD": CRYPTO,
  "SUSHI/USD": CRYPTO,
  "AAVE/USD": CRYPTO,
  "ALGO/USD": CRYPTO,
  "BAT/USD": CRYPTO,
  "COMP/USD": CRYPTO,
  "DOT/USD": CRYPTO,
  "EOS/USD": CRYPTO,
  "LTC/USD": CRYPTO,
  "MANA/USD": CRYPTO,
  "OMG/USD": CRYPTO,
  "SNX/USD": CRYPTO,
  "UNI/USD": CRYPTO,
  "XLM/USD": CRYPTO,
  "XRP/USD": CRYPTO,
  "ZEC/USD": CRYPTO,
  "EUR/USD": FOREX,
  "USD/JPY": FOREX,
  "GBP/USD": FOREX,
  "USD/CHF": FOREX,
  "AUD/USD": FOREX,
  "USD/CAD": FOREX,
  "NZD/USD": FOREX,
  "EUR/CHF": FOREX,
  "EUR/JPY": FOREX,
  "EUR/GBP": FOREX,
  "LUNA/USD": CRYPTO,
  "YFI/USD": CRYPTO,
  "SOL/USD": CRYPTO,
  "XTZ/USD": CRYPTO,
  "BCH/USD": CRYPTO,
  "BNT/USD": CRYPTO,
  "CRV/USD": CRYPTO,
  "DASH/USD": CRYPTO,
  "ETC/USD": CRYPTO,
  "ICP/USD": CRYPTO,
  "MKR/USD": CRYPTO,
  "NEO/USD": CRYPTO,
  "THETA/USD": CRYPTO,
  "TRX/USD": CRYPTO,
  "ZRX/USD": CRYPTO,
  "SAND/USD": CRYPTO,
  "BNB/USD": CRYPTO,
  "AXS/USD": CRYPTO,
  "GRT/USD": CRYPTO,
  "HBAR/USD": CRYPTO,
  "XMR/USD": CRYPTO,
  "ENJ/USD": CRYPTO,
  "FTM/USD": CRYPTO,
  "FTT/USD": CRYPTO,
  "APE/USD": CRYPTO,
  "CHZ/USD": CRYPTO,
  "SHIB/USD": CRYPTO,
  "AAPL/USD": STOCKS,
  "FB/USD": STOCKS,
  "GOOGL/USD": STOCKS,
  "AMZN/USD": STOCKS,
  "MSFT/USD": STOCKS,
  "TSLA/USD": STOCKS,
  "SNAP/USD": STOCKS,
  "NVDA/USD": STOCKS,
  "V/USD": STOCKS,
  "MA/USD": STOCKS,
  "PFE/USD": STOCKS,
  "KO/USD": STOCKS,
  "DIS/USD": STOCKS,
  "GME/USD": STOCKS,
  "NKE/USD": STOCKS,
  "AMD/USD": STOCKS,
  "PYPL/USD": STOCKS,
  "ABNB/USD": STOCKS,
  "BA/USD": STOCKS,
  "SBUX/USD": STOCKS,
  "WMT/USD": STOCKS,
  "INTC/USD": STOCKS,
  "MCD/USD": STOCKS,
  "META/USD": STOCKS,
  "GOOGL_1/USD": STOCKS,
  "GME_1/USD": STOCKS,
  "AMZN_1/USD": STOCKS,
  "TSLA_1/USD": STOCKS,
  "SPY/USD": INDICES,
  "QQQ/USD": INDICES,
  "IWM/USD": INDICES,
  "DIA/USD": INDICES,
  "XAU/USD": COMMODITIES,
  "XAG/USD": COMMODITIES,
  "USD/CNH": FOREX,
  "USD/SGD": FOREX,
  "EUR/SEK": FOREX,
  "USD/KRW": FOREX,
  "EUR/NOK": FOREX,
  "USD/INR": FOREX,
  "USD/MXN": FOREX,
  "USD/TWD": FOREX,
  "USD/ZAR": FOREX,
  "USD/BRL": FOREX,
  "AVAX/USD": CRYPTO,
  "ATOM/USD": CRYPTO,
  "NEAR/USD": CRYPTO,
  "QNT/USD": CRYPTO,
  "IOTA/USD": CRYPTO,
  "TON/USD": CRYPTO,
  "RPL/USD": CRYPTO,
  "ARB/USD": CRYPTO,
  "EUR/AUD": FOREX,
  "EUR/NZD": FOREX,
  "EUR/CAD": FOREX,
  "GBP/AUD": FOREX,
  "GBP/NZD": FOREX,
  "GBP/CAD": FOREX,
  "GBP/CHF": FOREX,
  "GBP/JPY": FOREX,
  "AUD/NZD": FOREX,
  "AUD/CAD": FOREX,
  "AUD/CHF": FOREX,
  "AUD/JPY": FOREX,
  "NZD/CAD": FOREX,
  "NZD/CHF": FOREX,
  "NZD/JPY": FOREX,
  "CAD/CHF": FOREX,
  "CAD/JPY": FOREX,
  "CHF/JPY": FOREX,
  "LDO/USD": CRYPTO,
  "INJ/USD": CRYPTO,
  "RUNE/USD": CRYPTO,
  "CAKE/USD": CRYPTO,
  "FXS/USD": CRYPTO,
  "TWT/USD": CRYPTO,
  "PEPE/USD": CRYPTO,
  "DYDX/USD": CRYPTO,
  "GMX/USD": CRYPTO,
  "FIL/USD": CRYPTO,
  "APT/USD": CRYPTO,
  "IMX/USD": CRYPTO,
  "VET/USD": CRYPTO,
  "OP/USD": CRYPTO,
  "RNDR/USD": CRYPTO,
  "EGLD/USD": CRYPTO,
  "TIA/USD": CRYPTO,
  "STX/USD": CRYPTO,
  "FLOW/USD": CRYPTO,
  "KAVA/USD": CRYPTO,
  "GALA/USD": CRYPTO,
  "MINA/USD": CRYPTO,
  "ORDI/USD": CRYPTO,
  "ILV/USD": CRYPTO,
  "KLAY/USD": CRYPTO,
  "SUI/USD": CRYPTO,
  "BLUR/USD": CRYPTO,
  "FET/USD": CRYPTO,
  "CFX/USD": CRYPTO,
  "BEAM/USD": CRYPTO,
  "AR/USD": CRYPTO,
  "SEI/USD": CRYPTO,
  "BTT/USD": CRYPTO,
  "ROSE/USD": CRYPTO,
  "WOO/USD": CRYPTO,
  "AGIX/USD": CRYPTO,
  "ZIL/USD": CRYPTO,
  "GMT/USD": CRYPTO,
  "ASTR/USD": CRYPTO,
  "1INCH/USD": CRYPTO,
  "FLOKI/USD": CRYPTO,
  "QTUM/USD": CRYPTO,
  "OCEAN/USD": CRYPTO,
  "WLD/USD": CRYPTO,
  "MASK/USD": CRYPTO,
  "CELO/USD": CRYPTO,
  "LRC/USD": CRYPTO,
  "ENS/USD": CRYPTO,
  "MEME/USD": CRYPTO,
  "ANKR/USD": CRYPTO,
  "IOTX/USD": CRYPTO,
  "ICX/USD": CRYPTO,
  "KSM/USD": CRYPTO,
  "RVN/USD": CRYPTO,
  "ANT/USD": CRYPTO,
  "WAVES/USD": CRYPTO,
  "SKL/USD": CRYPTO,
  "SUPER/USD": CRYPTO,
  "BAL/USD": CRYPTO,
  "WTI/USD": COMMODITIES,
  "XPT/USD": COMMODITIES,
  "XPD/USD": COMMODITIES,
  "HG/USD": COMMODITIES,
  "JUP/USD": CRYPTO,
  "MANTA/USD": CRYPTO,
  "BONK/USD": CRYPTO,
  "PENDLE/USD": CRYPTO,
  "OSMO/USD": CRYPTO,
  "ALT/USD": CRYPTO,
  "UMA/USD": CRYPTO,
  "MAGIC/USD": CRYPTO,
  "API3/USD": CRYPTO,
  "STRK/USD": CRYPTO,
  "DYM/USD": CRYPTO,
  "NTRN/USD": CRYPTO,
  "PYTH/USD": CRYPTO,
  "SC/USD": CRYPTO,
  "WIF/USD": CRYPTO,
  "PIXEL/USD": CRYPTO,
  "JTO/USD": CRYPTO,
  "MAVIA/USD": CRYPTO,
  "MYRO/USD": CRYPTO,
  "STG/USD": CRYPTO,
  "BOME/USD": CRYPTO,
  "ETHFI/USD": CRYPTO,
  "METIS/USD": CRYPTO,
  "AEVO/USD": CRYPTO,
  "ONDO/USD": CRYPTO,
  "MNT/USD": CRYPTO,
  "KAS/USD": CRYPTO,
  "RONIN/USD": CRYPTO,
  "ENA/USD": CRYPTO,
  "W/USD": CRYPTO,
  "ZEUS/USD": CRYPTO,
  "TNSR/USD": CRYPTO,
  "TAO/USD": CRYPTO,
  "OMNI/USD": CRYPTO,
  "PRCL/USD": CRYPTO,
  "MERL/USD": CRYPTO,
};

export const getAssetClassFromGroupIndex = (
  groupIndex: number
): string | undefined => {
  switch (groupIndex) {
    case 0:
      return CRYPTO;
    case 1:
    case 8:
    case 9:
      return FOREX;
    case 2:
    case 3:
    case 4:
      return STOCKS;
    case 5:
      return INDICES;
    case 6:
    case 7:
      return COMMODITIES;
  }
};

export const tickerChanges = {
  FB: { newTicker: "META", date: "06/09/2022" },
};

export const stockSplits = {
  "AMZN_1/USD": { date: "6/6/2022", split: 20 },
  "GOOGL_1/USD": { date: "7/18/2022", split: 20 },
  "GME_1/USD": { date: "7/22/2022", split: 4 },
  "TSLA_1/USD": { date: "8/25/2022", split: 3 },
};

export const delistedPairIxs = new Set([
  6, 31, 36, 42, 45, 48, 51, 54, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 97, 99, 101, 106, 108, 52, 131, 147, 160, 179, 182, 183, 190, 226,
]);

export const delistedGroupsIxs = new Set([6, 7]);
