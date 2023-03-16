/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import WebSocket from "ws";

export type PriceMessage = WebSocket.MessageEvent;

export class PricingStreamClient {
  private endpoints: string[];
  private _activeSocket: WebSocket | null;
  private fallbackIndex: number;
  private reconnectTimeoutMs: number;
  private _onPriceMessage: (message: PriceMessage) => void | null;

  constructor(
    endpoints: string[],
    onPriceMessage: (message: PriceMessage) => void,
    reconnectTimeoutMs = 1000
  ) {
    this.endpoints = endpoints;
    this._activeSocket = null;
    this.fallbackIndex = 0;
    this.reconnectTimeoutMs = reconnectTimeoutMs;
    this._onPriceMessage = onPriceMessage;
  }

  public async connect(): Promise<void> {
    if (this._activeSocket) {
      return;
    }

    const latencies = await Promise.all(
      this.endpoints.map(endpoint => this.measureLatency(endpoint))
    );
    // Sort endpoints by latency
    this.endpoints.sort((a, b) => {
      const aLatency = latencies[this.endpoints.indexOf(a)];
      const bLatency = latencies[this.endpoints.indexOf(b)];
      return aLatency - bLatency;
    });
    this._connect(this.endpoints[0]);
  }

  private _connect(endpoint: string): void {
    this._activeSocket = new WebSocket(endpoint);

    this._activeSocket.onmessage = message => {
      // Ignore return pong messages
      if (message.data === "pong") {
        return;
      }
      this._onPriceMessage?.(message);
    };

    this._activeSocket.onclose = () => {
      setTimeout(
        () => void this.fallbackToNextEndpoint(),
        this.reconnectTimeoutMs
      );
    };

    this._activeSocket.onerror = error => {
      console.error(`WebSocket error: ${error.message}`);
      this._activeSocket?.close();
    };
  }

  private fallbackToNextEndpoint(): void {
    this.fallbackIndex = (this.fallbackIndex + 1) % this.endpoints.length;
    const fallbackEndpoint = this.endpoints[this.fallbackIndex];
    this._connect(fallbackEndpoint);
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

  get activeSocket(): WebSocket | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this._activeSocket;
  }

  set onPriceMessage(callback: (message: WebSocket.MessageEvent) => void) {
    this._onPriceMessage = callback;
  }
}
