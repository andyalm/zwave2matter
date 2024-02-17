import {ZwaveCommandClasses} from "../command-classes";

export type SetValueMessage = {
  messageId: string;
  command: "node.set_value";
  nodeId: number;
  valueId: {
    commandClass: ZwaveCommandClasses;
    endpoint?: number;
    property: string | number;
    propertyKey?: string | number;
  };
  value: any;
}