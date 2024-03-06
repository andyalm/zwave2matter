import { ZwaveCommandClass } from '../command-classes';

export type SetValueMessage = {
  messageId: string;
  command: 'node.set_value';
  nodeId: number;
  valueId: {
    commandClass: ZwaveCommandClass;
    endpoint?: number;
    property: string | number;
    propertyKey?: string | number;
  };
  value: any;
};
