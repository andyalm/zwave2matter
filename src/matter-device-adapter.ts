import {ZwaveInitialResult} from "./zwave-types";
import {ZwaveClient} from "./zwave-client";
import {BridgedDevice} from "./matter-device-factory";


export interface MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined;
}

