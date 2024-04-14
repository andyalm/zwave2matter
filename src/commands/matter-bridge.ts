import { Command } from 'commander';
import { addZwaveOptions, waitForSigTerm, withMatterServer, withZwaveClient } from '../command-utils';
import { ZwaveClient } from '../zwave-client';
import { ZwaveInitialResult } from '../zwave-types';
import { tryCreateMatterDevice } from '../matter-device-adapter';
import { Endpoint } from '@project-chip/matter.js/endpoint';
import { AggregatorEndpoint } from '@project-chip/matter.js/endpoint/definitions';
import { BridgedDeviceBasicInformationServer } from '@project-chip/matter.js/behavior/definitions/bridged-device-basic-information';

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
              const matterDevice = tryCreateMatterDevice(client, initialResult);
              if (matterDevice) {
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

            await matterServer.bringOnline();
            await waitForSigTerm();
          });
        });
      })
  );
}
