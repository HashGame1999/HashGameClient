import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'

import { watchRipple } from './sagas/RippleSaga'
import { watchUser } from './sagas/UserSaga'
import { watchCounter } from './sagas/CounterSaga'
import { watchDealer } from './sagas/DealerSaga'

import { taskInstant, taskFast, taskSlow } from './sagas/TaskSaga'

import RippleReducer from './slices/RippleSlice'
import UserReducer from './slices/UserSlice'
import CounterReducer from './slices/CounterSlice'
import DealerReducer from './slices/DealerSlice'

export default function* rootSaga() {
  yield all([
    watchUser(),
    watchCounter(),
    watchRipple(),
    watchDealer(),

    taskInstant(),
    taskFast(),
    taskSlow(),
  ])
}

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    Ripple: RippleReducer,
    User: UserReducer,
    Counter: CounterReducer,
    Dealer: DealerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware)
})

sagaMiddleware.run(rootSaga)