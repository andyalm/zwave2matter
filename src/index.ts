import {program} from "commander";
import {zwaveDevices} from "./commands/zwave-devices";

program
  .name("zwave2matter")
  .description("CLI for running zwave2matter and utilities");

zwaveDevices(program);

program.parse();