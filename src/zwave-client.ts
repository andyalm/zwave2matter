import WebSocket from "ws";
import {OutgoingEvent, OutgoingMessage} from "./outgoing-message";
import {ZwaveInitialResult} from "./zwave-types";

const schemaVersion = 35;

export type MessageSubscription = (message: OutgoingMessage) => void|Promise<void>
export type EventSubscription = (event: OutgoingEvent) => void|Promise<void>

export class ZwaveClient {
  readonly #serverAddress: string;
  readonly #messageSubscriptions: MessageSubscription[] = [];
  readonly #eventSubscriptions: EventSubscription[] = [];
  #socket: WebSocket;

  constructor(serverAddress: string) {
    if(!serverAddress.startsWith("ws://")) {
      this.#serverAddress = `ws://${serverAddress}`;
    }
    else {
      this.#serverAddress = serverAddress;
    }
  }

  async start(): Promise<ZwaveInitialResult[]> {
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
          if(!promiseResolved) {
            resolve(message.result.state.nodes);
            promiseResolved = true;
          }
        }

        if(message.type === "event") {
          for (const subscription of this.#eventSubscriptions) {
            subscription(message.event);
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

  subscribeAll(subscription: MessageSubscription) {
    if(!this.#messageSubscriptions.includes(subscription)) {
      this.#messageSubscriptions.push(subscription);
    }
  }

  subscribeAllEvents(listener: (event: OutgoingEvent) => void|Promise<void>) {
    if(!this.#eventSubscriptions.includes(listener)) {
      this.#eventSubscriptions.push(listener);
    }
  }

  subscribeEvents<TEvent>(filter: (event: OutgoingEvent) => TEvent|undefined, listener: (event: TEvent) => void|Promise<void>) {
    this.subscribeAllEvents(event => {
      const filtered = filter(event);
      if(filtered !== undefined) {
        listener(filtered);
      }
    });
  }
}