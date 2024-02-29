import {OnOffLightDevice,OnOffPluginUnitDevice,EndpointOptions} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-factory";
import {ZwaveDevice} from "../zwave-device";


export class OnOffDeviceAdapter implements MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined {
    if(!initialResult.values.find(v =>
      v.commandClass === ZwaveCommandClass.BinarySwitch &&
      v.property === "currentValue")) {
      return;
    }

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.BinarySwitch,
      watchProperties: ["currentValue"]
    });

    const initialOnOff = zwaveDevice.property<boolean>("currentValue");
    if(typeof initialOnOff === "undefined") {
      return;
    }

    const matterDevice = this.#createDevice(zwaveDevice, initialOnOff);
    const zwaveOnOff = zwaveDevice.createPropertyManager<boolean>('currentValue', 'targetValue');
    matterDevice.addOnOffListener((newValue: boolean, oldValue: boolean) => {
      if(newValue !== oldValue && zwaveDevice.property<boolean>("currentValue") !== newValue) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' onOff state requested to change to '${newValue}'`);
        zwaveOnOff.setValue(newValue);
      }
    });
    zwaveOnOff.addChangeListener((newValue: boolean) => {
      if(matterDevice.getOnOff() !== newValue) {
        matterDevice.setOnOff(newValue);
      }
    });

    return {
      name: zwaveDevice.name,
      device: matterDevice
    };
  }

    #createDevice(zwaveDevice: ZwaveDevice, onOff: boolean): OnOffLightDevice | OnOffPluginUnitDevice {
      const initialValues = {
        onOff: onOff
      };
      const deviceOptions: EndpointOptions = {
        uniqueStorageKey: `zwave-${zwaveDevice.nodeId}`
      };
      if(zwaveDevice.name.toLowerCase().includes('light')) {
        return new OnOffLightDevice(initialValues, deviceOptions);
      }
      else {
        return new OnOffPluginUnitDevice(initialValues, deviceOptions);
      }
    }
}
