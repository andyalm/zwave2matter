import {OnOffLightDevice} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-factory";
import {ZwaveDevice} from "../zwave-device";


export class OnOffDeviceAdapter implements MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined {
      const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
        commandClass: ZwaveCommandClass.BinarySwitch,
        watchProperties: ["currentValue"]
      });

      const initialOnOff = zwaveDevice.property<boolean>("currentValue");
      if(typeof initialOnOff === "undefined") {
        return;
      }

      const device = new OnOffLightDevice({
        onOff: initialOnOff,
      }, {
        uniqueStorageKey: `zwave-${initialResult.nodeId}`
      });
      device.addOnOffListener((newValue: boolean, oldValue: boolean) => {
        if(newValue !== oldValue) {
          console.log(`[MatterDevice] Name='${device.name}', NodeId='${zwaveDevice.nodeId}' onOff state requested to change to '${newValue}'`);
          zwaveDevice.setProperty("targetValue", newValue);
        }
      });
      zwaveDevice.onPropertyChanged<boolean>("currentValue", (newValue: boolean) => {
        if(device.getOnOff() !== newValue) {
          device.setOnOff(newValue);
        }
      });

      return {
        name: initialResult.name,
        device: device
      };
    }
}
