import {ZwaveClient} from "./zwave-client";
import {ZwaveCommandClass, ZwaveInitialResult} from "./zwave-types";
import {NodeEvent} from "./zwave-types/messages/outgoing-message";

export type ZwaveDeviceOptions = {
  commandClass: ZwaveCommandClass;
  watchProperties: string[];
}

export type PropertyChangedCallback<TValue=any> = (newValue: TValue) => void;

export class ZwaveDevice {
  readonly #client: ZwaveClient;
  readonly #nodeId: number;
  readonly #name: string;
  readonly #commandClass: ZwaveCommandClass;
  readonly #propertyValues: Record<string, any> = {};
  readonly #propertyChangeCallbacks: Record<string, PropertyChangedCallback[]> = {};

  constructor(client: ZwaveClient, initialResult: ZwaveInitialResult, options: ZwaveDeviceOptions) {
    this.#client = client;
    this.#nodeId = initialResult.nodeId;
    this.#name = initialResult.name;
    this.#commandClass = options.commandClass;
    options.watchProperties.forEach(propertyName => {
      this.#propertyValues[propertyName] = initialResult.values.find(v => v.property === propertyName)?.value;
    });
    client.subscribeEvents<NodeEvent>(event => event.source === "node" &&
    event.nodeId === initialResult.nodeId &&
    event.args?.commandClass === options.commandClass &&
    event.args?.property &&
    options.watchProperties.includes(event.args?.property) ? event : undefined, event => {
      if(this.#propertyValues[event.args.property] !== event.args.newValue) {
        console.log(`[ZwaveDevice] NodeId=${event.nodeId} property changed ${event.args.property}=${event.args.newValue}`);
        this.#propertyValues[event.args.property] = event.args.newValue;
        const callbacks = this.#propertyChangeCallbacks[event.args.property] ?? [];
        for(const callback of callbacks) {
          callback(event.args.newValue);
        }
      }
    });
  }

  get nodeId() {
    return this.#nodeId;
  }

  get name() {
    return this.#name;
  }

  property<TValue=any>(propertyName: string): TValue|undefined {
    return this.#propertyValues[propertyName];
  }

  setProperty(propertyName: string, value: any) {
    this.#client.setValue({
      nodeId: this.#nodeId,
      property: propertyName,
      commandClass: this.#commandClass,
      value: value
    });
  }

  onPropertyChanged<TValue=any>(propertyName: string, callback: PropertyChangedCallback<TValue>) {
    if(!this.#propertyChangeCallbacks[propertyName]) {
      this.#propertyChangeCallbacks[propertyName] = [];
    }
    this.#propertyChangeCallbacks[propertyName].push(callback);
  }
}
