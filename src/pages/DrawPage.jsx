import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { LoadDrawStart } from '../store/slices/DealerSlice'
import JackpotCode from '../components/JackpotCode'
import { URL4AccountTest, URL4TxHashTest } from '../lib/RippleUtil'
import ExternalLink from '../components/ExternalLink'
import JackpotBreakdown from '../components/JackpotBreakdown'
import PrizeBreakdown from '../components/PrizeBreakdown'
import InternalButton from '../components/InternalButton'

export default function DrawPage() {
  const [draw, setDraw] = useState(null)
  const dispatch = useDispatch()
  const { Draw } = useSelector(state => state.Dealer)
  const { open_ledger_index } = useParams()

  useEffect(() => {
    dispatch(LoadDrawStart(open_ledger_index))
  }, [dispatch])

  useEffect(() => {
    setDraw(Draw)
  }, [Draw])

  return (
    <div className="p-1 mt-2 card">
      <div className="flex flex-col justify-evenly mx-auto w-full p-4 items-center">
        {
          draw !== null &&
          <div className="flex flex-col p-1">
            <div className="mx-auto flex flex-col mt-4">
              <div className="mx-auto rounded-full border-2 border-gray-800 px-4">
                <div>Draw ID:</div>
              </div>
              <div className="flex flex-row items-center justify-center">
                <h3 className="text-lg font-bold" >
                  {draw.DrawID}
                </h3>
                <InternalButton title={'details'} onClick={() => dispatch({ type: 'LoadDrawResult', payload: { open_ledger_index: open_ledger_index } })} text_size={"text-base"} />
              </div>
            </div>

            <div className="mx-auto flex flex-col mt-4">
              <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                <div>Ledger Range:</div>
              </div>
              <h3 className="text-lg font-bold">
                #{draw.OpenLedgerIndex} - #{draw.CloseLedgerIndex}
              </h3>
            </div>

            <div className="mx-auto flex flex-col mt-4">
              <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                <div>Jackpot Code:</div>
              </div>
              <JackpotCode jackpot_code={draw.JackpotCode} />
            </div>

            <div className="mx-auto flex flex-col mt-4">
              <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                <div>Paid Amount(Rate):</div>
              </div>
              <div className="mx-auto flex flex-row">
                <h3 className="mx-1 p-2 rounded-full bg-indigo-500 text-4xl font-bold text-yellow-300">
                  {draw.AmountTotal} XRP
                </h3>
                <h3 className="p-2 rounded-full text-4xl font-bold text-gray-500">
                  ({draw.PaidRate}%)
                </h3>
              </div>
            </div>

            {
              draw.JackpotTotal > 0 &&
              <div className="mx-auto flex flex-col mt-4">
                <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                  <div>JackpotTotal:</div>
                </div>
                <div className="mx-auto flex flex-row">
                  <h3 className="mx-1 p-2 rounded-full bg-indigo-500 text-4xl font-bold text-yellow-300">
                    {draw.JackpotTotal} XRP
                  </h3>
                </div>
              </div>
            }

            {
              draw.Breakdowns.length > 0 &&
              <div className="mx-auto flex flex-col mt-4">
                <div className="mx-auto rounded-full border border-gray-600 px-4 mb-1">
                  <div>Winners:</div>
                </div>
                {draw.Breakdowns.map((breakdown, index) => (
                  <div key={index} >
                    <div className="justify-evenly flex flex-row">
                      <div className='mx-1 font-mono'>
                        <ExternalLink href={URL4AccountTest(breakdown.Account)} title={breakdown.Account} text_size={"text-base"} />
                      </div>
                      <div className='mx-1'>
                        <ExternalLink href={URL4TxHashTest(breakdown.TicketTxHash)} title={"Ticket Tx"} text_size={"text-base"} />
                      </div>
                      <div className='mx-1'>
                        <ExternalLink href={URL4TxHashTest(breakdown.PayTxHash)} title={"Breakdown Tx"} text_size={"text-base"} />
                      </div>
                      {
                        breakdown.JackpotTotal > 0 &&
                        <div className="mx-auto flex flex-row">
                          <JackpotBreakdown breakdown_json={JSON.parse(breakdown.JackpotBreakdown)} />
                        </div>
                      }
                      {
                        breakdown.PrizeTotal > 0 &&
                        <div className="mx-auto flex flex-row">
                          <PrizeBreakdown breakdown_json={JSON.parse(breakdown.PrizeBreakdown)} />
                        </div>
                      }
                      <h3 className="m-1 px-1 rounded-full bg-indigo-500 text-base font-bold text-yellow-300 flex flex-col items-center justify-center">
                        <span>
                          {breakdown.AmountTotal.toLocaleString()} XRP
                        </span>
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        }
      </div>
    </div>
  )
}