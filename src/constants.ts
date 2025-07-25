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
  "SAFE/USD": CRYPTO,
  "SAGA/USD": CRYPTO,
  "LL/USD": CRYPTO,
  "MSN/USD": CRYPTO,
  "REZ/USD": CRYPTO,
  "NOT/USD": CRYPTO,
  "IO/USD": CRYPTO,
  "BRETT/USD": CRYPTO,
  "ATH/USD": CRYPTO,
  "ZRO/USD": CRYPTO,
  "ZK/USD": CRYPTO,
  "LISTA/USD": CRYPTO,
  "BLAST/USD": CRYPTO,
  "RATS/USD": CRYPTO,
  "BNX/USD": CRYPTO,
  "PEOPLE/USD": CRYPTO,
  "TURBO/USD": CRYPTO,
  "SATS/USD": CRYPTO,
  "POPCAT/USD": CRYPTO,
  "MOG/USD": CRYPTO,
  "OM/USD": CRYPTO,
  "CORE/USD": CRYPTO,
  "JASMY/USD": CRYPTO,
  "DAR/USD": CRYPTO,
  "MEW/USD": CRYPTO,
  "DEGEN/USD": CRYPTO,
  "SLERF/USD": CRYPTO,
  "UXLINK/USD": CRYPTO,
  "AVAIL/USD": CRYPTO,
  "BANANA/USD": CRYPTO,
  "RARE/USD": CRYPTO,
  "SYS/USD": CRYPTO,
  "NMR/USD": CRYPTO,
  "RSR/USD": CRYPTO,
  "SYN/USD": CRYPTO,
  "AUCTION/USD": CRYPTO,
  "ALICE/USD": CRYPTO,
  "SUN/USD": CRYPTO,
  "TRB/USD": CRYPTO,
  "DOGS/USD": CRYPTO,
  "SSV/USD": CRYPTO,
  "PONKE/USD": CRYPTO,
  "POL/USD": CRYPTO,
  "RDNT/USD": CRYPTO,
  "FLUX/USD": CRYPTO,
  "NEIRO/USD": CRYPTO,
  "SUNDOG/USD": CRYPTO,
  "CAT/USD": CRYPTO,
  "BABYDOGE/USD": CRYPTO,
  "REEF/USD": CRYPTO,
  "CKB/USD": CRYPTO,
  "CATI/USD": CRYPTO,
  "LOOM/USD": CRYPTO,
  "ZETA/USD": CRYPTO,
  "HMSTR/USD": CRYPTO,
  "EIGEN/USD": CRYPTO,
  "POLYX/USD": CRYPTO,
  "MOODENG/USD": CRYPTO,
  "MOTHER/USD": CRYPTO,
  "AERO/USD": CRYPTO,
  "CVC/USD": CRYPTO,
  "NEIROCTO/USD": CRYPTO,
  "ARK/USD": CRYPTO,
  "NPC/USD": CRYPTO,
  "ORBS/USD": CRYPTO,
  "APU/USD": CRYPTO,
  "BSV/USD": CRYPTO,
  "HIPPO/USD": CRYPTO,
  "GOAT/USD": CRYPTO,
  "DOG/USD": CRYPTO,
  "HOT/USD": CRYPTO,
  "STORJ/USD": CRYPTO,
  "RAY/USD": CRYPTO,
  "BTCDEGEN/USD": CRYPTO,
  "PNUT/USD": CRYPTO,
  "ACT/USD": CRYPTO,
  "GRASS/USD": CRYPTO,
  "ZEN/USD": CRYPTO,
  "LUMIA/USD": CRYPTO,
  "ALPH/USD": CRYPTO,
  "VIRTUAL/USD": CRYPTO,
  "SPX/USD": CRYPTO,
  "ACX/USD": CRYPTO,
  "CHILLGUY/USD": CRYPTO,
  "CHEX/USD": CRYPTO,
  "BITCOIN/USD": CRYPTO,
  "ETHDEGEN/USD": CRYPTO,
  "SOLDEGEN/USD": CRYPTO,
  "MOVE/USD": CRYPTO,
  "ME/USD": CRYPTO,
  "COW/USD": CRYPTO,
  "AVA/USD": CRYPTO,
  "USUAL/USD": CRYPTO,
  "PENGU/USD": CRYPTO,
  "FARTCOIN/USD": CRYPTO,
  "ZEREBRO/USD": CRYPTO,
  "AI16Z/USD": CRYPTO,
  "AIXBT/USD": CRYPTO,
  "BIO/USD": CRYPTO,
  "XRPDEGEN/USD": CRYPTO,
  "BNBDEGEN/USD": CRYPTO,
  "TRUMP/USD": CRYPTO,
  "MELANIA/USD": CRYPTO,
  "MODE/USD": CRYPTO,
  "HYPE/USD": CRYPTO,
  "S/USD": CRYPTO,
  "ARC/USD": CRYPTO,
  "ARKM/USD": CRYPTO,
  "GRIFFAIN/USD": CRYPTO,
  "SWARMS/USD": CRYPTO,
  "ANIME/USD": CRYPTO,
  "PLUME/USD": CRYPTO,
  "VVV/USD": CRYPTO,
  "VINE/USD": CRYPTO,
  "TOSHI/USD": CRYPTO,
  "BERA/USD": CRYPTO,
  "LAYER/USD": CRYPTO,
  "CHEEMS/USD": CRYPTO,
  "SOLV/USD": CRYPTO,
  "TST/USD": CRYPTO,
  "IP/USD": CRYPTO,
  "KAITO/USD": CRYPTO,
  "ELX/USD": CRYPTO,
  "PI/USD": CRYPTO,
  "SHELL/USD": CRYPTO,
  "BMT/USD": CRYPTO,
  "BROCCOLI/USD": CRYPTO,
  "TUT/USD": CRYPTO,
  "GPS/USD": CRYPTO,
  "RED/USD": CRYPTO,
  "MUBARAK/USD": CRYPTO,
  "FORM/USD": CRYPTO,
  "WAL/USD": CRYPTO,
  "NIL/USD": CRYPTO,
  "PARTI/USD": CRYPTO,
  "SIREN/USD": CRYPTO,
  "BANANAS31/USD": CRYPTO,
  "HYPER/USD": CRYPTO,
  "PROMPT/USD": CRYPTO,
  "RFC/USD": CRYPTO,
  "WCT/USD": CRYPTO,
  "BIGTIME/USD": CRYPTO,
  "BABY/USD": CRYPTO,
  "COOKIE/USD": CRYPTO,
  "KMNO/USD": CRYPTO,
  "INIT/USD": CRYPTO,
  "SYRUP/USD": CRYPTO,
  "SIGN/USD": CRYPTO,
  "ZORA/USD": CRYPTO,
  "COIN/USD": STOCKS,
  "HOOD/USD": STOCKS,
  "MSTR/USD": STOCKS,
  "NFLX/USD": STOCKS,
  "LAUNCHCOIN/USD": CRYPTO,
  "NXPC/USD": CRYPTO,
  "SOPH/USD": CRYPTO,
  "LPT/USD": CRYPTO,
  "BVIV/USD": CRYPTO,
  "EVIV/USD": CRYPTO,
  "CRCL/USD": STOCKS,
  "RESOLV/USD": CRYPTO,
  "SQD/USD": CRYPTO,
  "TAIKO/USD": CRYPTO,
  "HOME/USD": CRYPTO,
  "B/USD": CRYPTO,
  "HUMA/USD": CRYPTO,
  "SBET/USD": STOCKS,
  "PLTR/USD": STOCKS,
  "BIDU/USD": STOCKS,
  "ROKU/USD": STOCKS,
  "LMT/USD": STOCKS,
  "RIOT/USD": STOCKS,
  "MARA/USD": STOCKS,
  "LOKA/USD": CRYPTO,
  "STO/USD": CRYPTO,
  "FUN/USD": CRYPTO,
  "KNC/USD": CRYPTO,
  "H/USD": CRYPTO,
  "ICNT/USD": CRYPTO,
  "NEWT/USD": CRYPTO,
  "PUMP/USD": CRYPTO,
};

export const syntheticPairs = new Set([
  "BTCDEGEN/USD",
  "ETHDEGEN/USD",
  "SOLDEGEN/USD",
  "XRPDEGEN/USD",
  "BNBDEGEN/USD",
]);
export const parentToSyntheticPairMap = new Map([
  ["BTC/USD", "BTCDEGEN/USD"],
  ["ETH/USD", "ETHDEGEN/USD"],
  ["SOL/USD", "SOLDEGEN/USD"],
  ["XRP/USD", "XRPDEGEN/USD"],
  ["BNB/USD", "BNBDEGEN/USD"],
]);

export const getAssetClassFromGroupIndex = (
  groupIndex: number
): string | undefined => {
  switch (groupIndex) {
    case 0:
    case 10:
    case 11:
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
  4, 6, 12, 15, 20, 24, 25, 27, 28, 30, 31, 36, 48, 51, 52, 53, 54, 56, 59, 60,
  61, 63, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 95, 96, 97, 98,
  99, 101, 106, 111, 113, 114, 116, 118, 120, 122, 123, 125, 127, 130, 147, 152,
  160, 163, 170, 179, 182, 183, 188, 189, 190, 208, 209, 225, 229, 230, 231,
  238, 239, 241, 250, 253, 254, 258, 270, 275, 276, 278, 279, 282, 285, 290,
  294, 296, 305, 311, 330, 349, 352, 353, 354, 355, 357, 365, 366, 395, 396,
]);

export const delistedGroupsIxs = new Set([]);

export const DEFAULT_PROTECTION_CLOSE_FACTOR = 1;

export const DEFAULT_CUMULATIVE_FACTOR = 1;
