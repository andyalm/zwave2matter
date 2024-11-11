import { OnOffPlugInUnitDevice, OnOffLightDevice } from '@matter/main/devices';
import { Endpoint } from '@matter/main';
import { ZwaveCommandClass, ZwaveEndpointData } from '../zwave-types';
import { ZwaveMatterDevice, ZwaveMatterDeviceBase } from '../zwave-matter-device';
import { ZwaveClient } from '../zwave-client';
import { ZwaveDevice } from '../zwave-device';

type OnOffDeviceTypes = OnOffLightDevice | OnOffPlugInUnitDevice;

export class OnOffDeviceAdapter extends ZwaveMatterDeviceBase<OnOffDeviceTypes> {
  static tryCreateMatterDevice(
    zwaveClient: ZwaveClient,
    zwaveEndpoint: ZwaveEndpointData
  ): ZwaveMatterDevice<OnOffDeviceTypes> | undefined {
    if (
      !zwaveEndpoint.values.find(
        (v) => v.commandClass === ZwaveCommandClass.BinarySwitch && v.property === 'currentValue'
      )
    ) {
      return;
    }

    const zwaveDevice = new ZwaveDevice(zwaveClient, zwaveEndpoint, {
      commandClass: ZwaveCommandClass.BinarySwitch,
      watchProperties: ['currentValue'],
    });

    const initialOnOff = zwaveDevice.property<boolean>('currentValue');
    if (typeof initialOnOff === 'undefined') {
      return;
    }

    const matterDeviceType: OnOffDeviceTypes = this.#getDeviceType(zwaveDevice);

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
    endpoint.events.onOff.onOff$Changed.on((newValue) => {
      if (this.zwaveDevice.property<boolean>('currentValue') !== newValue) {
        console.log(
          `[MatterEvent.onOff$Changed(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] onOff->'${newValue}'`
        );
        zwaveOnOff.setValue(newValue);
      }
    });
    zwaveOnOff.addChangeListener((newValue: boolean) => {
      if (newValue !== endpoint.state.onOff.onOff) {
        this.setMatterValues(
          endpoint,
          {
            onOff: {
              onOff: newValue,
            },
          },
          `onOff->${newValue}`
        );
      }
    });
  }

  static #getDeviceType(zwaveDevice: ZwaveDevice): OnOffDeviceTypes {
    if (zwaveDevice.name.toLowerCase().includes('light')) {
      return OnOffLightDevice;
    } else {
      return OnOffPlugInUnitDevice;
    }
  }
}
