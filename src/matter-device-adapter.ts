import {ZwaveInitialResult} from "./zwave-types";
import {ComposedDevice, Device} from "@project-chip/matter-node.js/device";
import {ZwaveClient} from "./zwave-client";


export interface MatterDeviceAdapter<TDevice extends Device | ComposedDevice> {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): TDevice | undefined;
}

