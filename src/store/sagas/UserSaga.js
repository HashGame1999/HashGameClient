import Dexie from 'dexie'
import { call, put, takeLatest } from 'redux-saga/effects'
import { loadLocalAccountListStart, loadLocalAccountListSuccess, loginStart, loginSuccess, logoutStart, setUserError } from "../slices/UserSlice"
import { subscribeUserAccount } from "./RippleSaga"
import { clearWallet } from './CounterSaga'
import { decryptWithPassword, safeAddItem } from '../../lib/AppUtil'
import { CommonDBSchame } from '../../lib/AppConst'

let CommonDB = null

function initCommonDB() {
  CommonDB = new Dexie('Common')
  CommonDB.version(1).stores(CommonDBSchame)
}

function* handleLogin(action) {
  if (CommonDB === null) {
    yield call(initCommonDB)
  }
  yield put(loginSuccess({ seed: action.payload.seed, address: action.payload.address }))
  yield call(subscribeUserAccount, { address: action.payload.address })
}

function* handleLogout() {
  localStorage.removeItem('Seed')
  localStorage.removeItem('Address')
  yield call(clearWallet)
}

// LocalAccount
function* LoadLocalAccountList() {
  if (CommonDB === null) {
    yield call(initCommonDB)
  }

  try {
    let local_account_list = yield call(() => CommonDB.LocalAccounts
      .orderBy('UpdatedAt')
      .reverse()
      .toArray())
    yield put(loadLocalAccountListSuccess({ local_account_list: local_account_list }))
  } catch (e) {
    console.log(e)
  }
}

function* LocalAccountAdd({ payload }) {
  console.log(payload)
  if (CommonDB === null) {
    yield call(initCommonDB)
  }
  let tmp = {
    Address: payload.address,
    Salt: payload.salt,
    CipherData: payload.cipher_data,
    UpdatedAt: Date.now()
  }
  let local_account = yield call(() => CommonDB.LocalAccounts
    .where('Address')
    .equals(tmp.Address)
    .first())
  if (local_account !== undefined) {
    let updatedCount = yield call(() => CommonDB.LocalAccounts
      .where('Address')
      .equals(tmp.Address)
      .modify(c => {
        c.Salt = tmp.Salt
        c.CipherData = tmp.CipherData
        c.UpdatedAt = tmp.UpdatedAt
      }))
  } else {
    yield call(() => safeAddItem(CommonDB, 'LocalAccounts', 'Address', tmp))
  }

  yield put(loadLocalAccountListStart())
}

function* LocalAccountDel({ payload }) {
  if (CommonDB === null) {
    yield call(initCommonDB)
  }
  let local_account = yield call(() => CommonDB.LocalAccounts
    .where('Address')
    .equals(payload.address)
    .first())
  console.log(local_account)
  if (local_account !== undefined) {
    try {
      let tmpSeed = decryptWithPassword(payload.password, local_account.Salt, local_account.CipherData)
      console.log(tmpSeed)
      if (tmpSeed !== '') {
        yield call(() => CommonDB.LocalAccounts.delete(payload.address))
        yield put(loadLocalAccountListStart())
        yield put(setUserError(null))
      } else {
        yield put(setUserError('password wrong...'))
      }
    } catch (error) {
      console.log(error)
      yield put(setUserError('password wrong...'))
    }
  }
}

export function* watchUser() {
  yield takeLatest(loginStart.type, handleLogin)
  yield takeLatest(logoutStart.type, handleLogout)

  yield takeLatest(loadLocalAccountListStart.type, LoadLocalAccountList)
  yield takeLatest('LocalAccountAdd', LocalAccountAdd)
  yield takeLatest('LocalAccountDel', LocalAccountDel)

}