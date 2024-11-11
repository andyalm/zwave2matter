import { DimmableLightDevice } from '@matter/main/devices';
import { Endpoint } from '@matter/main';
import { ZwaveCommandClass, ZwaveEndpointData } from '../zwave-types';
import { ZwaveClient } from '../zwave-client';
import { ZwaveDevice } from '../zwave-device';
import { LevelConverter } from '../level-converter';
import { ZwaveMatterDevice, ZwaveMatterDeviceBase } from '../zwave-matter-device';

export class DimmerDeviceAdapter extends ZwaveMatterDeviceBase<DimmableLightDevice> {
  static tryCreateMatterDevice(
    zwaveClient: ZwaveClient,
    zwaveEndpoint: ZwaveEndpointData
  ): ZwaveMatterDevice<DimmableLightDevice> | undefined {
    const currentValueConfig = zwaveEndpoint.values.find(
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
        `[ERROR] Zwave NodeId='${zwaveEndpoint.nodeId}' is a multiswitch dimmer but min/max values are not defined in metadata. Skipping...`
      );
      return;
    }

    const levelConverter = new LevelConverter(currentValueConfig.metadata.min, currentValueConfig.metadata.max);

    const zwaveDevice = new ZwaveDevice(zwaveClient, zwaveEndpoint, {
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
        onOff: zwaveDimmerValue > this.levelConverter.zwaveMinLevel,
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

    endpoint.events.onOff.onOff$Changed.on((newValue) => {
      const zwaveDimmerValue = newValue
        ? this.levelConverter.toZwaveLevel(
            endpoint.state.levelControl.currentLevel ?? this.levelConverter.matterMaxLevel
          )
        : this.levelConverter.zwaveMinLevel;
      if (this.zwaveDevice.property<number>('currentValue') !== zwaveDimmerValue) {
        console.log(
          `[MatterEvent.onOff$Changed(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] onOff->${newValue},zLevel->${zwaveDimmerValue}`
        );
        zwaveOnOff.setValue(zwaveDimmerValue);
      }
    });
    endpoint.events.levelControl.currentLevel$Changed.on((newMatterLevel) => {
      if (newMatterLevel) {
        const zwaveLevel = this.levelConverter.toZwaveLevel(newMatterLevel);
        if (this.zwaveDevice.property<number>('currentValue') !== zwaveLevel) {
          console.log(
            `[MatterEvent.currentLevel$Changed(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] mLevel->${newMatterLevel},zLevel->${zwaveLevel}`
          );
          zwaveOnOff.setValue(zwaveLevel);
        }
      }
    });
    zwaveOnOff.addChangeListener((newZwaveValue: number) => {
      const currentZwaveLevel = this.levelConverter.toZwaveLevel(
        endpoint.state.levelControl.currentLevel ?? this.levelConverter.matterMaxLevel
      );
      const newMatterLevel = this.levelConverter.toMatterLevel(newZwaveValue);
      const isOff = newZwaveValue === 0;

      if (isOff) {
        if (endpoint.state.onOff.onOff) {
          this.setMatterValues(
            endpoint,
            {
              onOff: {
                onOff: false,
              },
            },
            `onOff->false,zLevel->${newZwaveValue}`
          );
        }
      } else if (currentZwaveLevel !== newZwaveValue || !endpoint.state.onOff.onOff) {
        this.setMatterValues(
          endpoint,
          {
            levelControl: {
              currentLevel: newMatterLevel,
            },
            onOff: {
              onOff: true,
            },
          },
          `onOff->true,mLevel->${newMatterLevel},zLevel->${newZwaveValue}`
        );
      }
    });
  }
}
