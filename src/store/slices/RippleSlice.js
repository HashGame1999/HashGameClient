import { createSlice } from '@reduxjs/toolkit'

const RippleSlice = createSlice({
  name: 'Ripple',
  initialState: {
    ConnStatus: false,
    isExplicitDisconnect: false,
    latestLedger: null,

    latestTx: null,

    OfferBookLeft: [],
    OfferBookRight: [],
  },
  reducers: {
    updateConnStatus: (state, action) => {
      state.ConnStatus = action.payload
    },
    updateIsExplicitDisconnect: (state, action) => {
      state.isExplicitDisconnect = action.payload
    },
    updateLatestLedger: (state, action) => {
      state.latestLedger = action.payload
    },
    updateLatestTx: (state, action) => {
      state.latestTx = action.payload
    },

    setOfferBookLeft: (state, action) => {
      state.OfferBookLeft = action.payload
    },
    setOfferBookRight: (state, action) => {
      state.OfferBookRight = action.payload
    },
  }
})

export const {
  setServerURL,
  updateConnStatus,
  updateIsExplicitDisconnect,
  updateLatestLedger,
  updateLatestTx,
  setOfferBookLeft,
  setOfferBookRight
} = RippleSlice.actions
export default RippleSlice.reducer