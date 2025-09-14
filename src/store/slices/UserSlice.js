import { createSlice } from '@reduxjs/toolkit'
import { OpenPageTab, SettingPageTab } from '../../lib/AppConst'

const UserSlice = createSlice({
  name: 'User',
  initialState: {
    IsAuth: false,
    Seed: null,
    Address: null,
    UserError: null,

    FlashNoticeMessage: null,
    FlashNoticeDuration: 0,
    DisplayJson: null,

    LocalAccountList: [],

    activeTabOpen: OpenPageTab.Saved,
    activeTabSetting: SettingPageTab.XRPNetwork,
  },
  reducers: {
    loginStart: (state) => {
      state.UserError = null
      state.IsAuth = false
      state.Seed = null
      state.Address = null
    },
    loginSuccess: (state, action) => {
      state.UserError = null
      state.IsAuth = true
      state.Seed = action.payload.seed
      state.Address = action.payload.address
    },
    logoutStart: (state) => {
      state.UserError = null
      state.IsAuth = false
      state.Seed = null
      state.Address = null
    },

    setFlashNoticeMessage: (state, action) => {
      state.FlashNoticeMessage = action.payload.message
      state.FlashNoticeDuration = action.payload.duration
    },
    setDisplayJson: (state, action) => {
      state.DisplayJson = action.payload.json
      state.DisplayJsonOption = action.payload.isExpand
    },

    // local account
    loadLocalAccountListStart: (state) => {
      state.LocalAccountList = []
    },
    loadLocalAccountListSuccess: (state, action) => {
      state.LocalAccountList = action.payload.local_account_list
    },

    setUserError: (state, action) => {
      state.UserError = action.payload
    },

    setActiveTabOpen: (state, action) => {
      state.activeTabOpen = action.payload
    },
    setActiveTabSetting: (state, action) => {
      state.activeTabSetting = action.payload
    }
  }
})

export const {
  loginStart,
  loginSuccess,
  logoutStart,

  setFlashNoticeMessage,
  setDisplayJson,

  loadLocalAccountListStart,
  loadLocalAccountListSuccess,

  setUserError,

  setActiveTabOpen,
  setActiveTabSetting
} = UserSlice.actions
export default UserSlice.reducer