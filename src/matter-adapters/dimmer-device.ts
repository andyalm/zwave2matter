import {DimmableLightDevice} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClasses, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";


export class DimmerDeviceAdapter implements MatterDeviceAdapter<DimmableLightDevice> {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): DimmableLightDevice | undefined {
    const initialOnOff = initialResult.values.find(v => v.commandClass === ZwaveCommandClasses.MultilevelSwitch && v.property === "currentValue");
    if(!initialOnOff) {
      return;
    }
    const device = new DimmableLightDevice({
      onOff: initialOnOff.value !== 0,
    }, {
      currentLevel: initialOnOff.value,
      onLevel: 1,
      options: {
        executeIfOff: false,
        coupleColorTempToLevel: false,
      }
    });
    device.name = initialResult.name;
    device.addOnOffListener((newValue: boolean, oldValue: boolean) => {
      zwaveClient.setValue({
        nodeId: initialResult.nodeId,
        commandClass: ZwaveCommandClasses.MultilevelSwitch,
        property: "targetValue",
        value: 100
      });
    });

    return device;
  }
}