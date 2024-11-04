import { Endpoint, EndpointType, SupportedBehaviors } from '@matter/main';
import { ZwaveDevice } from './zwave-device';

export interface ZwaveMatterDevice<TEndpointType extends EndpointType> {
  readonly nodeId: number;
  readonly name: string;
  readonly endpointType: TEndpointType;
  readonly reachable?: boolean;

  getCurrentState(): Endpoint.Options<TEndpointType>;
  subscribeEvents(endpoint: Endpoint<TEndpointType>): void;
}

export abstract class ZwaveMatterDeviceBase<TEndpointType extends EndpointType>
  implements ZwaveMatterDevice<TEndpointType>
{
  readonly zwaveDevice: ZwaveDevice;
  readonly endpointType: TEndpointType;

  constructor(zwaveDevice: ZwaveDevice, endpointType: TEndpointType) {
    this.zwaveDevice = zwaveDevice;
    this.endpointType = endpointType;
  }

  get nodeId() {
    return this.zwaveDevice.nodeId;
  }

  get name() {
    return this.zwaveDevice.name;
  }

  abstract getCurrentState(): Endpoint.Options<TEndpointType>;

  abstract subscribeEvents(endpoint: Endpoint<TEndpointType>): void;

  protected setMatterValues(
    endpoint: Endpoint<TEndpointType>,
    values: SupportedBehaviors.StatePatchOf<TEndpointType['behaviors']>,
    logSummary?: string
  ): void {
    endpoint
      .set(values)
      .then(() => {
        console.info(`[MatterEndpoint.set(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] ${logSummary}`);
      })
      .catch((reason) => {
        console.error(
          `[ERROR] [MatterEndpoint.set(${this.zwaveDevice.nodeId}.${this.zwaveDevice.name})] ${logSummary}: ${reason}`
        );
      });
  }
}
