import { createSlice } from '@reduxjs/toolkit'
import { ConsolePageTab } from '../../lib/AppConst'

const DealerSlice = createSlice({
  name: 'Dealer',
  initialState: {
    // Game
    GameError: null,

    GameSetting: null,
    GameTitle: '',
    GameType: '',
    GameDB: null,

    GameSettingList: [],

    // Draw
    isReffered: true,
    loading: false,

    drawCount: 0,
    paidRate: 0,
    totalJackpotCount: 0,
    totalAmountTotal: 0,

    prevDraw: null,
    currentDraw: null,
    recentJackpotDraw: null,
    biggestJackpotDraw: null,

    DrawList: [],
    Draw: null,

    Tickets: [],
    Archive: [],

    activeTabConsole: ConsolePageTab.Play,
  },
  reducers: {
    // Game
    loadGameSettingStart: (state) => {
      state.GameSetting = null
      state.GameTitle = ''
      state.GameType = ''
      state.GameDB = null
      state.loading = true
    },
    loadGameSettingSuccess: (state, action) => {
      state.GameSetting = action.payload.game_setting
      state.GameTitle = action.payload.game_title
      state.GameType = action.payload.game_type
      state.GameDB = action.payload.db_name
      state.loading = false
    },
    loadGameSettingListStart: (state) => {
      state.GameSettingList = []
      state.GameError = null
      state.loading = true
    },
    loadGameSettingListSuccess: (state, action) => {
      state.GameSettingList = action.payload.setting_list
      state.GameError = null
      state.loading = false
    },
    setGameError: (state, action) => {
      state.GameError = action.payload
    },

    // Draw
    LoadPortalStart: (state) => {
      state.drawCount = 0
      state.paidRate = 0
      state.totalAmountTotal = 0
      state.totalJackpotCount = 0

      state.prevDraw = null
      state.currentDraw = null
      state.recentJackpotDraw = null
      state.biggestJackpotDraw = null
    },
    LoadPortalSuccess: (state, action) => {
      state.drawCount = action.payload.draw_count
      state.paidRate = action.payload.paid_rate
      state.totalAmountTotal = action.payload.total_amount_total
      state.totalJackpotCount = action.payload.total_jackpot_count

      state.prevDraw = action.payload.prev_draw
      state.currentDraw = action.payload.current_draw
      state.recentJackpotDraw = action.payload.recent_jackpot_draw
      state.biggestJackpotDraw = action.payload.biggest_jackpot_draw
    },
    LoadDrawListStart: (state, action) => {
      state.DrawList = []
    },
    LoadDrawListSuccess: (state, action) => {
      state.DrawList = action.payload.draws
    },
    LoadDrawStart: (state, action) => {
      state.Draw = null
    },
    LoadDrawSuccess: (state, action) => {
      state.Draw = action.payload.draw
    },

    loadTicketsStart: (state, action) => {
      state.Tickets = []
    },
    loadTicketsSuccess: (state, action) => {
      state.Tickets = action.payload.tickets
    },

    loadArchiveStart: (state, action) => {
      state.Archive = []
    },
    loadArchiveSuccess: (state, action) => {
      state.Archive = action.payload.archive
    },
    setActiveTabConsole: (state, action) => {
      state.activeTabConsole = action.payload
    }
  }
})

export const {
  // Game
  setGameError,
  loadGameSettingStart,
  loadGameSettingSuccess,
  loadGameSettingListStart,
  loadGameSettingListSuccess,

  // Draw
  LoadPortalStart,
  LoadPortalSuccess,
  LoadDrawListStart,
  LoadDrawListSuccess,
  LoadDrawStart,
  LoadDrawSuccess,

  loadArchiveStart,
  loadArchiveSuccess,

  loadTicketsStart,
  loadTicketsSuccess,

  setActiveTabConsole
} = DealerSlice.actions
export default DealerSlice.reducer