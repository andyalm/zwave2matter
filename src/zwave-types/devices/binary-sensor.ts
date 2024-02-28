import {ZwaveCommandClass} from "../command-classes";

export type ValueUpdatedBinarySensorEvent = {
  source: "node",
  event: "value updated",
  nodeId: number,
  args: {
    "commandClassName": string,
    "commandClass": ZwaveCommandClass.BinarySensor,
    "property": string,
    "endpoint": number,
    "newValue": boolean,
    "prevValue": boolean,
    "propertyName": string
  }
}
