import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock'
import { Linking } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  InviteBy,
  redeemInvite,
  redeemInviteFailure,
  redeemInviteSuccess,
  sendInvite,
  storeInviteeData,
} from 'src/invite/actions'
import { watchRedeemInvite, watchSendInvite, withdrawFundsFromTempAccount } from 'src/invite/saga'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { transactionConfirmed } from 'src/transactions/actions'
import { getConnectedUnlockedAccount, getOrCreateAccount, waitWeb3LastBlock } from 'src/web3/saga'
import { createMockStore, mockContractKitBalance, mockContractKitContract } from 'test/utils'
import { mockAccount, mockE164Number, mockName } from 'test/values'

const mockFetch = fetch as FetchMock
const mockKey = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'
const mockBalance = jest.fn()

jest.mock('@celo/walletkit', () => {
  const { createMockContract } = require('test/utils')
  return {
    ...jest.requireActual('@celo/walletkit'),
    getAttestationsContract: async () =>
      createMockContract({ getAttestationRequestFee: Math.pow(10, 18) }),
    getStableTokenContract: jest.fn(async () =>
      createMockContract({
        balanceOf: mockBalance,
        transfer: () => null,
        transferWithComment: () => null,
        decimals: () => '10',
      })
    ),
  }
})

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/transactions/send', () => ({
  sendTransaction: async () => true,
}))

jest.mock('src/web3/contracts', () => ({
  web3: {
    eth: {
      accounts: {
        privateKeyToAccount: () =>
          '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
        wallet: {
          add: () => null,
        },
        create: () => ({
          address: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
          privateKey: '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
        }),
      },
      personal: {
        importRawKey: () => '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724',
        unlockAccount: async () => true,
      },
    },
    utils: {
      fromWei: (x: any) => x / 1e18,
      sha3: (x: any) => `a sha3 hash`,
    },
  },
  contractKit: {
    contracts: {
      getStableToken: () => mockContractKitContract,
    },
  },
  isZeroSyncMode: () => false,
}))

SendIntentAndroid.sendSms = jest.fn()

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(watchSendInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()

    mockFetch.mockResponse(
      JSON.stringify({
        shortLink: 'hi',
      })
    )
  })

  it('sends an SMS invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .provide([[call(waitWeb3LastBlock), true], [call(getConnectedUnlockedAccount), mockAccount]])
      .withState(state)
      .dispatch(sendInvite(mockName, mockE164Number, InviteBy.SMS))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .put(storeInviteeData(mockKey, mockE164Number))
      .run()

    expect(SendIntentAndroid.sendSms).toHaveBeenCalled()
  })

  it('sends a WhatsApp invite as expected', async () => {
    await expectSaga(watchSendInvite)
      .provide([[call(waitWeb3LastBlock), true], [call(getConnectedUnlockedAccount), mockAccount]])
      .withState(state)
      .dispatch(sendInvite(mockName, mockE164Number, InviteBy.WhatsApp))
      .put(storeInviteeData(mockKey, mockE164Number))
      .dispatch(transactionConfirmed('a sha3 hash'))
      .run()

    expect(Linking.openURL).toHaveBeenCalled()
  })
})

describe(watchRedeemInvite, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockContractKitBalance.mockReset()
  })

  it('works with a valid private key and enough money on it', async () => {
    mockContractKitBalance
      .mockReturnValueOnce(new BigNumber(10)) // temp account
      .mockReturnValueOnce(new BigNumber(10)) // temp account

    await expectSaga(watchRedeemInvite)
      .provide([[call(waitWeb3LastBlock), true], [call(getOrCreateAccount), mockAccount]])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(fetchDollarBalance())
      .put(redeemInviteSuccess())
      .run()
  })

  it('fails with a valid private key but unsuccessful transfer', async () => {
    mockContractKitBalance
      .mockReturnValueOnce(new BigNumber(10)) // temp account
      .mockReturnValueOnce(new BigNumber(0)) // new account

    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), mockAccount],
        [matchers.call.fn(withdrawFundsFromTempAccount), throwError(new Error('fake error'))],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
      .put(redeemInviteFailure())
      .run()
  })

  it('fails with a valid private key but no money on key', async () => {
    mockContractKitBalance
      .mockReturnValueOnce(new BigNumber(0)) // temp account
      .mockReturnValueOnce(new BigNumber(0)) // current account

    await expectSaga(watchRedeemInvite)
      .provide([[call(waitWeb3LastBlock), true], [call(getOrCreateAccount), mockAccount]])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.EMPTY_INVITE_CODE))
      .put(redeemInviteFailure())
      .run()
  })

  it('fails with error creating account', async () => {
    mockContractKitBalance.mockReturnValueOnce(new BigNumber(10)) // temp account

    await expectSaga(watchRedeemInvite)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getOrCreateAccount), throwError(new Error('fake error'))],
      ])
      .withState(state)
      .dispatch(redeemInvite(mockKey))
      .put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
      .put(redeemInviteFailure())
      .run()
  })
})
