import { ZwaveCommandClass } from '../command-classes';

export type ValueUpdatedMultilevelSwitchEvent = {
  source: 'node';
  event: 'value updated';
  nodeId: number;
  args: {
    commandClassName: string;
    commandClass: ZwaveCommandClass.MultilevelSwitch;
    property: 'currentValue' | 'targetValue';
    propertyName: 'currentValue' | 'targetValue';
    endpoint: number;
    newValue: number;
    prevValue: number;
  };
};
