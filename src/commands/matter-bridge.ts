import { Command } from 'commander';
import { addZwaveOptions, waitForSigTerm, withMatterServer, withZwaveClient } from '../command-utils';
import { ZwaveClient } from '../zwave-client';
import { ZwaveInitialResult } from '../zwave-types';
import { tryCreateMatterDevices } from '../matter-device-adapter';
import { Endpoint } from '@matter/main';
import { AggregatorEndpoint } from '@matter/main/endpoints';
import { BridgedDeviceBasicInformationServer } from '@matter/main/behaviors';

export function matterBridge(program: Command) {
  addZwaveOptions(
    program
      .command('matter-bridge')
      .description('Starts a matter bridge that exposes zwave devices as matter devices')
      .action(async (options) => {
        await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
          await withMatterServer(async (matterServer) => {
            const aggregator = new Endpoint(AggregatorEndpoint, { id: 'aggregator' });
            await matterServer.add(aggregator);

            for (const initialResult of initialState) {
              const matterDevices = tryCreateMatterDevices(client, initialResult);
              if (matterDevices) {
                for (const matterDevice of matterDevices) {
                  const deviceEndpoint = new Endpoint(
                    matterDevice.endpointType.with(BridgedDeviceBasicInformationServer),
                    {
                      id: matterDevice.nodeId.toString(),
                      bridgedDeviceInformation: {
                        nodeLabel: matterDevice.name,
                        productName: matterDevice.name,
                        productLabel: matterDevice.name,
                        serialNumber: `zwave-node-${matterDevice.nodeId}`,
                        reachable: matterDevice.reachable ?? true,
                      },
                      ...matterDevice.getCurrentState(),
                    }
                  );
                  await aggregator.add(deviceEndpoint);

                  matterDevice.subscribeEvents(deviceEndpoint);
                }
              }
            }

            await matterServer.start();
            await waitForSigTerm();
          });
        });
      })
  );
}
