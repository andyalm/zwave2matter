import {Command} from "commander";
import {ZwaveClient} from "../zwave-client";
import {addZwaveOptions, withZwaveClient, withMatterServer} from "../command-utils";
import {toMatterDevices} from "../matter-device-adapter";
import {ZwaveInitialResult} from "../zwave-types";

export function matterDevices(program: Command) {
  addZwaveOptions(program.command('matter-devices')
    .description('Lists the matter devices that can be exposed from the given zwave server endpoint'))
    .option('--zwave-info', 'Includes details about the zwave state that the matter device was created from')
    .action(async options => {
      await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
        await withMatterServer(options, async (matterServer) => {
          await matterServer.start();
          const matterDevices = toMatterDevices(client, initialState);
          const results = matterDevices.map(d => ({
            id: d.device.id,
            name: d.name,
            type: d.constructor.name,
            zwave: options.zwaveInfo ? initialState.find(s => s.name === d.name) : undefined
          }));
          console.log(JSON.stringify(results, null, 2));
        });
      });
    });
}