import { Command } from 'commander';
import { ZwaveClient } from '../zwave-client';
import { addZwaveOptions, withZwaveClient } from '../command-utils';
import { ZwaveInitialResult } from '../zwave-types';

export function zwaveDevices(program: Command) {
  addZwaveOptions(
    program.command('zwave-devices').description('Lists the zwave devices available on the given zwave server endpoint')
  ).action(async (options) => {
    await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
      console.log(JSON.stringify(initialState, null, 2));
    });
  });
}
