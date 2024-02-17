import {Command} from "commander";
import {
  addZwaveOptions,
  createCommissioningServer,
  waitForSigTerm,
  withMatterServer,
  withZwaveClient
} from "../command-utils";
import {ZwaveClient} from "../zwave-client";
import {ZwaveInitialResult} from "../zwave-types";
import {toMatterDevices} from "../matter-device-factory";
import {Aggregator} from "@project-chip/matter-node.js/device";
import {QrCode} from "@project-chip/matter-node.js/schema";

export function matterBridge(program: Command) {
  addZwaveOptions(program.command('matter-bridge')
    .description('Starts a matter bridge that exposes zwave devices as matter devices')
    .action(async options => {
      await withZwaveClient(options, async (client: ZwaveClient, initialState: ZwaveInitialResult[]) => {
        await withMatterServer({
          includeCommissioningServer: true,
          storagePath: options.storagePath,
        }, async (matterServer) => {
          const aggregator = new Aggregator();
          const matterDevices = toMatterDevices(client, initialState);
          for (const device of matterDevices) {
            aggregator.addBridgedDevice(device);
          }
          const commissioningServer = createCommissioningServer();
          matterServer.addCommissioningServer(commissioningServer);
          await matterServer.start();
          if (!commissioningServer.isCommissioned()) {
            const { qrPairingCode, manualPairingCode } = commissioningServer.getPairingCode();

            console.log(QrCode.get(qrPairingCode));
            console.log(
              `QR Code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=${qrPairingCode}`,
            );
            console.log(`Manual pairing code: ${manualPairingCode}`);
          } else {
            console.log("zwave2matter bridge is already commissioned. Waiting for controllers to connect ...");
          }
          await waitForSigTerm();
        });
      });
    }));
}