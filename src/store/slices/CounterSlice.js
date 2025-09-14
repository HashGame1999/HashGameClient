import { createSlice } from '@reduxjs/toolkit'
import { WalletPageTab } from '../../lib/AppConst'
import { DefaultCoinCode } from '../../lib/RippleConst'

const CounterSlice = createSlice({
  name: 'Counter',
  initialState: {
    isPageVisible: false,
    isLoading: false,
    loadingText: '',

    submitResult: null,

    walletInfo: null,
    errorWalletInfo: null,
    OfferList: [],

    ConvertPathResult: null,

    TrustLineList: [],
    errorTrustLineList: null,

    HistroyTxs: [],

    SendCurrencyList: [],
    IssuerCurrencyList: [],

    baseAsset: DefaultCoinCode,
    counterAsset: DefaultCoinCode,

    error: null,

    activeTabWallet: WalletPageTab.Account,
  },
  reducers: {
    updateWalletInfo: (state, action) => {
      if (action.payload.error) {
        state.errorWalletInfo = action.payload.error
        state.walletInfo = null
      } else {
        state.walletInfo = action.payload.info
        state.errorWalletInfo = null
      }
    },
    updateOfferList: (state, action) => {
      if (action.payload.error) {
        state.OfferList = null
      } else {
        state.OfferList = action.payload.offers
      }
    },
    updateTrustLineList: (state, action) => {
      if (action.payload.error) {
        state.errorTrustLineList = action.payload.error
        state.TrustLineList = null
      } else {
        state.TrustLineList = action.payload.lines
        state.errorTrustLineList = null
      }
    },
    resetWallet: (state, action) => {
      state.walletInfo = null
      state.errorWalletInfo = null
      state.OfferList = null
      state.TrustLineList = null
      state.errorTrustLineList = null
    },
    loadHistroyTxsStart: (state, action) => {
      state.HistroyTxs = []
    },
    loadHistroyTxsSuccess: (state, action) => {
      state.HistroyTxs = action.payload.txs
    },

    // SendCurrencyList
    loadSendCurrencyListStart: (state, action) => {
      state.isLoading = true
      state.loadingText = 'fetching asset list...'
      state.SendCurrencyList = []
      state.error = null
    },
    loadSendCurrencyListSuccess: (state, action) => {
      state.isLoading = false
      state.loadingText = ''
      state.SendCurrencyList = action.payload.lines
      state.error = action.payload.error
    },
    resetSendCurrencyList: (state) => {
      state.SendCurrencyList = []
    },

    // ConvertPath
    loadConvertPathStart: (state, action) => {
      state.isLoading = true
      state.loadingText = 'fetching convert paths...'
      state.ConvertPathResult = null
      state.error = null
    },
    loadConvertPathSuccess: (state, action) => {
      state.isLoading = false
      state.loadingText = ''
      state.ConvertPathResult = action.payload.result
      state.error = action.payload.error
    },
    resetConvertPath: (state) => {
      state.ConvertPathResult = null
    },

    // IssuerCurrencyList
    loadIssuerCurrencyListStart: (state, action) => {
      state.isLoading = true
      state.loadingText = 'fetching asset list...'
      state.IssuerCurrencyList = []
      state.error = null
    },
    loadIssuerCurrencyListSuccess: (state, action) => {
      state.isLoading = false
      state.loadingText = ''
      state.IssuerCurrencyList = action.payload.currency_list
      state.error = action.payload.error
    },
    resetIssuerCurrencyList: (state) => {
      state.IssuerCurrencyList = []
    },

    // submit
    submitActionStart: (state) => {
      state.isLoading = true
      state.loadingText = 'submitting...'
      state.error = null
      state.submitResult = null
    },
    submitActionSuccess: (state, action) => {
      state.isLoading = false
      state.loadingText = ''
      state.error = action.payload.error
      state.submitResult = action.payload.result
    },
    resetSubmitResult: (state) => {
      state.submitResult = null
    },

    setBaseAsset: (state, action) => {
      state.baseAsset = action.payload
    },
    setCounterAsset: (state, action) => {
      state.counterAsset = action.payload
    },

    setIsPageVisible: (state, action) => {
      state.isPageVisible = action.payload
    },

    setActiveTabWallet: (state, action) => {
      state.activeTabWallet = action.payload
    }
  }
})

export const {
  updateWalletInfo,
  updateOfferList,
  updateTrustLineList,
  resetWallet,

  loadHistroyTxsStart,
  loadHistroyTxsSuccess,

  loadSendCurrencyListStart,
  loadSendCurrencyListSuccess,
  resetSendCurrencyList,

  loadConvertPathStart,
  loadConvertPathSuccess,
  resetConvertPath,

  loadIssuerCurrencyListStart,
  loadIssuerCurrencyListSuccess,
  resetIssuerCurrencyList,

  submitActionStart,
  submitActionSuccess,
  resetSubmitResult,

  setBaseAsset,
  setCounterAsset,

  setIsPageVisible,

  setActiveTabWallet,
} = CounterSlice.actions
export default CounterSlice.reducer