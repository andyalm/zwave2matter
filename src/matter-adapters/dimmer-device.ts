import { DimmableLightDevice } from '@project-chip/matter.js/devices/DimmableLightDevice';
import { Endpoint } from '@project-chip/matter.js/endpoint';
import { ZwaveCommandClass, ZwaveInitialResult } from '../zwave-types';
import { ZwaveClient } from '../zwave-client';
import { ZwaveDevice } from '../zwave-device';
import { LevelConverter } from '../level-converter';
import { ZwaveMatterDevice, ZwaveMatterDeviceBase } from '../matter-device-adapter';

export class DimmerDeviceAdapter extends ZwaveMatterDeviceBase<DimmableLightDevice> {
  static tryCreateMatterDevice(
    zwaveClient: ZwaveClient,
    initialResult: ZwaveInitialResult
  ): ZwaveMatterDevice<DimmableLightDevice> | undefined {
    const currentValueConfig = initialResult.values.find(
      (v) =>
        v.commandClass === ZwaveCommandClass.MultilevelSwitch &&
        v.property === 'currentValue' &&
        typeof v.value === 'number'
    );

    if (!currentValueConfig) {
      return;
    }

    if (typeof currentValueConfig.metadata.min !== 'number' || typeof currentValueConfig.metadata.max !== 'number') {
      console.error(
        `[ERROR] Zwave NodeId='${initialResult.nodeId}' is a multiswitch dimmer but min/max values are not defined in metadata. Skipping...`
      );
      return;
    }

    const levelConverter = new LevelConverter(currentValueConfig.metadata.min, currentValueConfig.metadata.max);

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.MultilevelSwitch,
      watchProperties: ['currentValue'],
    });

    return new DimmerDeviceAdapter(zwaveDevice, levelConverter);
  }

  readonly levelConverter: LevelConverter;

  constructor(zwaveDevice: ZwaveDevice, levelConverter: LevelConverter) {
    super(zwaveDevice, DimmableLightDevice);

    this.levelConverter = levelConverter;
  }

  getCurrentState(): Endpoint.Options<DimmableLightDevice> {
    const zwaveDimmerValue = this.zwaveDevice.property<number>('currentValue') ?? 0;

    return {
      onOff: {
        onOff: zwaveDimmerValue > 0,
      },
      levelControl: {
        currentLevel: this.levelConverter.toMatterLevel(zwaveDimmerValue),
        options: {
          executeIfOff: false,
        },
      },
    };
  }

  subscribeEvents(endpoint: Endpoint<DimmableLightDevice>) {
    const zwaveOnOff = this.zwaveDevice.createPropertyManager<number>('currentValue', 'targetValue');

    endpoint.events.onOff.onOff$Change.on((newValue) => {
      // onOff listener fires when the level is changing, if we are changing from one dimmer level to another, we don't want to do anything here
      if (newValue && endpoint.state.onOff.onOff) {
        return;
      }
      const zwaveDimmerValue = newValue
        ? this.levelConverter.toZwaveLevel(
            endpoint.state.levelControl.currentLevel ?? this.levelConverter.matterMaxLevel
          )
        : this.levelConverter.zwaveMinLevel;
      if (this.zwaveDevice.property<number>('currentValue') !== zwaveDimmerValue) {
        console.log(
          `[MatterDevice] Name='${this.zwaveDevice.name}', NodeId='${this.zwaveDevice.nodeId}' onOff state requested to change to '${newValue}' (zwave dimmer value: ${zwaveDimmerValue})`
        );
        zwaveOnOff.setValue(zwaveDimmerValue);
      }
    });
    endpoint.events.levelControl.currentLevel$Change.on((newMatterLevel) => {
      newMatterLevel ??= 0;
      const zwaveLevel = this.levelConverter.toZwaveLevel(newMatterLevel);
      if (this.zwaveDevice.property<number>('currentValue') !== zwaveLevel) {
        console.log(
          `[MatterDevice] Name='${this.zwaveDevice.name}', NodeId='${this.zwaveDevice.nodeId}' currentLevel state requested to change to matterLevel='${newMatterLevel}', zwaveLevel='${zwaveLevel}'`
        );
        zwaveOnOff.setValue(zwaveLevel);
      }
    });
    zwaveOnOff.addChangeListener((newZwaveValue: number) => {
      const matterLevel = this.levelConverter.toMatterLevel(newZwaveValue);
      const onOff = matterLevel !== LevelConverter.MatterMinLevel;
      if (endpoint.state.levelControl.currentLevel !== matterLevel || endpoint.state.onOff.onOff !== onOff) {
        this.setMatterValues(
          endpoint,
          {
            levelControl: {
              currentLevel: matterLevel,
            },
            onOff: {
              onOff,
            },
          },
          `onOff->${onOff},currentLevel->${matterLevel}`
        );
      }
    });
  }
}
