import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loadGameSettingStart, setActiveTabConsole } from '../store/slices/DealerSlice'
import JackpotCode from '../components/JackpotCode'
import InternalButton from '../components/InternalButton'
import { ConsolePageTab } from '../lib/AppConst'

export default function PortalPage() {
  const [currentDrawLedgerLeft, setCurrentDrawLedgerLeft] = useState(0)

  const { latestLedger, ConnStatus } = useSelector(state => state.Ripple)
  const { GameSetting, GameTitle, drawCount, paidRate, totalJackpotCount, totalAmountTotal, prevDraw, currentDraw, recentJackpotDraw, biggestJackpotDraw } = useSelector(state => state.Dealer)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (ConnStatus) {
      dispatch(loadGameSettingStart())
    }
  }, [ConnStatus])

  useEffect(() => {
    if (latestLedger !== null && currentDraw !== null) {
      let tmp = currentDraw.CloseLedgerIndex - latestLedger.ledger_index
      if (tmp >= 0) {
        setCurrentDrawLedgerLeft(tmp)
      } else {
        setCurrentDrawLedgerLeft('paying' + '.'.repeat(Math.abs(tmp) % 4))
      }
    }
  }, [latestLedger, currentDraw])

  const switchHistroy = () => {
    navigate(`/histroy`, {
      state: { fromList: true },
      // replace: true
    })
  }

  const switchDraw = (open_ledger_index) => {
    navigate(`/draw/${open_ledger_index}`, {
      state: { fromList: true },
    })
  }

  const switchGameSetting = () => {
    dispatch(setActiveTabConsole(ConsolePageTab.Setting))
    navigate(`/console`, {
      // replace: true
    })
  }

  return (
    <div className="p-1">
      {
        GameSetting &&
        <div className={`mx-auto`}>
          <div className={`card`}>
            <h1 className="text-4xl text-center font-bold p-4">
              {GameTitle}
            </h1>
          </div>

          <div className='flex flex-col justify-between gap-1 md:flex-row md:items-center mt-1'>
            <div className={`card-hover card-square`}>
              {
                prevDraw !== null &&
                <div className="flex h-full flex-col justify-evenly p-1" onClick={() => switchDraw(prevDraw.OpenLedgerIndex)}>
                  <div className="mx-auto rounded-full border-2 border-gray-800 px-4">
                    <h2 className="text-2xl">
                      Previous Draw
                    </h2>
                  </div>

                  <div className="mx-auto flex flex-col">
                    <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                      <div>Ledger Range:</div>
                    </div>
                    <h3 className="text-lg font-bold">
                      #{prevDraw.OpenLedgerIndex} - #{prevDraw.CloseLedgerIndex}
                    </h3>
                  </div>

                  <div className="mx-auto flex flex-col">
                    <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                      <div>Jackpot Code:</div>
                    </div>
                    <JackpotCode jackpot_code={prevDraw.JackpotCode} />
                  </div>

                  <div className="mx-auto flex flex-col">
                    <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                      <div>Paid Amount:</div>
                    </div>
                    <div className="mx-auto flex flex-row items-center">
                      <h3 className="mx-1 p-1 rounded-full bg-indigo-500 text-4xl font-bold text-yellow-300">
                        {prevDraw.AmountTotal.toLocaleString()} XRP
                      </h3>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div className={`card card-square`}>
              {
                currentDraw !== null ?
                  <div className="flex h-full flex-col justify-evenly p-1">
                    <div className="mx-auto rounded-full border-2 border-gray-800 px-4">
                      <h2 className="text-2xl">
                        Current Draw
                      </h2>
                    </div>

                    <div className="mx-auto flex flex-col">
                      <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                        <div>Ledger Range:</div>
                      </div>
                      <h3 className="text-lg font-bold">
                        #{currentDraw.OpenLedgerIndex} - #{currentDraw.CloseLedgerIndex}
                      </h3>
                    </div>

                    <div className="mx-auto flex flex-col">
                      <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                        <div>Ledger Left:</div>
                      </div>
                      <div className="flex mx-auto items-center justify-center w-20 h-20 rounded-full bg-green-500  text-gray-800">
                        {
                          typeof currentDrawLedgerLeft === 'number' ?
                            <span className="text-4xl font-bold">
                              {currentDrawLedgerLeft}
                            </span>
                            :
                            <span className="text-1xl font-bold">
                              {currentDrawLedgerLeft}
                            </span>
                        }
                      </div>
                    </div>

                    <div className="mx-auto flex flex-col">
                      <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                        <div>Estimated Jackpot:</div>
                      </div>
                      <h3 className="mx-2 p-2 rounded-full bg-indigo-500 text-4xl font-bold text-yellow-300">
                        {currentDraw.EstimatedJackpotAmount.toLocaleString()} XRP
                      </h3>
                    </div>
                  </div>
                  :
                  <div className="flex h-full flex-col justify-evenly p-1">
                    {
                      latestLedger !== null && latestLedger.ledger_index > GameSetting.CloseLedgerIndex ?
                        <div className="flex h-full flex-col justify-evenly">
                          <div className="mx-auto flex flex-col">
                            <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                              <div>Game Ledger Range:</div>
                            </div>
                            <h3 className="text-lg font-bold">
                              #{GameSetting.OpenLedgerIndex} - #{GameSetting.CloseLedgerIndex}
                            </h3>
                          </div>

                          <div className="mx-auto rounded-full border-2 border-gray-800 px-4">
                            <div className="flex flex-col space-x-4 text-center">
                              <h2 className='text-2xl'>
                                Game is finished...
                              </h2>
                              <InternalButton
                                title={`Update Game Setting`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  switchGameSetting()
                                }}
                                text_size={"text-2xl"} />
                            </div>
                          </div>
                        </div>
                        :
                        <div className="flex h-full flex-col justify-evenly">
                          {latestLedger !== null && latestLedger.ledger_index < GameSetting.OpenLedgerIndex ?
                            <div className="flex flex-col space-x-4 text-center">
                              <h2 className='text-2xl'>
                                Game not open yet...
                              </h2>
                            </div>
                            :
                            <div className="flex flex-col space-x-4 text-center">
                              <h2 className='text-2xl'>
                                Game data is loading...
                              </h2>
                            </div>
                          }
                        </div>
                    }
                  </div>
              }
            </div>

            <div className={`card-hover card-square`} onClick={() => switchHistroy()}>
              <div className="flex h-full flex-col justify-evenly p-1">
                <div className="mx-auto rounded-full border-2 border-gray-800 px-4">
                  <h2 className="text-2xl">
                    History
                  </h2>
                </div>

                <div className="mx-auto flex flex-col">
                  <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                    <div> Draw Count (Jackpot Count):</div>
                  </div>
                  <div className="flex mx-auto items-center justify-center">
                    <h3 className="text-lg font-bold">
                      {drawCount} ({totalJackpotCount})
                    </h3>
                  </div>
                </div>

                <div className="mx-auto flex flex-col">
                  <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                    <div>Paid Amount Total (Rate):</div>
                  </div>
                  <div className="flex mx-auto items-center justify-center">
                    <h3 className="mx-3 px-1 rounded-full bg-indigo-500 text-lg font-bold text-yellow-300">
                      {totalAmountTotal.toLocaleString()} XRP
                    </h3>
                    <div className="flex mx-auto items-center justify-center">
                      ({paidRate}%)
                    </div>
                  </div>
                </div>

                {
                  biggestJackpotDraw != null &&
                  <div className="mx-auto flex flex-col">
                    <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                      <div>Biggest Jackpot:</div>
                    </div>
                    <div className="flex mx-auto items-center justify-center">
                      <InternalButton
                        title={`Draw#${biggestJackpotDraw.OpenLedgerIndex}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          switchDraw(biggestJackpotDraw.OpenLedgerIndex)
                        }}
                        text_size={"text-lg"} />
                      <h3 className="mx-3 px-1 rounded-full bg-indigo-500 text-lg font-bold text-yellow-300">
                        {biggestJackpotDraw.JackpotTotal.toLocaleString()} XRP
                      </h3>
                    </div>
                  </div>
                }
                {
                  recentJackpotDraw != null &&
                  <div className="mx-auto flex flex-col">
                    <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                      <div>Recent Jackpot:</div>
                    </div>
                    <div className="flex mx-auto items-center justify-center">
                      <InternalButton
                        title={`Draw#${recentJackpotDraw.OpenLedgerIndex}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          switchDraw(recentJackpotDraw.OpenLedgerIndex)
                        }}
                        text_size={"text-lg"} />
                      <h3 className="mx-3 px-1 rounded-full bg-indigo-500 text-lg font-bold text-yellow-300">
                        {recentJackpotDraw.JackpotTotal.toLocaleString()} XRP
                      </h3>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div >
  )
}