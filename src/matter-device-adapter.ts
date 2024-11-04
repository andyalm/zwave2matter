import { EndpointType, MutableEndpoint } from '@matter/main';
import { getZwaveEndpoints, ZwaveEndpointData, ZwaveInitialResult } from './zwave-types';
import { OnOffDeviceAdapter } from './matter-adapters';
import { ZwaveClient } from './zwave-client';
import { DimmerDeviceAdapter } from './matter-adapters/dimmer-device';
import { ZwaveMatterDevice } from './zwave-matter-device';

type MatterDeviceEndpointType = EndpointType & MutableEndpoint;

export interface ZwaveMatterAdapter {
  tryCreateMatterDevices(
    zwaveClient: ZwaveClient,
    zwaveEndpoint: ZwaveEndpointData
  ): ZwaveMatterDevice<MatterDeviceEndpointType>[] | undefined;
}

const adapters: ZwaveMatterAdapter[] = [OnOffDeviceAdapter, DimmerDeviceAdapter];

export function tryCreateMatterDevices(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult) {
  for (const zwaveEndpoint of getZwaveEndpoints(initialResult)) {
    for (const adapter of adapters) {
      const devices = adapter.tryCreateMatterDevices(zwaveClient, zwaveEndpoint);
      if (devices) {
        return devices;
      }
    }
  }

  return;
}
