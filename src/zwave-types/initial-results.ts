import {ZwaveCommandClasses} from "./command-classes";
import {ZwaveInitialValueType} from "./devices";

export type ZwaveInitialResult<TCommandClass=ZwaveCommandClasses> = {
  nodeId: number,
  index: number,
  status: number,
  ready: boolean,
  isListening: boolean,
  isRouting: boolean,
  isSecure: boolean,
  manufacturerId: number,
  productId: number,
  productType: number,
  firmwareVersion: string,
  zwavePlusVersion?: number,
  name: string,
  location: string,
  "deviceConfig": {
    "isEmbedded": boolean,
    "manufacturer": string,
    "description": string,
    "devices": [
      {
        "productType": number,
        "productId": number
      }
    ],
  },
  "label": string,
  "interviewAttempts": number,
  "endpoints": [
    {
      "nodeId": number,
      "index": number,
      "commandClasses": [
        {
          "id": TCommandClass,
          "name": string,
          "version": number,
          "isSecure": boolean
        }
      ]
    }
  ],
  values: ZwaveInitialValueType[]
}