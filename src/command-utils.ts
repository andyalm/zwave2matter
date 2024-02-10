import { env } from 'process';
import {ZwaveClient} from "./zwave-client";
import {Command, program} from "commander";
import {ZwaveInitialResult} from "./zwave-types";

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