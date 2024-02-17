import {ZwaveCommandClasses} from "../command-classes";

export type OutgoingEvent = DriverEvent | ControllerEvent | NodeEvent;

export interface DriverEvent {
  source: "driver";
  event: string;
}

export interface ControllerEvent {
  source: "controller";
  event: string;
}

export interface NodeEvent<TValue=any> {
  source: "node";
  event: string;
  nodeId: number;
  args: {
    "commandClassName": string,
    "commandClass": ZwaveCommandClasses,
    "endpoint": number,
    "property": string,
    "newValue": TValue,
    "prevValue": TValue,
    "propertyName": string
  }
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
  args: any;
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
