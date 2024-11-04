import { ZwaveCommandClass } from './command-classes';

export type ZwaveInitialValueType<TCommandClass extends ZwaveCommandClass = ZwaveCommandClass, TValue = any> = {
  endpoint: number;
  commandClass: TCommandClass;
  commandClassName: string;
  property: string;
  propertyName: string;
  metadata: {
    type: string;
    readable: true;
    writeable: boolean;
    label: string;
    stateful: boolean;
    secret: boolean;
    min?: TValue;
    max?: TValue;
  };
  value: TValue;
};

export type ZwaveInitialResult<TCommandClass extends ZwaveCommandClass = ZwaveCommandClass, TValue = any> = {
  nodeId: number;
  index: number;
  status: number;
  ready: boolean;
  isListening: boolean;
  isRouting: boolean;
  isSecure: boolean;
  manufacturerId: number;
  productId: number;
  productType: number;
  firmwareVersion: string;
  zwavePlusVersion?: number;
  name: string;
  location: string;
  deviceConfig: {
    isEmbedded: boolean;
    manufacturer: string;
    description: string;
    devices: [
      {
        productType: number;
        productId: number;
      },
    ];
  };
  label: string;
  interviewAttempts: number;
  endpoints: [
    {
      nodeId: number;
      index: number;
      commandClasses: [
        {
          id: TCommandClass;
          name: string;
          version: number;
          isSecure: boolean;
        },
      ];
    },
  ];
  values: ZwaveInitialValueType<TCommandClass, TValue>[];
};

export type ZwaveEndpointData<TCommandClass extends ZwaveCommandClass = ZwaveCommandClass, TValue = any> = {
  index: number;
  nodeId: number;
  name: string;
  commandClasses: [
    {
      id: TCommandClass;
      name: string;
      version: number;
      isSecure: boolean;
    },
  ];
  values: ZwaveInitialValueType<TCommandClass, TValue>[];
};

export function getZwaveEndpoints<TCommandClass extends ZwaveCommandClass, TValue>(
  initialResults: ZwaveInitialResult<TCommandClass, TValue>[]
): ZwaveEndpointData<TCommandClass, TValue>[] {
  return initialResults.flatMap((initialResult) =>
    initialResult.endpoints.map((endpoint) => ({
      index: endpoint.index,
      nodeId: endpoint.nodeId,
      name: initialResult.name,
      commandClasses: endpoint.commandClasses,
      values: initialResult.values.filter((v) => v.endpoint === endpoint.index),
    }))
  );
}
