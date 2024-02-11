import {program} from "commander";
import {zwaveDevices} from "./commands/zwave-devices";
import {zwaveListen} from "./commands/zwave-listen";
import {matterDevices} from "./commands/matter-devices";

program
  .name("zwave2matter")
  .description("CLI for running zwave2matter and utilities");

zwaveDevices(program);
zwaveListen(program);
matterDevices(program);

program.parseAsync().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});