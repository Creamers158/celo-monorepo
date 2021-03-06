/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import Contract, { CustomOptions, contractOptions } from 'web3/eth/contract'
import { TransactionObject, BlockType } from 'web3/eth/types'
import { Callback, EventLog } from 'web3/types'
import { EventEmitter } from 'events'
import { Provider } from 'web3/providers'

export class Escrow extends Contract {
  constructor(jsonInterface: any[], address?: string, options?: CustomOptions)
  _address: string
  options: contractOptions
  methods: {
    escrowedPayments(
      arg0: string
    ): TransactionObject<{
      recipientIdentifier: string
      sender: string
      token: string
      value: string
      sentIndex: string
      receivedIndex: string
      timestamp: string
      expirySeconds: string
      minAttestations: string
      0: string
      1: string
      2: string
      3: string
      4: string
      5: string
      6: string
      7: string
      8: string
    }>

    receivedPaymentIds(arg0: string | number[], arg1: number | string): TransactionObject<string>

    sentPaymentIds(arg0: string, arg1: number | string): TransactionObject<string>

    getReceivedPaymentIds(identifier: string | number[]): TransactionObject<(string)[]>

    getSentPaymentIds(sender: string): TransactionObject<(string)[]>

    renounceOwnership(): TransactionObject<void>

    setRegistry(registryAddress: string): TransactionObject<void>

    transferOwnership(newOwner: string): TransactionObject<void>

    initialize(registryAddress: string): TransactionObject<void>

    transfer(
      identifier: string | number[],
      token: string,
      value: number | string,
      expirySeconds: number | string,
      paymentId: string,
      minAttestations: number | string
    ): TransactionObject<boolean>

    withdraw(
      paymentId: string,
      v: number | string,
      r: string | number[],
      s: string | number[]
    ): TransactionObject<boolean>

    revoke(paymentId: string): TransactionObject<boolean>

    initialized(): TransactionObject<boolean>
    registry(): TransactionObject<string>
    owner(): TransactionObject<string>
    isOwner(): TransactionObject<boolean>
  }
  deploy(options: { data: string; arguments: any[] }): TransactionObject<Contract>
  events: {
    Transfer(
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ): EventEmitter

    Withdrawal(
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ): EventEmitter

    Revocation(
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ): EventEmitter

    RegistrySet(
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ): EventEmitter

    OwnershipTransferred(
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ): EventEmitter

    allEvents: (
      options?: {
        filter?: object
        fromBlock?: BlockType
        topics?: (null | string)[]
      },
      cb?: Callback<EventLog>
    ) => EventEmitter
  }
  getPastEvents(
    event: string,
    options?: {
      filter?: object
      fromBlock?: BlockType
      toBlock?: BlockType
      topics?: (null | string)[]
    },
    cb?: Callback<EventLog[]>
  ): Promise<EventLog[]>
  setProvider(provider: Provider): void
  clone(): Escrow
}
