import {ZwaveInitialResult} from "./zwave-types";
import {ComposedDevice, Device} from "@project-chip/matter.js/device";


export interface MatterDeviceAdapter {
  tryCreateMatterDevice(initialResult: ZwaveInitialResult): Device|ComposedDevice|undefined;
}

