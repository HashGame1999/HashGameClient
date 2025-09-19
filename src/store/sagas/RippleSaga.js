import { eventChannel } from 'redux-saga'
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects'
import { Client, xrpToDrops, RIPPLED_API_V2, TrustSetFlags, PaymentFlags } from 'xrpl'
import { DefaultCoinCode, MainNetURL, TxType } from '../../lib/RippleConst'
import { setOfferBookLeft, setOfferBookRight, updateConnStatus, updateLatestLedger, updateLatestTx } from '../slices/RippleSlice'
import { NewLedgerClosed, SaveBreakdownPayment, SavePoolPayment } from './DealerSaga'
import { getWallet } from '../../lib/RippleUtil'
import { WalletPageTab } from '../../lib/AppConst'

let xrplClient = null
let xrplEventChannel = null

function createXRPLEventChannel(client) {
  return eventChannel((emit) => {
    const onConnect = () => {
      emit(updateConnStatus(true))
    }
    const onDisconnect = () => {
      emit(updateConnStatus(false))
      emit(updateLatestLedger(null))
    }
    const onError = () => {
      emit(updateConnStatus(false))
      emit(updateLatestLedger(null))
    }
    const onLedgerClose = (ledger) => {
      emit(updateLatestLedger(ledger))
    }
    const onTransaction = (transaction) => {
      emit(updateLatestTx(transaction))
    }

    client.on('connected', onConnect)
    client.on('disconnected', onDisconnect)
    client.on('error', onError)
    client.on('ledgerClosed', onLedgerClose)
    client.on('transaction', onTransaction)

    return () => {
      client.off('connected', onConnect)
      client.off('disconnected', onDisconnect)
      client.off('error', onError)
      client.off('ledgerClosed', onLedgerClose)
      client.off('transaction', onTransaction)
    }
  })
}

function* handelXrplEvent(action) {
  {
    const game_setting = yield select(state => state.Dealer.GameSetting)
    yield put(action)

    if (action.type === updateConnStatus.type && action.payload === true) {
      // connnected
      yield call(subscribeLedgerClose)
      yield call(subscribeGameAccounts)
    } else if (action.type === updateConnStatus.type && action.payload === false) {
      // disconnnected
      yield call([xrplClient, xrplClient.disconnect])
    } else if (action.type === updateLatestLedger.type) {
      if (action.payload != null) {
        yield call(NewLedgerClosed, { ledger_index: action.payload.ledger_index })
      }
    } else if (action.type === updateLatestTx.type) {
      // console.log(action)
      const tx = action.payload
      if (game_setting && tx.tx_json.Account === game_setting.PoolAccount && tx.tx_json.Destination === game_setting.SendAccount) {
        // save pool payment
        yield call(SavePoolPayment, { tx: tx })
      } else if (game_setting && tx.tx_json.Account === game_setting.SendAccount) {
        // save breakdown payment
        yield call(SaveBreakdownPayment, { tx: tx })
      }
    }
  }
}

export function* connectXRPL() {
  try {
    const isExplicitDisconnect = yield select(state => state.Ripple.isExplicitDisconnect)
    if (xrplClient?.isConnected() || isExplicitDisconnect) {
      return
    }
    let ServerURL = localStorage.getItem('ServerURL')
    if (ServerURL === null) {
      ServerURL = MainNetURL
      localStorage.setItem('ServerURL', ServerURL)
    }
    xrplClient = new Client(ServerURL)
    xrplEventChannel = yield call(createXRPLEventChannel, xrplClient)
    yield takeEvery(xrplEventChannel, handelXrplEvent)

    yield call([xrplClient, xrplClient.connect])
  } catch (error) {
    console.log(error)
    yield put(updateConnStatus(false))
  }
}

export function* disconnectXRPL() {
  try {
    if (!xrplClient?.isConnected()) {
      return
    }
    yield call([xrplClient, xrplClient.disconnect])
  } catch (error) {
    console.log(error)
    yield put(updateConnStatus(false))
  }
}

export function* subscribeLedgerClose() {
  try {
    if (xrplClient?.isConnected()) {
      let request = {
        command: 'subscribe',
        streams: ['ledger']
      }
      yield call([xrplClient, xrplClient.request], request)
    }
  } catch (error) {
    console.log(error)
    yield put(updateConnStatus(false))
  }
}

function* subscribeGameAccounts() {
  try {
    if (xrplClient?.isConnected()) {
      const game_setting = yield select(state => state.Dealer.GameSetting)
      if (game_setting) {
        let request = {
          command: 'subscribe',
          accounts: [game_setting.PoolAccount, game_setting.SendAccount]
        }
        yield call([xrplClient, xrplClient.request], request)
      }
    }
  } catch (error) {
    console.log(error)
    yield put(updateConnStatus(false))
  }
}

export function* subscribeUserAccount(payload) {
  try {
    if (xrplClient?.isConnected()) {
      const { address } = payload
      if (address) {
        let request = {
          command: 'subscribe',
          accounts: [address]
        }
        yield call([xrplClient, xrplClient.request], request)
      }
    }
  } catch (error) {
    console.log(error)
    yield put(updateConnStatus(false))
  }
}

export function* fetchAccountInfo(payload) {
  const { address } = payload
  try {
    if (xrplClient?.isConnected() && address) {
      let request = {
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      return { error: null, info: response.result }
    } else {
      return { error: 'disconnect from xrpl...', info: null }
    }
  } catch (error) {
    console.log(error)
    return { error: error.message, info: null }
  }
}

export function* fetchAccountLines(payload) {
  const { address } = payload
  try {
    if (xrplClient?.isConnected() && address) {
      let request = {
        command: 'account_lines',
        account: address,
        ledger_index: 'validated'
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      return { error: null, lines: response.result.lines }
    } else {
      return { error: 'disconnect from xrpl...', lines: null }
    }
  } catch (error) {
    console.log(error)
    return { error: error.message, lines: null }
  }
}

export function* fetchAccountOffers(payload) {
  const { address } = payload
  try {
    if (xrplClient?.isConnected() && address) {
      let request = {
        command: 'account_offers',
        account: address,
        ledger_index: 'validated'
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      return { error: null, offers: response.result.offers }
    } else {
      return { error: 'disconnect from xrpl...', offers: null }
    }
  } catch (error) {
    console.log(error)
    return { error: error.message, offers: null }
  }
}

export function* fetchAccountTxs(payload) {
  if (xrplClient === null || !xrplClient.isConnected()) {
    return []
  }

  let { account, ledger_index_min, ledger_index_max, marker } = payload
  let tmp_ledger_index_min = -1
  if (ledger_index_min) {
    tmp_ledger_index_min = ledger_index_min
  }
  let tmp_ledger_index_max = -1
  if (ledger_index_max) {
    tmp_ledger_index_max = ledger_index_max
  }

  let txs = []
  try {
    do {
      const request = {
        command: "account_tx",
        account: account,
        ledger_index_min: tmp_ledger_index_min,
        ledger_index_max: tmp_ledger_index_max,
        binary: false,
        limit: 100,
        ...(marker && { marker: marker })
      }

      const response = yield call([xrplClient, xrplClient.request], request)
      if (response.result.transactions) {
        txs = txs.concat(response.result.transactions)
      }

      marker = response.result.marker
    } while (marker)
    console.log(`fecth ${account} from ${tmp_ledger_index_min} transactions: ${txs.length}`)
    return txs
  } catch (error) {
    console.error("Error:", error)
    console.error(tmp_ledger_index_min)
    console.error(tmp_ledger_index_max)
    return []
  }
}

export function* fetchIssuerCurrencyList(payload) {
  const { issuer } = payload
  try {
    if (xrplClient?.isConnected()) {
      let request = {
        command: 'gateway_balances',
        account: issuer,
        ledger_index: 'validated'
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      if (response.result.obligations !== undefined) {
        let currency_list = Object.keys(response.result.obligations)
        return { error: null, currency_list: currency_list }
      } else {
        return { error: 'issuer issues none...', currency_list: [] }
      }
    } else {
      return { error: 'disconnect from xrpl...', currency_list: [] }
    }
  } catch (error) {
    return { error: error.message, currency_list: [] }
  }
}

export function* fetchOfferBookRight() {
  const baseAsset = yield select(state => state.Counter.baseAsset)
  const counterAsset = yield select(state => state.Counter.counterAsset)
  const activeTabWallet = yield select(state => state.Counter.activeTabWallet)
  if (activeTabWallet === WalletPageTab.Trade && baseAsset !== counterAsset) {
    // console.log(`sage***xrplSaga:fetchOfferBookRight`)
    let pay_asset = { currency: DefaultCoinCode }
    let get_asset = { currency: DefaultCoinCode }
    if (baseAsset !== DefaultCoinCode) {
      let [currency, issuer] = baseAsset.split('.')
      pay_asset = {
        issuer: issuer,
        currency: currency
      }
    }
    if (counterAsset !== DefaultCoinCode) {
      let [currency, issuer] = counterAsset.split('.')
      get_asset = {
        issuer: issuer,
        currency: currency
      }
    }

    // right
    try {
      let request = {
        "command": "book_offers",
        "taker_gets": pay_asset,
        "taker_pays": get_asset,
        "limit": 20
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      yield put(setOfferBookRight(response.result.offers))
    } catch (error) {
      console.log(error)
      yield put(setOfferBookRight([]))
    }
  }
}

export function* fetchOfferBookLeft() {
  const baseAsset = yield select(state => state.Counter.baseAsset)
  const counterAsset = yield select(state => state.Counter.counterAsset)
  const activeTabWallet = yield select(state => state.Counter.activeTabWallet)
  if (activeTabWallet === WalletPageTab.Trade && baseAsset !== counterAsset) {
    // console.log(`sage***xrplSaga:fetchOfferBookLeft`)
    let pay_asset = { currency: DefaultCoinCode }
    let get_asset = { currency: DefaultCoinCode }
    if (baseAsset !== DefaultCoinCode) {
      let [currency, issuer] = baseAsset.split('.')
      pay_asset = {
        issuer: issuer,
        currency: currency
      }
    }
    if (counterAsset !== DefaultCoinCode) {
      let [currency, issuer] = counterAsset.split('.')
      get_asset = {
        issuer: issuer,
        currency: currency
      }
    }

    // left
    try {
      let request = {
        "command": "book_offers",
        "taker_gets": get_asset,
        "taker_pays": pay_asset,
        "limit": 20
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      yield put(setOfferBookLeft(response.result.offers))
    } catch (error) {
      console.log(error)
      yield put(setOfferBookLeft([]))
    }
  }
}

export function* fetchConvertPath(payload) {
  // console.log(`sage***xrplSaga:fetchConvertPath`, payload)
  const { address, destination_amount, paths } = payload
  try {
    if (xrplClient?.isConnected()) {
      let request = {
        command: 'path_find',
        subcommand: 'create',
        source_account: address,
        destination_account: address,
        destination_amount: destination_amount,
        paths: paths,
        include_amm: true,
        ledger_index: 'validated'
      }
      const response = yield call([xrplClient, xrplClient.request], request)
      return { error: null, result: response.result }
    } else {
      return { error: 'disconnect from xrpl...', result: null }
    }
  } catch (error) {
    console.log(error)
    return { error: error.message, result: null }
  }
}

function* submitTx(payload) {
  const ServerURL = localStorage.getItem('ServerURL')
  const { transaction, seed } = payload
  const prepared = yield call([xrplClient, xrplClient.autofill], transaction)
  let wallet = getWallet(seed, ServerURL)
  const signed = wallet.sign(prepared)
  const tx_blob = signed.tx_blob

  const request = {
    api_version: RIPPLED_API_V2,
    command: 'submit',
    tx_blob: tx_blob,
    ledger_index: 'current'
  }
  const response = yield call([xrplClient, xrplClient.request], request)
  return response
}

export function* submitPayment(payload) {
  console.log(`sage***xrplSaga:submitPayment`, payload)
  const { seed, sour, dest, issuer, currency, amount, sour_tag, dest_tag, memos } = payload
  try {
    let transaction = {
      TransactionType: TxType.Payment,
      Account: sour,
      Destination: dest,
      Fee: '12'
    }
    if (currency === DefaultCoinCode) {
      transaction.Amount = xrpToDrops(amount)
    } else {
      transaction.Amount = {
        issuer: issuer,
        currency: currency,
        value: amount
      }
    }
    if (!Number.isNaN(sour_tag)) {
      transaction.SourceTag = sour_tag
    }
    if (!Number.isNaN(dest_tag)) {
      transaction.DestinationTag = dest_tag
    }
    if (memos?.length > 0) {
      transaction.Memos = memos
    }
    console.log(transaction)
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    console.log(error)
    return { error: error.message, result: null }
  }
}

export function* submitPathPayment(payload) {
  console.log(`sage***xrplSaga:submitPathPayment`, payload)
  const { seed, address, destination_amount, alt } = payload
  try {
    let transaction = {
      TransactionType: TxType.Payment,
      Account: address,
      Destination: address,
      Amount: destination_amount,
      SendMax: alt.source_amount,
      Paths: alt.paths_computed,
      Flags: PaymentFlags.tfNoRippleDirect,
      Fee: '12'
    }
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    console.log(error)
    return { error: error.message, result: null }
  }
}

export function* submitPlayPayment(payload) {
  console.log(`sage***xrplSaga:submitPlayPayment`, payload)
  const { seed, sour, dest, amount, sour_tag } = payload
  try {
    let transaction = {
      TransactionType: TxType.Payment,
      Account: sour,
      Destination: dest,
      Amount: xrpToDrops(amount),
      Fee: '12'
    }
    if (!Number.isNaN(sour_tag)) {
      transaction.SourceTag = sour_tag
    }
    console.log(transaction)
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    console.log(error)
    return { error: error.message, result: null }
  }
}

export function* submitOfferCreate(payload) {
  console.log(`sage***xrplSaga:submitOfferCreate`, payload)
  const { seed, address, TakerPays, TakerGets } = payload

  try {
    const transaction = {
      TransactionType: TxType.OfferCreate,
      Account: address,
      TakerPays: TakerPays,
      TakerGets: TakerGets,
      // Flags: OfferCreateFlags.tfPassive
    }
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    return { error: error.message, result: null }
  }
}

export function* submitOfferCancel(payload) {
  console.log(`sage***xrplSaga:submitOfferCancel`, payload)
  const { seed, address, offer_sequence } = payload

  try {
    const transaction = {
      TransactionType: TxType.OfferCancel,
      Account: address,
      OfferSequence: offer_sequence
    }
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    return { error: error.message, result: null }
  }
}

export function* submitTrustSet(payload) {
  console.log(payload)
  const { seed, address, issuer, currency, amount } = payload

  try {
    const transaction = {
      TransactionType: TxType.TrustSet,
      Account: address,
      LimitAmount: {
        currency: currency,
        issuer: issuer,
        value: amount
      },
      Flags: TrustSetFlags.tfSetNoRipple
    }
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    return { error: error.message, result: null }
  }
}

export function* submitAccountDelete(payload) {
  console.log(`sage***xrplSaga:submitAccountDelete`, payload)
  const { seed, address, dest } = payload

  try {
    const transaction = {
      TransactionType: TxType.AccountDelete,
      Account: address,
      Destination: dest
    }
    const response = yield call(submitTx, { transaction: transaction, seed: seed })
    console.log(response)
    return { error: null, result: response.result.engine_result }
  } catch (error) {
    return { error: error.message, result: null }
  }
}

export function* watchRipple() {
  yield takeEvery('ConnectXRPL', connectXRPL)
  yield takeEvery('DisconnectXRPL', disconnectXRPL)
  yield takeEvery('SubscribeGameAccounts', subscribeGameAccounts)
  yield takeLatest('FetchOfferBookRight', fetchOfferBookRight)
  yield takeLatest('FetchOfferBookLeft', fetchOfferBookLeft)
}