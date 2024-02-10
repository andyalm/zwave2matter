import {ComposedDevice, Device, OnOffLightDevice} from "@project-chip/matter.js/device";
import {ZwaveCommandClasses, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";


export class OnOffDeviceAdapter implements MatterDeviceAdapter {
    tryCreateMatterDevice(initialResult: ZwaveInitialResult): Device | ComposedDevice | undefined {
      const initialOnOff = initialResult.values.find(v => v.commandClass === ZwaveCommandClasses.BinarySwitch && v.property === "currentValue");
      if(!initialOnOff) {
        return;
      }
      const device = new OnOffLightDevice({
        onOff: initialOnOff.value
      });
      device.name = initialResult.name;
      device.addOnOffListener((newValue: boolean, oldValue: boolean) => {
        //TODO: Send command to zwave
      })

      return device;
    }

}