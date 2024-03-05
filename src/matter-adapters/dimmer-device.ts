import {DimmableLightDevice,EndpointOptions} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult, ZwaveInitialValueType} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-adapter";
import {ZwaveDevice} from "../zwave-device";

export class DimmerDeviceAdapter implements MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined {
    const currentValueConfig = initialResult.values.find(v =>
      v.commandClass === ZwaveCommandClass.MultilevelSwitch &&
      v.property === "currentValue" &&
      typeof v.value === "number");

    if(!currentValueConfig) {
      return;
    }

    if(typeof(currentValueConfig.metadata.min) !== "number" || typeof(currentValueConfig.metadata.max) !== "number") {
      console.error(`[ERROR] Zwave NodeId='${initialResult.nodeId}' is a multiswitch dimmer but min/max values are not defined in metadata. Skipping...`);
      return;
    }

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.MultilevelSwitch,
      watchProperties: ["currentValue"]
    });

    const matterDevice = this.#createDevice(zwaveDevice, currentValueConfig as ZwaveInitialValueType<ZwaveCommandClass.MultilevelSwitch, number>);
    const zwaveOnOff = zwaveDevice.createPropertyManager<number>('currentValue', 'targetValue');
    matterDevice.addOnOffListener((newValue: boolean, oldValue: boolean) => {
      const dimmerValue = newValue ? currentValueConfig.metadata.max : currentValueConfig.metadata.min;
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

  #createDevice(zwaveDevice: ZwaveDevice, initialValue: ZwaveInitialValueType<ZwaveCommandClass.MultilevelSwitch, number>): DimmableLightDevice {
    const initialValues = {
      onOff: initialValue.value > 0,
    };
    const deviceOptions: EndpointOptions = {
      uniqueStorageKey: `zwave-${zwaveDevice.nodeId}`
    };
    return new DimmableLightDevice(initialValues,{
      minLevel: initialValue.metadata.min!,
      maxLevel: initialValue.metadata.max!,
      onLevel: initialValue.metadata.max!,
      currentLevel: initialValue.value,
      options: {
        executeIfOff: false,
        coupleColorTempToLevel: false,
      },
    }, deviceOptions);
  }
}
