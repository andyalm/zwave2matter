import { Command } from 'commander';
import { addZwaveOptions, withMatterServer, withZwaveClient } from '../command-utils';
import { ZwaveClient } from '../zwave-client';
import { ZwaveEndpointData } from '../zwave-types';
import { tryCreateMatterDevice } from '../matter-device-adapter';
import { Endpoint } from '@matter/main';
import { AggregatorEndpoint } from '@matter/main/endpoints';
import { BridgedDeviceBasicInformationServer } from '@matter/main/behaviors';

export function matterBridge(program: Command) {
  addZwaveOptions(
    program
      .command('matter-bridge')
      .description('Starts a matter bridge that exposes zwave devices as matter devices')
      .action(async (options) => {
        await withZwaveClient(options, async (client: ZwaveClient, zwaveEndpoints: ZwaveEndpointData[]) => {
          await withMatterServer(async (matterServer) => {
            const aggregator = new Endpoint(AggregatorEndpoint, { id: 'aggregator' });
            await matterServer.add(aggregator);

            for (const zwaveEndpoint of zwaveEndpoints) {
              const matterDevice = tryCreateMatterDevice(client, zwaveEndpoint);
              if (matterDevice) {
                const deviceEndpoint = new Endpoint(
                  matterDevice.endpointType.with(BridgedDeviceBasicInformationServer),
                  {
                    id: matterDevice.uniqueId,
                    bridgedDeviceInformation: {
                      nodeLabel: matterDevice.name,
                      productName: matterDevice.name,
                      productLabel: matterDevice.name,
                      serialNumber: `zwave-node-${matterDevice.nodeId}-${matterDevice.endpointId}`,
                      reachable: matterDevice.reachable ?? true,
                    },
                    ...matterDevice.getCurrentState(),
                  }
                );
                await aggregator.add(deviceEndpoint);

                matterDevice.subscribeEvents(deviceEndpoint);
              }
            }

            await matterServer.run();
          });
        });
      })
  );
}
