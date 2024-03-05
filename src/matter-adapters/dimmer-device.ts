import {DimmableLightDevice,EndpointOptions} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult, ZwaveInitialValueType} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-adapter";
import {ZwaveDevice} from "../zwave-device";

const MATTER_OFF_LEVEL = 0;
const MATTER_ON_LEVEL = 254;

function toMatterLevel(zwaveLevel: number, minZwaveLevel: number, maxZwaveLevel: number): number {
  return Math.round((zwaveLevel - minZwaveLevel) / (maxZwaveLevel - minZwaveLevel) * (MATTER_ON_LEVEL - MATTER_OFF_LEVEL) + MATTER_OFF_LEVEL);
}

function toZwaveLevel(matterLevel: number, minZwaveLevel: number, maxZwaveLevel: number): number {
  return Math.round((matterLevel - MATTER_OFF_LEVEL) / (MATTER_ON_LEVEL - MATTER_OFF_LEVEL) * (maxZwaveLevel - minZwaveLevel) + minZwaveLevel);
}

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
      // onOff listener fires when the level is changing, if we are changing from one dimmer level to another, we don't want to do anything here
      if(newValue && oldValue) {
        return;
      }
      const zwaveDimmerValue = newValue ? currentValueConfig.metadata.max : currentValueConfig.metadata.min;
      if(zwaveDevice.property<number>("currentValue") !== zwaveDimmerValue) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' onOff state requested to change to '${newValue}' (zwave dimmer value: ${zwaveDimmerValue})`);
        zwaveOnOff.setValue(zwaveDimmerValue);
      }
    });
    matterDevice.addCurrentLevelListener((newMatterLevel: number, oldMatterLevel: number) => {
      const zwaveLevel = toZwaveLevel(newMatterLevel, currentValueConfig.metadata.min, currentValueConfig.metadata.max);
      if(newMatterLevel !== oldMatterLevel && zwaveDevice.property<number>("currentValue") !== zwaveLevel) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' currentLevel state requested to change to matterLevel='${newMatterLevel}', zwaveLevel='${zwaveLevel}'`);
        zwaveOnOff.setValue(zwaveLevel);
      }
    });
    zwaveOnOff.addChangeListener((newZwaveValue: number) => {
      const matterLevel = toMatterLevel(newZwaveValue, currentValueConfig.metadata.min, currentValueConfig.metadata.max);
      const onOff = matterLevel !== MATTER_OFF_LEVEL;
      if(matterDevice.getCurrentLevel() !== matterLevel) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' currentLevel is ${matterDevice.getCurrentLevel()}, new matterLevel='${matterLevel}', zwaveLevel='${newZwaveValue}'`);
        matterDevice.setCurrentLevel(matterLevel);
      }
      if(matterDevice.getOnOff() !== onOff) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' onOff is ${matterDevice.getOnOff()}, new onOff='${onOff}'`);
        matterDevice.setOnOff(onOff);
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
      minLevel: MATTER_OFF_LEVEL,
      maxLevel: MATTER_ON_LEVEL,
      onLevel: MATTER_ON_LEVEL,
      currentLevel: toMatterLevel(initialValue.value, initialValue.metadata.min!, initialValue.metadata.max!),
      options: {
        executeIfOff: false,
        coupleColorTempToLevel: false,
      },
    }, deviceOptions);
  }
}
