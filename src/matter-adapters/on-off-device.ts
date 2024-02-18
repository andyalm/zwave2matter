import {OnOffLightDevice} from "@project-chip/matter-node.js/device";
import {ZwaveCommandClasses, ZwaveInitialResult} from "../zwave-types";
import {MatterDeviceAdapter} from "../matter-device-adapter";
import {ZwaveClient} from "../zwave-client";
import {NodeEvent} from "../zwave-types/messages/outgoing-message";
import {BridgedDevice} from "../matter-device-factory";


export class OnOffDeviceAdapter implements MatterDeviceAdapter {
  tryCreateMatterDevice(zwaveClient: ZwaveClient, initialResult: ZwaveInitialResult): BridgedDevice | undefined {
      const initialOnOff = initialResult.values.find(v => v.commandClass === ZwaveCommandClasses.BinarySwitch && v.property === "currentValue");
      if(!initialOnOff) {
        return;
      }
      const device = new OnOffLightDevice({
        onOff: initialOnOff.value,
      }, {
        uniqueStorageKey: `zwave-${initialResult.nodeId}`
      });
      device.addOnOffListener((newValue: boolean, oldValue: boolean) => {
        console.log(`Matter device '${device.name}' requested to set onOff state to ${newValue} for zwave node ${initialResult.nodeId}`);
        if(newValue !== oldValue) {
          zwaveClient.setValue({
            nodeId: initialResult.nodeId,
            commandClass: ZwaveCommandClasses.BinarySwitch,
            property: "targetValue",
            value: newValue
          });
        }
      });
      zwaveClient.subscribeEvents<NodeEvent>(event => event.source === "node" &&
        event.nodeId === initialResult.nodeId &&
        event.args?.commandClass === ZwaveCommandClasses.BinarySwitch &&
        event.args?.property === "currentValue" ? event : undefined, event => {
        console.log(`Received message from zwave node ${event.nodeId} to set onOff state for matter device '${device.name}' to ${event.args.newValue}`);
        if(device.getOnOff() !== event.args.newValue) {
          device.setOnOff(event.args.newValue);
        }
      });

      return {
        name: initialResult.name,
        device: device
      };
    }
}
