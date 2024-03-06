import { ZwaveCommandClass } from '../command-classes';

export type ValueUpdatedBinarySwitchEvent = {
  source: 'node';
  event: 'value updated';
  nodeId: number;
  args: {
    commandClassName: string;
    commandClass: ZwaveCommandClass.BinarySwitch;
    property: 'currentValue';
    endpoint: number;
    newValue: boolean;
    prevValue: boolean;
    propertyName: 'currentValue';
  };
};
