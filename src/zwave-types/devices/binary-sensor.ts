import {ZwaveCommandClasses} from "../command-classes";

export type ValueUpdatedBinarySensorEvent = {
  source: "node",
  event: "value updated",
  nodeId: number,
  args: {
    "commandClassName": string,
    "commandClass": ZwaveCommandClasses.BinarySensor,
    "property": string,
    "endpoint": number,
    "newValue": boolean,
    "prevValue": boolean,
    "propertyName": string
  }
}