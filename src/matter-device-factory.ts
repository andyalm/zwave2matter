import {ZwaveInitialResult} from "./zwave-types";
import {ComposedDevice, Device} from "@project-chip/matter-node.js/device";
import {OnOffDeviceAdapter} from "./matter-adapters";
import {ZwaveClient} from "./zwave-client";

const adapters = [
  new OnOffDeviceAdapter()
]

export type BridgedDevice = {
  name: string
  device: Device | ComposedDevice,
}

export function toMatterDevices(zwaveClient: ZwaveClient, initialResults: ZwaveInitialResult[]): BridgedDevice[] {
  const devices: BridgedDevice[] = [];
  for (const result of initialResults) {
    for (const adapter of adapters) {
      const device = adapter.tryCreateMatterDevice(zwaveClient, result);
      if (device) {
        devices.push(device);
      }
    }
  }
  return devices;
}
