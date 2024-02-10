import {Command} from "commander";
import {ZwaveClient} from "../zwave-client";
import {addZwaveOptions, withZwaveClient} from "../command-utils";
import {toMatterDevices} from "../matter-device-factory";
import {ZwaveInitialResult} from "../zwave-types";

export function matterDevices(program: Command) {
  addZwaveOptions(program.command('matter-devices')
    .description('Lists the matter devices that can be exposed from the given zwave server endpoint'))
    .action(async options => {
      await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
        const matterDevices = toMatterDevices(initialState);
        const results = matterDevices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.constructor.name,
        }));
        console.log(results);
      });
    })
}