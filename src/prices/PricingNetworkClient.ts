/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import WebSocket from "ws";
import { pairs } from "..";

export class PricingNetworkClient {
  private endpoints: string[];
  private _onPriceMessage: (prices: number[]) => void | null;
  private concurrentConnections: number;
  private bufferTimeoutMs: number;
  private reconnectTimeoutMs: number;

  private sockets: Map<string, WebSocket>;
  private latencyMap: Map<string, number>;
  private priceBuffer: Map<number, number[]>;
  private priceBufferLastFlush: Map<number, number>;
  private stagedPrices: number[];
  private pairsToIndex: Map<string, number>;

  constructor(
    endpoints: string[],
    onPriceMessage: (prices: number[]) => void,
    concurrentConnections = 3,
    bufferTimeoutMs = 500,
    reconnectTimeoutMs = 1000
  ) {
    this.endpoints = endpoints;
    this._onPriceMessage = onPriceMessage;
    this.concurrentConnections = concurrentConnections;
    this.bufferTimeoutMs = bufferTimeoutMs;
    this.reconnectTimeoutMs = reconnectTimeoutMs;

    this.sockets = new Map();
    this.latencyMap = new Map();
    this.priceBuffer = new Map();
    this.priceBufferLastFlush = new Map();
    this.stagedPrices = [];

    this.pairsToIndex = new Map();
    Object.keys(pairs).forEach((pair, index) => {
      this.pairsToIndex.set(pair, index);
    });
  }

  public async connect(): Promise<void> {
    if (this.sockets.size > 0) {
      return;
    }

    const latencies = await Promise.all(
      this.endpoints.map(endpoint => this.measureLatency(endpoint))
    );
    this.endpoints.forEach((endpoint, index) =>
      this.latencyMap.set(endpoint, latencies[index])
    );
    this.latencyMap.forEach((latency, endpoint) =>
      console.log(`Latency to ${endpoint}: ${latency}ms`)
    );
    // Sort endpoints by latency
    const sortedEndpoints = [...this.endpoints].sort((a, b) => {
      const aLatency = latencies[this.endpoints.indexOf(a)];
      const bLatency = latencies[this.endpoints.indexOf(b)];
      return aLatency - bLatency;
    });

    for (let i = 0; i < this.concurrentConnections; i++) {
      if (sortedEndpoints[i]) this._connect(sortedEndpoints[i]);
    }

    // Backstop to flush the buffer in case we don't get any messages
    setInterval(() => {
      const now = Date.now();
      this.priceBuffer.forEach((buffer, pair) => {
        const lastFlush = this.priceBufferLastFlush.get(pair);
        if (
          buffer.length > 0 &&
          lastFlush &&
          now - lastFlush > this.bufferTimeoutMs
        ) {
          const median = buffer.sort()[Math.floor(buffer.length / 2)];
          this.stagedPrices.push(pair, median);
          buffer.length = 0;
        }
      });
    }, this.bufferTimeoutMs);
  }

  private _connect(endpoint: string): void {
    const socket = new WebSocket(endpoint);
    this.sockets.set(endpoint, socket);

    socket.onmessage = message => {
      // Ignore return pong messages
      if (message.data === "pong") {
        return;
      }

      this.processMessage(message);
    };

    socket.onclose = () => {
      this.sockets.delete(endpoint);
      setTimeout(() => {
        this.fallbackToNextEndpoint();
      }, this.reconnectTimeoutMs);
    };

    socket.onerror = error => {
      console.error(`WebSocket error: ${error.message}`);
    };
  }

  private fallbackToNextEndpoint(): void {
    const connectedEndpoints = [...this.sockets.keys()];
    const sortedAvailableEndpoints = [...this.endpoints]
      .sort((a, b) => {
        const aLatency = this.latencyMap.get(a) || Number.MAX_VALUE;
        const bLatency = this.latencyMap.get(b) || Number.MAX_VALUE;
        return aLatency - bLatency;
      })
      .filter(endpoint => !connectedEndpoints.includes(endpoint));

    if (sortedAvailableEndpoints.length > 0) {
      this._connect(sortedAvailableEndpoints[0]);
    }
  }

  private async measureLatency(endpoint: string): Promise<number> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const socket = new WebSocket(endpoint);

      socket.onopen = () => {
        socket.send("ping");
      };

      socket.onmessage = message => {
        if (message.data === "pong") {
          const latency = Date.now() - startTime;
          socket.close();
          resolve(latency);
        }
      };

      socket.on("error", e => {
        resolve(Number.MAX_VALUE);
      });

      // Backstop so we don't wait forever
      setTimeout(() => {
        socket.close();
        resolve(2000);
      }, 2000);
    });
  }

  private processMessage(message: WebSocket.MessageEvent): void {
    try {
      const priceUpdates = JSON.parse(message.data.toString());
      if (!priceUpdates) {
        console.log("Invalid price update message received", priceUpdates);
        return;
      }

      const finalMessage: number[] = [];
      for (let i = 0; i < priceUpdates.length; i += 1) {
        const pairAndPrice = priceUpdates[i];
        const pair = this.pairsToIndex.get(pairAndPrice[0]);
        if (pair === undefined) {
          console.log("Invalid pair received", pairAndPrice[0]);
          continue;
        }
        const price = pairAndPrice[1];
        if (!this.priceBuffer.has(pair)) {
          this.priceBuffer.set(pair, []);
          this.priceBufferLastFlush.set(pair, 0);
        }

        // Checking existence above, so this should be safe
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const buffer = this.priceBuffer.get(pair)!;
        if (buffer.length >= this.sockets.size) {
          const median = buffer.sort()[Math.floor(buffer.length / 2)];
          finalMessage.push(pair, median);
          buffer.length = 0;
        }

        buffer.push(price);
      }

      if (finalMessage.length > 0 || this.stagedPrices.length > 0) {
        finalMessage.push(...(this.stagedPrices || []));
        this._onPriceMessage?.(finalMessage);
      }
    } catch (e) {
      console.error(e);
    }
  }

  get activeSockets(): Map<string, WebSocket> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.sockets;
  }

  set onPriceMessage(callback: (prices: number[]) => void) {
    this._onPriceMessage = callback;
  }
}
