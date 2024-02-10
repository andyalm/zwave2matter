import {Command} from "commander";
import {addZwaveOptions, waitForSigTerm, withZwaveClient} from "../command-utils";
import {ZwaveClient} from "../zwave-client";

export function zwaveListen(program: Command) {
  addZwaveOptions(program.command('zwave-listen')
    .description('Listens for zwave events and prints them to the console'))
    .action(async options => {
      await withZwaveClient(options, async (client: ZwaveClient) => {
        client.subscribeAllEvents(event => {
          console.log(event);
        });

        await waitForSigTerm();
      });
    })
}