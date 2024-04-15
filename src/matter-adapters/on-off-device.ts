import { OnOffLightDevice } from '@project-chip/matter.js/devices/OnOffLightDevice';
import { OnOffPlugInUnitDevice } from '@project-chip/matter.js/devices/OnOffPlugInUnitDevice';
import { Endpoint } from '@project-chip/matter.js/endpoint';
import { ZwaveCommandClass, ZwaveInitialResult } from '../zwave-types';
import { ZwaveMatterDevice, ZwaveMatterDeviceBase } from '../matter-device-adapter';
import { ZwaveClient } from '../zwave-client';
import { ZwaveDevice } from '../zwave-device';

type OnOffDeviceTypes = OnOffLightDevice | OnOffPlugInUnitDevice;

export class OnOffDeviceAdapter extends ZwaveMatterDeviceBase<OnOffDeviceTypes> {
  static tryCreateMatterDevice(
    zwaveClient: ZwaveClient,
    initialResult: ZwaveInitialResult
  ): ZwaveMatterDevice<OnOffDeviceTypes> | undefined {
    if (
      !initialResult.values.find(
        (v) => v.commandClass === ZwaveCommandClass.BinarySwitch && v.property === 'currentValue'
      )
    ) {
      return;
    }

    const zwaveDevice = new ZwaveDevice(zwaveClient, initialResult, {
      commandClass: ZwaveCommandClass.BinarySwitch,
      watchProperties: ['currentValue'],
    });

    const initialOnOff = zwaveDevice.property<boolean>('currentValue');
    if (typeof initialOnOff === 'undefined') {
      return;
    }

    const matterDeviceType = this.#getDeviceType(zwaveDevice);

    return new OnOffDeviceAdapter(zwaveDevice, matterDeviceType);
  }

  getCurrentState(): Endpoint.Options<OnOffDeviceTypes> {
    return {
      onOff: {
        onOff: this.zwaveDevice.property<boolean>('currentValue'),
      },
    };
  }

  subscribeEvents(endpoint: Endpoint<OnOffDeviceTypes>) {
    const zwaveOnOff = this.zwaveDevice.createPropertyManager<boolean>('currentValue', 'targetValue');
    endpoint.events.onOff.onOff$Change.on((newValue) => {
      if (this.zwaveDevice.property<boolean>('currentValue') !== newValue) {
        console.log(
          `[MatterEvent.onOff$Change(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] onOff->'${newValue}'`
        );
        zwaveOnOff.setValue(newValue);
      }
    });
    zwaveOnOff.addChangeListener((newValue: boolean) => {
      this.setMatterValues(
        endpoint,
        {
          onOff: {
            onOff: newValue,
          },
        },
        `onOff->${newValue}`
      );
    });
  }

  static #getDeviceType(zwaveDevice: ZwaveDevice): OnOffLightDevice | OnOffPlugInUnitDevice {
    if (zwaveDevice.name.toLowerCase().includes('light')) {
      return OnOffLightDevice;
    } else {
      return OnOffPlugInUnitDevice;
    }
  }
}
