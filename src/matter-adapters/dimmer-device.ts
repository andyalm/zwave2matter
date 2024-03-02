import {DimmableLightDevice,EndpointOptions} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-factory";
import {ZwaveDevice} from "../zwave-device";

const MAX_DIMMER_LEVEL = 255;
const OFF_LEVEL = 0;

export class DimmerDeviceAdapter implements MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined {
    if(!initialResult.values.find(v =>
      v.commandClass === ZwaveCommandClass.MultilevelSwitch &&
      v.property === "currentValue")) {
      return;
    }

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.MultilevelSwitch,
      watchProperties: ["currentValue"]
    });

    const initialOnOff = zwaveDevice.property<number>("currentValue");
    if(typeof initialOnOff === "undefined") {
      return;
    }

    const matterDevice = this.#createDevice(zwaveDevice, initialOnOff);
    const zwaveOnOff = zwaveDevice.createPropertyManager<number>('currentValue', 'targetValue');
    matterDevice.addOnOffListener((newValue: boolean, oldValue: boolean) => {
      const dimmerValue = newValue ? MAX_DIMMER_LEVEL : OFF_LEVEL;
      if(zwaveDevice.property<number>("currentValue") !== dimmerValue) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' onOff state requested to change to '${newValue}'`);
        zwaveOnOff.setValue(dimmerValue);
      }
    });
    matterDevice.addCurrentLevelListener((newValue: number, oldValue: number) => {
      if(newValue !== oldValue && zwaveDevice.property<number>("currentValue") !== newValue) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' currentLevel state requested to change to '${newValue}'`);
        zwaveOnOff.setValue(newValue);
      }
    });
    zwaveOnOff.addChangeListener((newValue: number) => {
      if(matterDevice.getCurrentLevel() !== newValue) {
        matterDevice.setCurrentLevel(newValue);
      }
    });

    return {
      name: zwaveDevice.name,
      device: matterDevice
    };
  }

  #createDevice(zwaveDevice: ZwaveDevice, initialLevel: number): DimmableLightDevice {
    const initialValues = {
      onOff: initialLevel > 0,
    };
    const deviceOptions: EndpointOptions = {
      uniqueStorageKey: `zwave-${zwaveDevice.nodeId}`
    };
    return new DimmableLightDevice(initialValues,{
      minLevel: OFF_LEVEL,
      maxLevel: MAX_DIMMER_LEVEL,
      onLevel: MAX_DIMMER_LEVEL,
      currentLevel: initialLevel,
      options: {
        executeIfOff: false,
        coupleColorTempToLevel: false,
      },
    }, deviceOptions);
  }
}
