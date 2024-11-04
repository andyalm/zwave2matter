import { env } from 'process';
import { ZwaveClient } from './zwave-client';
import { Command } from 'commander';
import { ZwaveInitialResult } from './zwave-types';
import { Environment, ServerNode, Node, VendorId, Endpoint } from '@matter/main';
import { AggregatorEndpoint } from '@matter/main/endpoints';

export type EndpointOptions = {
  zwaveEndpoint?: string;
};

export function addZwaveOptions(program: Command) {
  return program.option(
    '-z, --zwave-endpoint <zwave-endpoint>',
    'Address and port to the zwave server websocket endpoint',
    ''
  );
}

export function zwaveEndpoint(options: EndpointOptions) {
  const endpoint = options.zwaveEndpoint || env.ZWAVE_ENDPOINT;
  if (!endpoint) {
    throw new Error('Please provide an endpoint');
  }

  return endpoint;
}

export function zwaveClient(options: EndpointOptions) {
  const endpoint = zwaveEndpoint(options);

  return new ZwaveClient(endpoint);
}

type ZwaveClientAction = (client: ZwaveClient, initialState: ZwaveInitialResult[]) => void | Promise<void>;

export async function withZwaveClient(options: EndpointOptions, action: ZwaveClientAction) {
  const client = zwaveClient(options);
  let initialState = await client.start();
  if (env.ZWAVE_DEVICE_NAME_FILTER) {
    const filter = env.ZWAVE_DEVICE_NAME_FILTER;

    initialState = initialState.filter((s) => s.name?.includes(filter));
  }
  try {
    const actionReturn = action(client, initialState);
    if (actionReturn instanceof Promise) {
      await actionReturn;
    }
  } finally {
    client.stop();
  }
}

export function waitForSigTerm(): Promise<void> {
  return new Promise<void>((resolve) => {
    process.on('SIGINT', resolve);
    process.on('SIGTERM', resolve);
  });
}

export async function withMatterServer(action: (server: ServerNode) => void | Promise<void>) {
  const environment = Environment.default;

  const vendorId = environment.vars.number('vendorid') ?? 0xfff1;
  const productId = environment.vars.number('productid') ?? 0x8333;
  const passcode = environment.vars.number('passcode');
  const discriminator = environment.vars.number('discriminator');

  const serverNodeConfig: Partial<Node.Configuration<ServerNode.RootEndpoint>> = {
    id: 'zwave2matter',
    commissioning: {
      passcode,
      discriminator,
    },
    productDescription: {
      name: 'zwave2matter',
      deviceType: AggregatorEndpoint.deviceType,
    },
    basicInformation: {
      vendorName: 'zwave2matter',
      vendorId: VendorId(vendorId),
      nodeLabel: 'zwave2matter',
      productName: 'zwave2matter',
      productLabel: 'zwave2matter',
      productId,
      serialNumber: 'zwave2matter',
      uniqueId: 'zwave2matter',
    },
  };

  const server = await ServerNode.create(serverNodeConfig);
  const logLevel = env.ZWAVE2MATTER_LOG_LEVEL || 'info';
  if (logLevel !== 'debug') {
    console.debug = () => {};
  }

  try {
    const actionReturn = action(server);
    if (actionReturn instanceof Promise) {
      await actionReturn;
    }
  } finally {
    await server.close();
  }
}
