import { ZwaveInitialResult } from './zwave-types';
import { OnOffDeviceAdapter } from './matter-adapters';
import { ZwaveClient } from './zwave-client';
import { DimmerDeviceAdapter } from './matter-adapters/dimmer-device';
import { MutableEndpoint, EndpointType } from '@project-chip/matter.js/endpoint/type';
import { Endpoint } from '@project-chip/matter.js/endpoint';
import { ZwaveDevice } from './zwave-device';

export interface ZwaveMatterAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): ZwaveMatterDevice | undefined;
}

const adapters: ZwaveMatterAdapter[] = [OnOffDeviceAdapter, DimmerDeviceAdapter];

export function tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult) {
  for (const adapter of adapters) {
    const device = adapter.tryCreateMatterDevice(zwaveClient, initialResult);
    if (device) {
      return device;
    }
  }

  return;
}

export interface ZwaveMatterDevice<TEndpointType extends EndpointType = EndpointType> {
  readonly nodeId: number;
  readonly name: string;
  readonly endpointType: MutableEndpoint;
  readonly reachable?: boolean;

  getCurrentState(): Endpoint.Options<TEndpointType>;
  subscribeEvents(endpoint: Endpoint<TEndpointType>): void;
}

export abstract class ZwaveMatterDeviceBase<TEndpointType extends EndpointType & MutableEndpoint>
  implements ZwaveMatterDevice<TEndpointType>
{
  readonly zwaveDevice: ZwaveDevice;
  readonly endpointType: TEndpointType;

  constructor(zwaveDevice: ZwaveDevice, endpointType: TEndpointType) {
    this.zwaveDevice = zwaveDevice;
    this.endpointType = endpointType;
  }

  get nodeId() {
    return this.zwaveDevice.nodeId;
  }

  get name() {
    return this.zwaveDevice.name;
  }

  abstract getCurrentState(): Endpoint.Options<TEndpointType>;

  abstract subscribeEvents(endpoint: Endpoint<TEndpointType>): void;
}
