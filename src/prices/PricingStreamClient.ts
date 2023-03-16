/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import WebSocket from "ws";

export class PricingStreamClient {
  private endpoints: string[];
  private activeSocket: WebSocket | null;
  private fallbackIndex: number;
  private reconnectTimeoutMs: number;

  constructor(endpoints: string[], reconnectTimeoutMs = 1000) {
    this.endpoints = endpoints;
    this.activeSocket = null;
    this.fallbackIndex = 0;
    this.reconnectTimeoutMs = reconnectTimeoutMs;
    void this.connectToClosestEndpoint();
  }

  private async connectToClosestEndpoint(): Promise<void> {
    const latencies = await Promise.all(
      this.endpoints.map(endpoint => this.measureLatency(endpoint))
    );
    const minIndex = latencies.indexOf(Math.min(...latencies));
    this.connect(this.endpoints[minIndex]);
  }

  private connect(endpoint: string): void {
    this.activeSocket = new WebSocket(endpoint);

    this.activeSocket.onclose = () => {
      setTimeout(
        () => void this.fallbackToNextEndpoint(),
        this.reconnectTimeoutMs
      );
    };

    this.activeSocket.onerror = error => {
      console.error(`WebSocket error: ${error.message}`);
      this.activeSocket?.close();
    };
  }

  private fallbackToNextEndpoint(): void {
    this.fallbackIndex = (this.fallbackIndex + 1) % this.endpoints.length;
    const fallbackEndpoint = this.endpoints[this.fallbackIndex];
    this.connect(fallbackEndpoint);
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

      socket.on("error", () => {
        resolve(Number.MAX_VALUE);
      });

      // Backstop so we don't wait forever
      setTimeout(() => {
        socket.close();
        resolve(2000 * 1000);
      }, 2000);
    });
  }
}
