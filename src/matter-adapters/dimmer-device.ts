import {DimmableLightDevice,EndpointOptions} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClass, ZwaveInitialResult, ZwaveInitialValueType} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {BridgedDevice} from "../matter-device-adapter";
import {ZwaveDevice} from "../zwave-device";
import {LevelConverter} from "../level-converter";

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

    const levelConverter = new LevelConverter(currentValueConfig.metadata.min, currentValueConfig.metadata.max);

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.MultilevelSwitch,
      watchProperties: ["currentValue"]
    });

    const matterDevice = this.#createDevice(zwaveDevice, levelConverter, currentValueConfig as ZwaveInitialValueType<ZwaveCommandClass.MultilevelSwitch, number>);
    const zwaveOnOff = zwaveDevice.createPropertyManager<number>('currentValue', 'targetValue');
    matterDevice.addOnOffListener((newValue: boolean, oldValue: boolean) => {
      // onOff listener fires when the level is changing, if we are changing from one dimmer level to another, we don't want to do anything here
      if(newValue && oldValue) {
        return;
      }
      const zwaveDimmerValue = newValue ? (levelConverter.toZwaveLevel(matterDevice.getCurrentLevel()) || currentValueConfig.metadata.max) : currentValueConfig.metadata.min;
      if(zwaveDevice.property<number>("currentValue") !== zwaveDimmerValue) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' onOff state requested to change to '${newValue}' (zwave dimmer value: ${zwaveDimmerValue})`);
        zwaveOnOff.setValue(zwaveDimmerValue);
      }
    });
    matterDevice.addCurrentLevelListener((newMatterLevel: number, oldMatterLevel: number) => {
      const zwaveLevel = levelConverter.toZwaveLevel(newMatterLevel);
      if(newMatterLevel !== oldMatterLevel && zwaveDevice.property<number>("currentValue") !== zwaveLevel) {
        console.log(`[MatterDevice] Name='${matterDevice.name}', NodeId='${zwaveDevice.nodeId}' currentLevel state requested to change to matterLevel='${newMatterLevel}', zwaveLevel='${zwaveLevel}'`);
        zwaveOnOff.setValue(zwaveLevel);
      }
    });
    zwaveOnOff.addChangeListener((newZwaveValue: number) => {
      const matterLevel = levelConverter.toMatterLevel(newZwaveValue);
      const onOff = matterLevel !== LevelConverter.MatterMinLevel;
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

  #createDevice(zwaveDevice: ZwaveDevice, levelConverter: LevelConverter, initialValue: ZwaveInitialValueType<ZwaveCommandClass.MultilevelSwitch, number>): DimmableLightDevice {
    const initialValues = {
      onOff: initialValue.value > 0,
    };
    const deviceOptions: EndpointOptions = {
      uniqueStorageKey: `zwave-${zwaveDevice.nodeId}`
    };
    return new DimmableLightDevice(initialValues,{
      minLevel: LevelConverter.MatterMinLevel,
      maxLevel: LevelConverter.MatterMaxLevel,
      onLevel: LevelConverter.MatterMaxLevel,
      currentLevel: levelConverter.toMatterLevel(initialValue.value),
      options: {
        executeIfOff: false,
        coupleColorTempToLevel: false,
      },
    }, deviceOptions);
  }
}
