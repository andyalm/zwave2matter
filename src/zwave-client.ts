import WebSocket from "ws";
import {OutgoingMessage, ResultTypes} from "./outgoing-message";

const schemaVersion = 35;

export type MessageSubscription = (message: OutgoingMessage) => void|Promise<void>

export type Node = any;

export class ZwaveClient {
  readonly #serverAddress: string;
  readonly #messageSubscriptions: MessageSubscription[] = [];
  #socket: WebSocket;
  #nodes: Node[];

  constructor(serverAddress: string) {
    if(!serverAddress.startsWith("ws://")) {
      this.#serverAddress = `ws://${serverAddress}`;
    }
    else {
      this.#serverAddress = serverAddress;
    }
  }

  async start() {
    this.#socket = new WebSocket(this.#serverAddress);
    this.#socket.on("open", () => {
      this.#socket.send(
        JSON.stringify({
          messageId: "api-schema-id",
          command: "set_api_schema",
          schemaVersion: schemaVersion,
        }),
      );
      this.#socket.send(
        JSON.stringify({
          messageId: "start-listening-result",
          command: "start_listening",
        }),
      );
    });
    let promiseResolved = false;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if(!promiseResolved) {
          reject(new Error('Never received the start-listening-result response'))
        }
      }, 5000);
      this.#socket.on("message", data => {
        const message = JSON.parse(data.toString()) as OutgoingMessage;

        for (const subscription of this.#messageSubscriptions) {
          subscription(message);
        }

        if (
          message.type === "result" &&
          message.messageId === "start-listening-result" &&
          message.success
        ) {
          this.#nodes = message.result.state.nodes;
          if(!promiseResolved) {
            resolve(undefined);
            promiseResolved = true;
          }
        }
      });
    });
  }

  stop() {
    if (!this.#socket) {
      return;
    }

    this.#socket.close();
    this.#socket = undefined;
  }

  get nodes() {
    return this.#nodes;
  }

  subscribe(subscription: MessageSubscription) {
    if(!this.#messageSubscriptions.includes(subscription)) {
      this.#messageSubscriptions.push(subscription);
    }
  }

}