import {Command} from "commander";
import {ZwaveClient} from "../zwave-client";

export function zwaveDevices(program: Command) {
  program.command('zwave-devices')
    .description('Lists the zwave devices available on the given zwave server endpoint')
    .option('-z, --zwave-endpoint <zwave-endpoint>',
      'Address and port to the zwave server websocket endpoint',
      '')
    .action(async options => {
      const endpoint = options.zwaveEndpoint;
      if(!endpoint) {
        throw new Error("Please provide an endpoint");
      }
      const client = new ZwaveClient(endpoint);
      await client.start();
      try {
        console.log(JSON.stringify(client.nodes, null, 2));
      }
      finally {
        client.stop();
      }
    })
}