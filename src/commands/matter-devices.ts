import { Command } from 'commander';
import { ZwaveClient } from '../zwave-client';
import { addZwaveOptions, withZwaveClient } from '../command-utils';
import { tryCreateMatterDevice } from '../matter-device-adapter';
import { getZwaveEndpoints, ZwaveInitialResult } from '../zwave-types';

export function matterDevices(program: Command) {
  addZwaveOptions(
    program
      .command('matter-devices')
      .description('Lists the matter devices that can be exposed from the given zwave server endpoint')
  )
    .option('--zwave-info', 'Includes details about the zwave state that the matter device was created from')
    .action(async (options) => {
      await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
        const devices: any[] = [];
        for (const zwaveEndpoint of getZwaveEndpoints(initialState)) {
          const matterResult = tryCreateMatterDevice(client, zwaveEndpoint);
          if (matterResult) {
            devices.push({
              nodeId: matterResult.nodeId,
              name: matterResult.name,
              endpointType: {
                deviceType: matterResult.endpointType.deviceType,
                deviceClasses: matterResult.endpointType.deviceClass,
              },
            });
          }
        }
        console.log(JSON.stringify(devices, null, 2));
      });
    });
}
