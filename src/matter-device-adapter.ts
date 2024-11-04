import { EndpointType, MutableEndpoint } from '@matter/main';
import { ZwaveEndpointData } from './zwave-types';
import { OnOffDeviceAdapter } from './matter-adapters';
import { ZwaveClient } from './zwave-client';
import { DimmerDeviceAdapter } from './matter-adapters';
import { ZwaveMatterDevice } from './zwave-matter-device';

type MatterDeviceEndpointType = EndpointType & MutableEndpoint;

export interface ZwaveMatterAdapter {
  tryCreateMatterDevice(
    zwaveClient: ZwaveClient,
    zwaveEndpoint: ZwaveEndpointData
  ): ZwaveMatterDevice<MatterDeviceEndpointType> | undefined;
}

const adapters: ZwaveMatterAdapter[] = [OnOffDeviceAdapter, DimmerDeviceAdapter];

export function tryCreateMatterDevice(zwaveClient: ZwaveClient, zwaveEndpoint: ZwaveEndpointData) {
  for (const adapter of adapters) {
    const device = adapter.tryCreateMatterDevice(zwaveClient, zwaveEndpoint);
    if (device) {
      return device;
    }
  }

  return;
}
