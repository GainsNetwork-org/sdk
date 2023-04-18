export const pairs = {
  "BTC/USD": "crypto",
  "ETH/USD": "crypto",
  "LINK/USD": "crypto",
  "DOGE/USD": "crypto",
  "MATIC/USD": "crypto",
  "ADA/USD": "crypto",
  "SUSHI/USD": "crypto",
  "AAVE/USD": "crypto",
  "ALGO/USD": "crypto",
  "BAT/USD": "crypto",
  "COMP/USD": "crypto",
  "DOT/USD": "crypto",
  "EOS/USD": "crypto",
  "LTC/USD": "crypto",
  "MANA/USD": "crypto",
  "OMG/USD": "crypto",
  "SNX/USD": "crypto",
  "UNI/USD": "crypto",
  "XLM/USD": "crypto",
  "XRP/USD": "crypto",
  "ZEC/USD": "crypto",
  "EUR/USD": "forex",
  "USD/JPY": "forex",
  "GBP/USD": "forex",
  "USD/CHF": "forex",
  "AUD/USD": "forex",
  "USD/CAD": "forex",
  "NZD/USD": "forex",
  "EUR/CHF": "forex",
  "EUR/JPY": "forex",
  "EUR/GBP": "forex",
  "LUNA/USD": "crypto",
  "YFI/USD": "crypto",
  "SOL/USD": "crypto",
  "XTZ/USD": "crypto",
  "BCH/USD": "crypto",
  "BNT/USD": "crypto",
  "CRV/USD": "crypto",
  "DASH/USD": "crypto",
  "ETC/USD": "crypto",
  "ICP/USD": "crypto",
  "MKR/USD": "crypto",
  "NEO/USD": "crypto",
  "THETA/USD": "crypto",
  "TRX/USD": "crypto",
  "ZRX/USD": "crypto",
  "SAND/USD": "crypto",
  "BNB/USD": "crypto",
  "AXS/USD": "crypto",
  "GRT/USD": "crypto",
  "HBAR/USD": "crypto",
  "XMR/USD": "crypto",
  "ENJ/USD": "crypto",
  "FTM/USD": "crypto",
  "FTT/USD": "crypto",
  "APE/USD": "crypto",
  "CHZ/USD": "crypto",
  "SHIB/USD": "crypto",
  "AAPL/USD": "stocks",
  "FB/USD": "stocks",
  "GOOGL/USD": "stocks",
  "AMZN/USD": "stocks",
  "MSFT/USD": "stocks",
  "TSLA/USD": "stocks",
  "SNAP/USD": "stocks",
  "NVDA/USD": "stocks",
  "V/USD": "stocks",
  "MA/USD": "stocks",
  "PFE/USD": "stocks",
  "KO/USD": "stocks",
  "DIS/USD": "stocks",
  "GME/USD": "stocks",
  "NKE/USD": "stocks",
  "AMD/USD": "stocks",
  "PYPL/USD": "stocks",
  "ABNB/USD": "stocks",
  "BA/USD": "stocks",
  "SBUX/USD": "stocks",
  "WMT/USD": "stocks",
  "INTC/USD": "stocks",
  "MCD/USD": "stocks",
  "META/USD": "stocks",
  "GOOGL_1/USD": "stocks",
  "GME_1/USD": "stocks",
  "AMZN_1/USD": "stocks",
  "TSLA_1/USD": "stocks",
  "SPY/USD": "indices",
  "QQQ/USD": "indices",
  "IWM/USD": "indices",
  "DIA/USD": "indices",
  "XAU/USD": "commodities",
  "XAG/USD": "commodities",
  "USD/CNH": "forex",
  "USD/SGD": "forex",
  "EUR/SEK": "forex",
  "USD/KRW": "forex",
  "EUR/NOK": "forex",
  "USD/INR": "forex",
  "USD/MXN": "forex",
  "USD/TWD": "forex",
  "USD/ZAR": "forex",
  "USD/BRL": "forex",
  "AVAX/USD": "crypto",
  "ATOM/USD": "crypto",
  "NEAR/USD": "crypto",
  "QNT/USD": "crypto",
  "IOTA/USD": "crypto",
  "TON/USD": "crypto",
  "RPL/USD": "crypto",
  "ARB/USD": "crypto",
};

export const getAssetClassFromGroupIndex = (groupIndex: number) => {
  switch (groupIndex) {
    case 0:
      return "crypto";
    case 1:
    case 8:
    case 9:
      return "forex";
    case 2:
    case 3:
    case 4:
      return "stocks";
    case 5:
      return "indices";
    case 6:
    case 7:
      return "commodities";
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

export const defaultSpreadReductionsP100 = [15, 20, 25, 30, 35];
