import {ZwaveInitialResult} from "./zwave-types";
import {ComposedDevice, Device} from "@project-chip/matter.js/device";
import {OnOffDeviceAdapter} from "./matter-adapters";

const adapters = [
  new OnOffDeviceAdapter()
]

export function toMatterDevices(initialResults: ZwaveInitialResult[]): (Device|ComposedDevice)[] {
  const devices: (Device|ComposedDevice)[] = [];
  for (const result of initialResults) {
    for (const adapter of adapters) {
      const device = adapter.tryCreateMatterDevice(result);
      if (device) {
        devices.push(device);
        break;
      }
    }
  }
  return devices;
}