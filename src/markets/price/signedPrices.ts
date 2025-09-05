/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ChainId } from "../../contracts/types";
import { Oracle, SignedPricesResponse } from "./types";
import { PendingOrderType } from "../../trade";

// @dev Fetch market signed prices from oracles
export interface FetchSignedPricesInput {
  oracles: Oracle[];
  pairs: number[];
  chain: number;
  minAnswer?: number;
  timeoutMs?: number;
}
export const fetchSignedPrices = async (
  input: FetchSignedPricesInput
): Promise<SignedPricesResponse[] | null> => {
  const { minAnswers, timeoutMs, oracles, chain } = {
    minAnswers: input.chain === ChainId.ARBITRUM_SEPOLIA ? 2 : 3,
    timeoutMs: 1000,
    ...input,
  };

  if (!isValidSignedPricesChain(chain))
    throw new Error(`Invalid chain ${chain}`);

  const { valid, pairs } = validateSignedPricesPairs(input.pairs);
  if (!valid) throw new Error(`Invalid pairs array`);

  return await initiateSignedPricesRequest(
    oracles,
    "signPrices",
    JSON.stringify({ pairs, chain }),
    minAnswers,
    timeoutMs
  );
};

// @dev Fetch lookback signed prices from oracles
export interface FetchSignedLookbackPricesInput {
  oracles: Oracle[];
  trader: string;
  tradeIndex: number;
  pair: number;
  orderType: PendingOrderType;
  currentBlock: number;
  fromBlock: number;
  chain: number;
  minAnswer?: number;
  timeoutMs?: number;
}
export const fetchSignedLookbackPrices = async (
  input: FetchSignedLookbackPricesInput
): Promise<SignedPricesResponse[] | null> => {
  const {
    minAnswers,
    timeoutMs,
    oracles,
    trader,
    tradeIndex,
    pair,
    orderType,
    currentBlock,
    fromBlock,
    chain,
  } = {
    minAnswers: input.chain === ChainId.ARBITRUM_SEPOLIA ? 2 : 3,
    timeoutMs: 6000,
    ...input,
  };

  if (!isValidSignedPricesChain(chain))
    throw new Error(`Invalid chain ${chain}`);

  if (!isValidSignedPricesOrderType(orderType))
    throw new Error(`Invalid orderType ${orderType}`);

  if (isNaN(pair)) throw new Error(`Invalid pair ${pair}`);

  if (isNaN(tradeIndex) || tradeIndex < 0)
    throw new Error(`Invalid tradeIndex ${tradeIndex}`);

  if (!currentBlock || !fromBlock) throw new Error(`Invalid block numbers`);

  return await initiateSignedPricesRequest(
    oracles,
    "signLookbackPrices",
    JSON.stringify({
      trader,
      tradeIndex,
      pair,
      orderType,
      currentBlock,
      fromBlock,
      chain,
    }),
    minAnswers,
    timeoutMs
  );
};

// Retry logic for handling transient failures
export interface RetryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  backoffMultiplier?: number;
}

// Helper to determine if an error is likely transient
const isTransientError = (error: unknown): boolean => {
  const message =
    (error instanceof Error ? error.message : String(error))?.toLowerCase() ||
    "";
  return (
    message.includes("timeout") ||
    message.includes("aborted") ||
    message.includes("not enough valid signed prices") ||
    message.includes("network") ||
    message.includes("fetch failed")
  );
};

// Fetch signed prices with retry logic for transient failures
export const fetchSignedPricesWithRetry = async (
  input: FetchSignedPricesInput,
  retryOptions?: RetryOptions
): Promise<SignedPricesResponse[] | null> => {
  const {
    maxRetries = 2,
    retryDelayMs = 500,
    backoffMultiplier = 1.5,
  } = retryOptions || {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchSignedPrices(input);
    } catch (error: any) {
      lastError = error;

      // Don't retry non-transient errors or if we're out of retries
      if (attempt === maxRetries || !isTransientError(error)) {
        throw error;
      }

      // Wait with exponential backoff before retry
      const delay = Math.floor(
        retryDelayMs * Math.pow(backoffMultiplier, attempt)
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Fetch lookback prices with retry logic
export const fetchSignedLookbackPricesWithRetry = async (
  input: FetchSignedLookbackPricesInput,
  retryOptions?: RetryOptions
): Promise<SignedPricesResponse[] | null> => {
  const {
    maxRetries = 2,
    retryDelayMs = 1000,
    backoffMultiplier = 2,
  } = retryOptions || {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchSignedLookbackPrices(input);
    } catch (error: any) {
      lastError = error;

      // Don't retry non-transient errors or if we're out of retries
      if (attempt === maxRetries || !isTransientError(error)) {
        throw error;
      }

      // Wait with exponential backoff before retry
      const delay = Math.floor(
        retryDelayMs * Math.pow(backoffMultiplier, attempt)
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// @todo optional filtering to minAnswers best responses
const initiateSignedPricesRequest = async (
  oracles: Oracle[],
  request: string,
  requestBody: string,
  minAnswers: number,
  timeoutMs: number
): Promise<SignedPricesResponse[] | null> => {
  try {
    // Fetch signed prices from all oracles in parallel
    const signedPrices: PromiseSettledResult<SignedPricesResponse | null>[] =
      await Promise.allSettled(
        oracles.map(oracle =>
          _getSignedPricesFromSigner(
            `${oracle.url}/${request}`,
            requestBody,
            oracle?.key,
            timeoutMs
          )
        )
      );

    // Filter out failed requests and null responses, then sort by signerId
    const successfulResponses = (
      signedPrices.filter(
        res => res.status === "fulfilled" && res.value !== null // Filter out failed or null responses
      ) as PromiseFulfilledResult<SignedPricesResponse>[]
    )
      // Extract `value`
      .map((res: PromiseFulfilledResult<SignedPricesResponse>) => res.value)
      // Sort by signerId, contracts expect signerId ascending
      .sort((a, b) => a.signedData.signerId - b.signedData.signerId);

    // Ensure we have at least `minAnswers` valid responses
    if (successfulResponses.length < minAnswers) {
      throw new Error(
        `Not enough valid signed prices. Wanted ${minAnswers} but got ${successfulResponses.length}`
      );
    }

    return successfulResponses;
  } catch (e) {
    console.error("Error processing signed prices", e);
    throw e;
  }
};

const _getSignedPricesFromSigner = async (
  url: string,
  requestBody: string,
  authKey?: string,
  timeoutMs?: number
): Promise<SignedPricesResponse | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs || 2000);

    const response = await fetch(`${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": authKey || "",
      } as HeadersInit,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch signed prices from ${url}: ${response.statusText}`
      );
    }

    return (await response.json()) as SignedPricesResponse;
  } catch (error: any) {
    console.error(`Error fetching signed prices from ${url}:`, {
      error: error?.message,
    });
    return null;
  }
};

export const validateSignedPricesPairs = (pairs: number[]) => {
  if (!Array.isArray(pairs) || pairs?.length === 0 || pairs.some(p => isNaN(p)))
    return { valid: false, pairs: [] };

  // Pairs must always be in ascending order
  return { valid: true, pairs: [...new Set(pairs)].sort((a, b) => a - b) };
};

export const isValidSignedPricesChain = (chainId: number): boolean => {
  return (
    !isNaN(chainId) &&
    [
      ChainId.POLYGON,
      ChainId.BASE,
      ChainId.ARBITRUM,
      ChainId.ARBITRUM_SEPOLIA,
      ChainId.APECHAIN,
    ].includes(chainId)
  );
};

export const isValidSignedPricesOrderType = (orderType: PendingOrderType) => {
  return (
    !isNaN(orderType) &&
    [
      PendingOrderType.LIMIT_OPEN,
      PendingOrderType.STOP_OPEN,
      PendingOrderType.TP_CLOSE,
      PendingOrderType.SL_CLOSE,
      PendingOrderType.LIQ_CLOSE,
    ].includes(orderType)
  );
};
