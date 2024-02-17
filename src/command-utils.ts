import { env } from 'process';
import {ZwaveClient} from "./zwave-client";
import {Command} from "commander";
import {ZwaveInitialResult} from "./zwave-types";
import {MatterServer,CommissioningServer} from "@project-chip/matter-node.js";
import {DeviceTypes} from "@project-chip/matter-node.js/device";
import {StorageManager, StorageBackendMemory, StorageBackendDisk} from "@project-chip/matter-node.js/storage";

export type EndpointOptions = {
  zwaveEndpoint?: string
}

export function addZwaveOptions(program: Command) {
  return program.option('-z, --zwave-endpoint <zwave-endpoint>',
    'Address and port to the zwave server websocket endpoint',
    '');
}

export function zwaveEndpoint(options: EndpointOptions) {
  const endpoint = options.zwaveEndpoint || env.ZWAVE_ENDPOINT;
  if(!endpoint) {
    throw new Error("Please provide an endpoint");
  }

  return endpoint;
}

export function zwaveClient(options: EndpointOptions) {
  const endpoint = zwaveEndpoint(options);

  return new ZwaveClient(endpoint);
}

type ZwaveClientAction = (client: ZwaveClient, initialState: ZwaveInitialResult[]) => void|Promise<void>

export async function withZwaveClient(options: EndpointOptions, action: ZwaveClientAction) {
  const client = zwaveClient(options);
  const initialState = await client.start();
  try {
    const actionReturn = action(client, initialState);
    if(actionReturn instanceof Promise) {
      await actionReturn;
    }
  }
  finally {
    client.stop();
  }
}

export function waitForSigTerm(): Promise<void> {
  return new Promise<void>((resolve) => {
    process.on("SIGINT", resolve);
    process.on("SIGTERM", resolve);
  });
}

export type MatterServerOptions = {
  storagePath?: string,
  includeCommissioningServer?: boolean
}

export async function withMatterServer(options: MatterServerOptions, action: (server: MatterServer) => void|Promise<void>) {
  const storagePath = options.storagePath || env.MATTER_BRIDGE_STORAGE_PATH;
  const storageBackend = storagePath ? new StorageBackendDisk(storagePath) : new StorageBackendMemory();
  const storageManager = new StorageManager(storageBackend);
  await storageManager.initialize();

  const matterServer = new MatterServer(storageManager);
  if(options.includeCommissioningServer) {
    await matterServer.addCommissioningServer(createCommissioningServer());
  }

  try {
    const actionReturn = action(matterServer);
    if (actionReturn instanceof Promise) {
      await actionReturn;
    }
  }
  finally {
    await matterServer.close();
  }
}

export function createCommissioningServer(): CommissioningServer {
  const passcode = env.MATTER_BRIDGE_COMMISSIONING_PASSCODE ? parseInt(env.MATTER_BRIDGE_COMMISSIONING_PASSCODE) : 0;
  const discriminator = env.MATTER_BRIDGE_COMMISSIONING_DISCRIMINATOR ? parseInt(env.MATTER_BRIDGE_COMMISSIONING_DISCRIMINATOR) : 3840;
  const vendorId = env.MATTER_BRIDGE_COMMISSIONING_VENDOR_ID ? parseInt(env.MATTER_BRIDGE_COMMISSIONING_VENDOR_ID) : 0xfff1;
  const productId = env.MATTER_BRIDGE_COMMISSIONING_PRODUCT_ID ? parseInt(env.MATTER_BRIDGE_COMMISSIONING_PRODUCT_ID) : 0x8000;
  if(passcode < 100000) {
    throw new Error("Please provide a passcode by setting MATTER_BRIDGE_COMMISSIONING_PASSCODE environment variable and ensure its at least 6 digits");
  }
  return new CommissioningServer(
    {
      port: env.MATTER_BRIDGE_COMMISSIONING_PORT ? parseInt(env.MATTER_BRIDGE_COMMISSIONING_PORT) : 5540,
      deviceName: 'zwave2matter',
      deviceType: DeviceTypes.AGGREGATOR.code,
      passcode,
      discriminator,
      basicInformation: {
        vendorName: 'zwave2matter',
        vendorId,
        nodeLabel: 'zwave2matter',
        productName: 'zwave2matter',
        productLabel: 'zwave2matter',
        productId
      }
    }
  );
}