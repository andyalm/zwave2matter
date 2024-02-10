

// https://github.com/microsoft/TypeScript/issues/1897#issuecomment-822032151
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }
  | {};

export interface OutgoingEvent {
  source: "controller" | "node" | "driver";
  event: string;
  [key: string]: JSONValue;
}

interface OutgoingVersionMessage {
  type: "version";
  driverVersion: string;
  serverVersion: string;
  homeId: number | undefined;
  minSchemaVersion: number;
  maxSchemaVersion: number;
}

interface OutgoingEventMessage {
  type: "event";
  event: OutgoingEvent;
}

interface OutgoingResultMessageError {
  type: "result";
  messageId: string;
  success: false;
  errorCode: string;
  message?: string;
  args: JSONValue;
}

interface OutgoingResultMessageZWaveError {
  type: "result";
  messageId: string;
  success: false;
  errorCode: "zwave_error";
  zwaveErrorCode: string;
  zwaveErrorCodeName?: string;
  zwaveErrorMessage: string;
}

export interface ServerResultTypes {
  start_listening: { state: string };
  update_log_config: Record<string, never>;
  get_log_config: { config: unknown };
  initialize: Record<string, never>;
  set_api_schema: Record<string, never>;
}

// export type ResultTypes = ServerResultTypes &
//   NodeResultTypes &
//   ControllerResultTypes &
//   DriverResultTypes &
//   MulticastGroupResultTypes &
//   BroadcastNodeResultTypes &
//   EndpointResultTypes &
//   UtilsResultTypes;
export type ResultTypes = unknown;


export interface OutgoingResultMessageSuccess {
  type: "result";
  messageId: string;
  success: true;
  result: any;// ResultTypes[keyof ResultTypes];
}

export type OutgoingMessage =
  | OutgoingVersionMessage
  | OutgoingEventMessage
  | OutgoingResultMessageSuccess
  | OutgoingResultMessageError
  | OutgoingResultMessageZWaveError;