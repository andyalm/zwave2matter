import {program} from "commander";
import {zwaveDevices} from "./commands/zwave-devices";
import {zwaveListen} from "./commands/zwave-listen";
import {matterDevices} from "./commands/matter-devices";
import {matterBridge} from "./commands/matter-bridge";

program
  .name("zwave2matter")
  .description("CLI for running zwave2matter and utilities");

zwaveDevices(program);
zwaveListen(program);
matterDevices(program);
matterBridge(program);

const argsFrom = process.argv[0] === 'zwave2matter' ? 'user' : 'node';

program.parseAsync(process.argv, { from: argsFrom }).then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});