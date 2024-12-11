/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Pair,
  Fee,
  OpenInterest,
  PairDepth,
  PairIndex,
} from "../../trade/types";
import { Contracts } from "../../contracts/types";

export const fetchPairs = async (
  contracts: Contracts,
  pairIxs: PairIndex[]
): Promise<Pair[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairs = await Promise.all(
      pairIxs.map(pairIndex => multiCollatContract.pairs(pairIndex))
    );

    return pairs.map((pair, index) => {
      return {
        name: pair.from + "/" + pair.to,
        from: pair.from,
        to: pair.to,
        feeIndex: parseInt(pair.feeIndex.toString()),
        groupIndex: parseInt(pair.groupIndex.toString()),
        pairIndex: pairIxs[index],
        spreadP: parseFloat(pair.spreadP.toString()) / 1e12,
        description: getPairDescription(pairIxs[index]),
      } as Pair;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchPairDepths = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<PairDepth[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairParams = await multiCollatContract.getPairDepths(pairIxs);

    return pairParams.map(pair => {
      return {
        onePercentDepthAboveUsd: parseFloat(
          pair.onePercentDepthAboveUsd.toString()
        ),
        onePercentDepthBelowUsd: parseFloat(
          pair.onePercentDepthBelowUsd.toString()
        ),
      } as PairDepth;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchFees = async (
  contracts: Contracts,
  feeIxs: PairIndex[]
): Promise<Fee[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const fees = await Promise.all(
      feeIxs.map(pairIndex => multiCollatContract.fees(pairIndex))
    );

    return fees.map(fee => {
      return {
        totalPositionSizeFeeP:
          parseFloat(fee.totalPositionSizeFeeP.toString()) / 1e12,
        totalLiqCollateralFeeP:
          parseFloat(fee.totalLiqCollateralFeeP.toString()) / 1e12,
        oraclePositionSizeFeeP:
          parseFloat(fee.oraclePositionSizeFeeP.toString()) / 1e12,
        minPositionSizeUsd: parseFloat(fee.minPositionSizeUsd.toString()) / 1e3,
      } as Fee;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);
    throw error;
  }
};

export const fetchOpenInterest = async (
  contracts: Contracts,
  collateralIndex: number,
  pairIxs: number[]
): Promise<OpenInterest[]> => {
  if (pairIxs.length === 0) {
    return [];
  }

  const openInterests = (
    await contracts.gnsMultiCollatDiamond.getAllBorrowingPairs(collateralIndex)
  )[1];

  return pairIxs.map(pairIndex => {
    const openInterest = openInterests[pairIndex];

    if (!openInterest) {
      return { long: 0, short: 0, max: 0 };
    }

    return {
      long: parseFloat(openInterest[0].toString()) / 1e10,
      short: parseFloat(openInterest[1].toString()) / 1e10,
      max: parseFloat(openInterest[2].toString()) / 1e10,
    };
  });
};

export const getPairDescription = (pairIndex: PairIndex): string => {
  return PAIR_INDEX_TO_DESCRIPTION[pairIndex] || "";
};

const PAIR_INDEX_TO_DESCRIPTION: { [key in PairIndex]: string } = {
  [PairIndex.BTCUSD]: "Bitcoin to US Dollar",
  [PairIndex.ETHUSD]: "Ethereum to US Dollar",
  [PairIndex.LINKUSD]: "Chainlink to US Dollar",
  [PairIndex.DOGEUSD]: "Dogecoin to US Dollar",
  [PairIndex.MATICUSD]: "Polygon to US Dollar",
  [PairIndex.ADAUSD]: "Cardano to US Dollar",
  [PairIndex.SUSHIUSD]: "Sushiswap to US Dollar",
  [PairIndex.AAVEUSD]: "Aave to US Dollar",
  [PairIndex.ALGOUSD]: "Algorand to US Dollar",
  [PairIndex.BATUSD]: "Basic Attention Token to US Dollar",
  [PairIndex.COMPUSD]: "Compound to US Dollar",
  [PairIndex.DOTUSD]: "Polkadot to US Dollar",
  [PairIndex.EOSUSD]: "EOS to US Dollar",
  [PairIndex.LTCUSD]: "Litecoin to US Dollar",
  [PairIndex.MANAUSD]: "Decentraland to US Dollar",
  [PairIndex.OMGUSD]: "OMG Network to US Dollar",
  [PairIndex.SNXUSD]: "Synthetix to US Dollar",
  [PairIndex.UNIUSD]: "Uniswap to US Dollar",
  [PairIndex.XLMUSD]: "Stellar to US Dollar",
  [PairIndex.XRPUSD]: "Ripple to US Dollar",
  [PairIndex.ZECUSD]: "Zcash to US Dollar",
  [PairIndex.EURUSD]: "Euro to US Dollar",
  [PairIndex.USDJPY]: "US Dollar to Japanese Yen",
  [PairIndex.GBPUSD]: "British Pound to US Dollar",
  [PairIndex.USDCHF]: "US Dollar to Swiss Franc",
  [PairIndex.AUDUSD]: "Australian Dollar to US Dollar",
  [PairIndex.USDCAD]: "US Dollar to Canadian Dollar",
  [PairIndex.NZDUSD]: "New Zealand Dollar to US Dollar",
  [PairIndex.EURCHF]: "Euro to Swiss Franc",
  [PairIndex.EURJPY]: "Euro to Japanese Yen",
  [PairIndex.EURGBP]: "Euro to British Pound",
  [PairIndex.LUNAUSD]: "Terra to US Dollar",
  [PairIndex.YFIUSD]: "Yearn.finance to US Dollar",
  [PairIndex.SOLUSD]: "Solana to US Dollar",
  [PairIndex.XTZUSD]: "Tezos to US Dollar",
  [PairIndex.BCHUSD]: "Bitcoin Cash to US Dollar",
  [PairIndex.BNTUSD]: "Bancor to US Dollar",
  [PairIndex.CRVUSD]: "Curve DAO Token to US Dollar",
  [PairIndex.DASHUSD]: "Dash to US Dollar",
  [PairIndex.ETCUSD]: "Ethereum Classic to US Dollar",
  [PairIndex.ICPUSD]: "Internet Computer to US Dollar",
  [PairIndex.MKRUSD]: "Maker to US Dollar",
  [PairIndex.NEOUSD]: "NEO to US Dollar",
  [PairIndex.THETAUSD]: "Theta Network to US Dollar",
  [PairIndex.TRXUSD]: "TRON to US Dollar",
  [PairIndex.ZRXUSD]: "0x to US Dollar",
  [PairIndex.SANDUSD]: "The Sandbox to US Dollar",
  [PairIndex.BNBUSD]: "Binance Coin to US Dollar",
  [PairIndex.AXSUSD]: "Axie Infinity to US Dollar",
  [PairIndex.GRTUSD]: "The Graph to US Dollar",
  [PairIndex.HBARUSD]: "Hedera Hashgraph to US Dollar",
  [PairIndex.XMRUSD]: "Monero to US Dollar",
  [PairIndex.ENJUSD]: "Enjin Coin to US Dollar",
  [PairIndex.FTMUSD]: "Fantom to US Dollar",
  [PairIndex.FTTUSD]: "FTX Token to US Dollar",
  [PairIndex.APEUSD]: "ApeCoin to US Dollar",
  [PairIndex.CHZUSD]: "Chiliz to US Dollar",
  [PairIndex.SHIBUSD]: "Shiba Inu to US Dollar",
  [PairIndex.AAPLUSD]: "Apple to US Dollar",
  [PairIndex.FBUSD]: "Facebook to US Dollar",
  [PairIndex.GOOGLUSD]: "Google to US Dollar",
  [PairIndex.AMZNUSD]: "Amazon to US Dollar",
  [PairIndex.MSFTUSD]: "Microsoft to US Dollar",
  [PairIndex.TSLAUSD]: "Tesla to US Dollar",
  [PairIndex.SNAPUSD]: "Snapchat to US Dollar",
  [PairIndex.NVDAUSD]: "Nvidia to US Dollar",
  [PairIndex.VUSD]: "Visa to US Dollar",
  [PairIndex.MAUSD]: "Mastercard to US Dollar",
  [PairIndex.PFEUSD]: "Pfizer to US Dollar",
  [PairIndex.KOUSD]: "Coca-Cola to US Dollar",
  [PairIndex.DISUSD]: "Disney to US Dollar",
  [PairIndex.GMEUSD]: "GameStop to US Dollar",
  [PairIndex.NKEUSD]: "Nike to US Dollar",
  [PairIndex.AMDUSD]: "AMD to US Dollar",
  [PairIndex.PYPLUSD]: "PayPal to US Dollar",
  [PairIndex.ABNBUSD]: "Airbnb to US Dollar",
  [PairIndex.BAUSD]: "Boeing to US Dollar",
  [PairIndex.SBUXUSD]: "Starbucks to US Dollar",
  [PairIndex.WMTUSD]: "Walmart to US Dollar",
  [PairIndex.INTCUSD]: "Intel to US Dollar",
  [PairIndex.MCDUSD]: "McDonald's to US Dollar",
  [PairIndex.METAUSD]: "Meta Platforms to US Dollar",
  [PairIndex.GOOGLUSD2]: "Google to US Dollar",
  [PairIndex.GMEUSD2]: "GameStop to US Dollar",
  [PairIndex.AMZNUSD2]: "Amazon to US Dollar",
  [PairIndex.TSLAUSD2]: "Tesla to US Dollar",
  [PairIndex.SPYUSD]: "SPDR S&P 500 ETF Trust to US Dollar",
  [PairIndex.QQQUSD]: "Invesco QQQ Trust to US Dollar",
  [PairIndex.IWMUSD]: "iShares Russell 2000 ETF to US Dollar",
  [PairIndex.DIAUSD]:
    "SPDR Dow Jones Industrial Average ETF Trust to US Dollar",
  [PairIndex.XAUUSD]: "Gold to US Dollar",
  [PairIndex.XAGUSD]: "Silver to US Dollar",
  [PairIndex.USDCNH]: "US Dollar to Chinese Yuan Offshore",
  [PairIndex.USDSGD]: "US Dollar to Singapore Dollar",
  [PairIndex.EURSEK]: "Euro to Swedish Krona",
  [PairIndex.USDKRW]: "US Dollar to South Korean Won",
  [PairIndex.EURNOK]: "Euro to Norwegian Krone",
  [PairIndex.USDINR]: "US Dollar to Indian Rupee",
  [PairIndex.USDMXN]: "US Dollar to Mexican Peso",
  [PairIndex.USDTWD]: "US Dollar to Taiwan New Dollar",
  [PairIndex.USDZAR]: "US Dollar to South African Rand",
  [PairIndex.USDBRL]: "US Dollar to Brazilian Real",
  [PairIndex.AVAXUSD]: "Avalanche to US Dollar",
  [PairIndex.ATOMUSD]: "Cosmos to US Dollar",
  [PairIndex.NEARUSD]: "NEAR Protocol to US Dollar",
  [PairIndex.QNTUSD]: "Quant to US Dollar",
  [PairIndex.IOTAUSD]: "IOTA to US Dollar",
  [PairIndex.TONUSD]: "The Open Network to US Dollar",
  [PairIndex.RPLUSD]: "Rocket Pool to US Dollar",
  [PairIndex.ARBUSD]: "Arbitrum to US Dollar",
  [PairIndex.EURAUD]: "Euro to Australian Dollar",
  [PairIndex.EURNZD]: "Euro to New Zealand Dollar",
  [PairIndex.EURCAD]: "Euro to Canadian Dollar",
  [PairIndex.GBPAUD]: "British Pound to Australian Dollar",
  [PairIndex.GBPNZD]: "British Pound to New Zealand Dollar",
  [PairIndex.GBPCAD]: "British Pound to Canadian Dollar",
  [PairIndex.GBPCHF]: "British Pound to Swiss Franc",
  [PairIndex.GBPJPY]: "British Pound to Japanese Yen",
  [PairIndex.AUDNZD]: "Australian Dollar to New Zealand Dollar",
  [PairIndex.AUDCAD]: "Australian Dollar to Canadian Dollar",
  [PairIndex.AUDCHF]: "Australian Dollar to Swiss Franc",
  [PairIndex.AUDJPY]: "Australian Dollar to Japanese Yen",
  [PairIndex.NZDCAD]: "New Zealand Dollar to Canadian Dollar",
  [PairIndex.NZDCHF]: "New Zealand Dollar to Swiss Franc",
  [PairIndex.NZDJPY]: "New Zealand Dollar to Japanese Yen",
  [PairIndex.CADCHF]: "Canadian Dollar to Swiss Franc",
  [PairIndex.CADJPY]: "Canadian Dollar to Japanese Yen",
  [PairIndex.CHFJPY]: "Swiss Franc to Japanese Yen",
  [PairIndex.LDOUSD]: "Lido DAO to US Dollar",
  [PairIndex.INJUSD]: "Injective Protocol to US Dollar",
  [PairIndex.RUNEUSD]: "THORChain to US Dollar",
  [PairIndex.CAKEUSD]: "PancakeSwap to US Dollar",
  [PairIndex.FXSUSD]: "Frax Share to US Dollar",
  [PairIndex.TWTUSD]: "Trust Wallet Token to US Dollar",
  [PairIndex.PEPEUSD]: "Pepe to US Dollar",
  [PairIndex.DYDXUSD]: "dYdX to US Dollar",
  [PairIndex.GMXUSD]: "GMX to US Dollar",
  [PairIndex.FILUSD]: "Filecoin to US Dollar",
  [PairIndex.APTUSD]: "Aptos to US Dollar",
  [PairIndex.IMXUSD]: "Immutable X to US Dollar",
  [PairIndex.VETUSD]: "VeChain to US Dollar",
  [PairIndex.OPUSD]: "Optimism to US Dollar",
  [PairIndex.RNDRUSD]: "Render Token to US Dollar",
  [PairIndex.EGLDUSD]: "Elrond to US Dollar",
  [PairIndex.TIAUSD]: "Tia to US Dollar",
  [PairIndex.STXUSD]: "Stacks to US Dollar",
  [PairIndex.FLOWUSD]: "Flow to US Dollar",
  [PairIndex.KAVAUSD]: "Kava to US Dollar",
  [PairIndex.GALAUSD]: "Gala to US Dollar",
  [PairIndex.MINAUSD]: "Mina to US Dollar",
  [PairIndex.ORDIUSD]: "Ordi to US Dollar",
  [PairIndex.ILVUSD]: "Illuvium to US Dollar",
  [PairIndex.KLAYUSD]: "Klaytn to US Dollar",
  [PairIndex.SUIUSD]: "Sui to US Dollar",
  [PairIndex.BLURUSD]: "Blur to US Dollar",
  [PairIndex.FETUSD]: "Fetch.ai to US Dollar",
  [PairIndex.CFXUSD]: "Conflux to US Dollar",
  [PairIndex.BEAMUSD]: "Beam to US Dollar",
  [PairIndex.ARUSD]: "Arweave to US Dollar",
  [PairIndex.SEIUSD]: "Sei to US Dollar",
  [PairIndex.BTTUSD]: "BitTorrent to US Dollar",
  [PairIndex.ROSEUSD]: "Oasis Network to US Dollar",
  [PairIndex.WOOUSD]: "WOO Network to US Dollar",
  [PairIndex.AGIXUSD]: "SingularityNET to US Dollar",
  [PairIndex.ZILUSD]: "Zilliqa to US Dollar",
  [PairIndex.GMTUSD]: "STEPN to US Dollar",
  [PairIndex.ASTRUSD]: "Astar to US Dollar",
  [PairIndex.ONEINCHUSD]: "1inch to US Dollar",
  [PairIndex.FLOKIUSD]: "Floki Inu to US Dollar",
  [PairIndex.QTUMUSD]: "Qtum to US Dollar",
  [PairIndex.OCEANUSD]: "Ocean Protocol to US Dollar",
  [PairIndex.WLDUSD]: "Worldcoin to US Dollar",
  [PairIndex.MASKUSD]: "Mask Network to US Dollar",
  [PairIndex.CELOUSD]: "Celo to US Dollar",
  [PairIndex.LRCUSD]: "Loopring to US Dollar",
  [PairIndex.ENSUSD]: "Ethereum Name Service to US Dollar",
  [PairIndex.MEMEUSD]: "Meme to US Dollar",
  [PairIndex.ANKRUSD]: "Ankr to US Dollar",
  [PairIndex.IOTXUSD]: "IoTeX to US Dollar",
  [PairIndex.ICXUSD]: "ICON to US Dollar",
  [PairIndex.KSMUSD]: "Kusama to US Dollar",
  [PairIndex.RVNUSD]: "Ravencoin to US Dollar",
  [PairIndex.ANTUSD]: "Aragon to US Dollar",
  [PairIndex.WAVESUSD]: "Waves to US Dollar",
  [PairIndex.SKLUSD]: "SKALE to US Dollar",
  [PairIndex.SUPERUSD]: "SuperVerse to US Dollar",
  [PairIndex.BALUSD]: "Balancer to US Dollar",
  [PairIndex.WTIUSD]: "Oil to US Dollar",
  [PairIndex.XPTUSD]: "Platinum to US Dollar",
  [PairIndex.XPDUSD]: "Palladium to US Dollar",
  [PairIndex.HGUSD]: "Copper to US Dollar",
  [PairIndex.JUPUSD]: "Jupiter to US Dollar",
  [PairIndex.MANTAUSD]: "Manta to US Dollar",
  [PairIndex.BONKUSD]: "Bonk to US Dollar",
  [PairIndex.PENDLEUSD]: "Pendle to US Dollar",
  [PairIndex.OSMOUSD]: "Osmosis to US Dollar",
  [PairIndex.ALTUSD]: "AltLayer to US Dollar",
  [PairIndex.UMAUSD]: "UMA to US Dollar",
  [PairIndex.MAGICUSD]: "Magic to US Dollar",
  [PairIndex.API3USD]: "API3 to US Dollar",
  [PairIndex.STRKUSD]: "Starknet to US Dollar",
  [PairIndex.DYMUSD]: "Dymension to US Dollar",
  [PairIndex.NTRNUSD]: "Neutron to US Dollar",
  [PairIndex.PYTHUSD]: "Pyth Network to US Dollar",
  [PairIndex.SCUSD]: "Siacoin to US Dollar",
  [PairIndex.WIFUSD]: "dogwifhat to US Dollar",
  [PairIndex.PIXELUSD]: "Pixels to US Dollar",
  [PairIndex.JTOUSD]: "Jito to US Dollar",
  [PairIndex.MAVIAUSD]: "Heroes of Mavia to US Dollar",
  [PairIndex.MYROUSD]: "Myro to US Dollar",
  [PairIndex.STGUSD]: "Stargate to US Dollar",
  [PairIndex.BOMEUSD]: "Book Of Meme to US Dollar",
  [PairIndex.ETHFIUSD]: "EtherFi to US Dollar",
  [PairIndex.METISUSD]: "Metis to US Dollar",
  [PairIndex.AEVOUSD]: "Aevo to US Dollar",
  [PairIndex.ONDOUSD]: "Ondo to US Dollar",
  [PairIndex.MNTUSD]: "Mantle to US Dollar",
  [PairIndex.KASUSD]: "Kaspa to US Dollar",
  [PairIndex.RONINUSD]: "Ronin to US Dollar",
  [PairIndex.ENAUSD]: "Ethena to US Dollar",
  [PairIndex.WUSD]: "Wormhole to US Dollar",
  [PairIndex.ZEUSUSD]: "Zeus to US Dollar",
  [PairIndex.TNSRUSD]: "Tensor to US Dollar",
  [PairIndex.TAOUSD]: "Bittensor to US Dollar",
  [PairIndex.OMNIUSD]: "Omni Network to US Dollar",
  [PairIndex.PRCLUSD]: "Parcl to US Dollar",
  [PairIndex.MERLUSD]: "Merlin Chain to US Dollar",
  [PairIndex.SAFEUSD]: "Safe to US Dollar",
  [PairIndex.SAGAUSD]: "Saga to US Dollar",
  [PairIndex.LLUSD]: "Light Link to US Dollar",
  [PairIndex.MSNUSD]: "Meson Network to US Dollar",
  [PairIndex.REZUSD]: "Renzo to US Dollar",
  [PairIndex.NOTUSD]: "Notcoin to US Dollar",
  [PairIndex.IOUSD]: "Ionet to US Dollar",
  [PairIndex.BRETTUSD]: "Brett to US Dollar",
  [PairIndex.ATHUSD]: "Aethir to US Dollar",
  [PairIndex.ZROUSD]: "LayerZero to US Dollar",
  [PairIndex.ZKUSD]: "ZKsync to US Dollar",
  [PairIndex.LISTAUSD]: "Lista DAO to US Dollar",
  [PairIndex.BLASTUSD]: "Blast to US Dollar",
  [PairIndex.RATSUSD]: "Rats to US Dollar",
  [PairIndex.BNXUSD]: "BinaryX to US Dollar",
  [PairIndex.PEOPLEUSD]: "Constitution DAO to US Dollar",
  [PairIndex.TURBOUSD]: "Turbo to US Dollar",
  [PairIndex.SATSUSD]: "SATS Ordinals to US Dollar",
  [PairIndex.POPCATUSD]: "Popcat to US Dollar",
  [PairIndex.MOGUSD]: "Mog Coin to US Dollar",
  [PairIndex.OMUSD]: "Mantra Chain to US Dollar",
  [PairIndex.COREUSD]: "Core to US Dollar",
  [PairIndex.JASMYUSD]: "Jasmy Coin to US Dollar",
  [PairIndex.DARUSD]: "Mines of Dalarnia to US Dollar",
  [PairIndex.MEWUSD]: "cat in a dogs world to US Dollar",
  [PairIndex.DEGENUSD]: "Degen to US Dollar",
  [PairIndex.SLERFUSD]: "Slerf to US Dollar",
  [PairIndex.UXLINKUSD]: "UXLINK to US Dollar",
  [PairIndex.AVAILUSD]: "Avail to US Dollar",
  [PairIndex.BANANAUSD]: "Banana Gun to US Dollar",
  [PairIndex.RAREUSD]: "SuperRare to US Dollar",
  [PairIndex.SYSUSD]: "Syscoin to US Dollar",
  [PairIndex.NMRUSD]: "Numeraire to US Dollar",
  [PairIndex.RSRUSD]: "Reserve Rights to US Dollar",
  [PairIndex.SYNUSD]: "Synapse to US Dollar",
  [PairIndex.AUCTIONUSD]: "Bounce to US Dollar",
  [PairIndex.ALICEUSD]: "My Neighbor Alice to US Dollar",
  [PairIndex.SUNUSD]: "Sun to US Dollar",
  [PairIndex.TRBUSD]: "Tellor tributes to US Dollar",
  [PairIndex.DOGSUSD]: "DOGS to US Dollar",
  [PairIndex.SSVUSD]: "ssv.network to US Dollar",
  [PairIndex.PONKEUSD]: "Ponke to US Dollar",
  [PairIndex.POLUSD]: "POL (ex-MATIC) to US Dollar",
  [PairIndex.RDNTUSD]: "Radiant Capital to US Dollar",
  [PairIndex.FLUXUSD]: "Flux to US Dollar",
  [PairIndex.NEIROUSD]: "Neiro on ETH to US Dollar",
  [PairIndex.SUNDOGUSD]: "Sundog to US Dollar",
  [PairIndex.CATUSD]: "Simon's Cat to US Dollar",
  [PairIndex.BABYDOGEUSD]: "Baby Doge Coin to US Dollar",
  [PairIndex.REEFUSD]: "Reef to US Dollar",
  [PairIndex.CKBUSD]: "Nervos Network to US Dollar",
  [PairIndex.CATIUSD]: "Catizen to US Dollar",
  [PairIndex.LOOMUSD]: "Loom Network to US Dollar",
  [PairIndex.ZETAUSD]: "ZetaChain to US Dollar",
  [PairIndex.HMSTRUSD]: "Hamster Kombat to US Dollar",
  [PairIndex.EIGENUSD]: "EigenLayer to US Dollar",
  [PairIndex.POLYXUSD]: "Polymesh to US Dollar",
  [PairIndex.MOODENGUSD]: "Moo Deng to US Dollar",
  [PairIndex.MOTHERUSD]: "Mother Iggy to US Dollar",
  [PairIndex.AEROUSD]: "Aerodrome Finance to US Dollar",
  [PairIndex.CVCUSD]: "Civic to US Dollar",
  [PairIndex.NEIROCTOUSD]: "Neiro CTO to US Dollar",
  [PairIndex.ARKUSD]: "Ark to US Dollar",
  [PairIndex.NPCUSD]: "Non-Playable Coin to US Dollar",
  [PairIndex.ORBSUSD]: "ORBS to US Dollar",
  [PairIndex.APUUSD]: "Apu Apustaja to US Dollar",
  [PairIndex.BSVUSD]: "Bitcoin SV to US Dollar",
  [PairIndex.HIPPOUSD]: "sudeng to US Dollar",
  [PairIndex.GOATUSD]: "Goatseus Maximus to US Dollar",
  [PairIndex.DOGUSD]: "DOG GO TO THE MOON (Runes) to US Dollar",
  [PairIndex.HOTUSD]: "Holo to US Dollar",
  [PairIndex.STORJUSD]: "Storj to US Dollar",
  [PairIndex.RAYUSD]: "Raydium to US Dollar",
  [PairIndex.BTCDEGEN]: "Bitcoin to US Dollar",
  [PairIndex.PNUTUSD]: "Peanut the Squirrel to US Dollar",
  [PairIndex.ACTUSD]: "The AI Prophecy to US Dollar",
  [PairIndex.GRASSUSD]: "Grass to US Dollar",
  [PairIndex.ZENUSD]: "Horizen to US Dollar",
  [PairIndex.LUMIAUSD]: "Lumia to US Dollar",
  [PairIndex.ALPHUSD]: "Alephium to US Dollar",
  [PairIndex.VIRTUALUSD]: "Virtuals Protocol to US Dollar",
  [PairIndex.SPXUSD]: "SPX6900 to US Dollar",
  [PairIndex.ACXUSD]: "Across Protocol to US Dollar",
  [PairIndex.CHILLGUYUSD]: "Just a chill guy to US Dollar",
  [PairIndex.CHEXUSD]: "CHEX to US Dollar",
  [PairIndex.BITCOINUSD]: "HarryPotterObamaSonic10Inu to US Dollar",
  [PairIndex.ETHDEGEN]: "Ethereum to US Dollar",
  [PairIndex.SOLDEGEN]: "Solana to US Dollar",
};
