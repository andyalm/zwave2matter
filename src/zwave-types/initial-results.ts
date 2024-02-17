import {ZwaveCommandClasses} from "./command-classes";

export type ZwaveInitialValueType<TCommandClass extends ZwaveCommandClasses=ZwaveCommandClasses, TValue=any> = {
  endpoint: number,
  commandClass: TCommandClass,
  commandClassName: string,
  property: string,
  propertyName: string,
  metadata: {
    type: string,
    readable: true,
    writeable: boolean,
    label: string,
    stateful: boolean,
    secret: boolean
  },
  value: TValue
}

export type ZwaveInitialResult<TCommandClass extends ZwaveCommandClasses=ZwaveCommandClasses, TValue=any> = {
  nodeId: number,
  index: number,
  status: number,
  ready: boolean,
  isListening: boolean,
  isRouting: boolean,
  isSecure: boolean,
  manufacturerId: number,
  productId: number,
  productType: number,
  firmwareVersion: string,
  zwavePlusVersion?: number,
  name: string,
  location: string,
  deviceConfig: {
    isEmbedded: boolean,
    manufacturer: string,
    description: string,
    devices: [
      {
        productType: number,
        productId: number
      }
    ],
  },
  label: string,
  interviewAttempts: number,
  endpoints: [
    {
      nodeId: number,
      index: number,
      commandClasses: [
        {
          id: TCommandClass,
          name: string,
          version: number,
          isSecure: boolean
        }
      ]
    }
  ],
  values: ZwaveInitialValueType<TCommandClass, TValue>[]
}