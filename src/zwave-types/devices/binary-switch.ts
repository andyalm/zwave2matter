import {ZwaveCommandClasses} from "../command-classes";

export type ValueUpdatedBinarySwitchEvent = {
  source: "node",
  event: "value updated",
  nodeId: number,
  args: {
    "commandClassName": string,
    "commandClass": ZwaveCommandClasses.BinarySwitch,
    "property": "currentValue",
    "endpoint": number,
    "newValue": boolean,
    "prevValue": boolean,
    "propertyName": "currentValue"
  }
}

export type BinarySwitchValue = {
  "endpoint": number,
  "commandClass": ZwaveCommandClasses.BinarySwitch,
  "commandClassName": string,
  "property": "currentValue",
  "propertyName": "currentValue",
  "metadata": {
    "type": "boolean",
    "readable": true,
    "writeable": boolean,
    "label": string,
    "stateful": boolean,
    "secret": boolean
  },
  "value": true
}

