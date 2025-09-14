import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../components/Form/TextInput'
import { submitActionStart } from '../../store/slices/CounterSlice'
import { PaySubAction, TxType } from '../../lib/RippleConst'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { loadGameSettingStart, loadTicketsStart } from '../../store/slices/DealerSlice'
import CurrentTicketCode from '../../components/CurrentTicketCode'
import { ConsolePageTab } from '../../lib/AppConst'
import { genReferralNumber } from '../../lib/DealerUtil'

export default function TabPlay() {
  const [codeAmount, setCodeAmount] = useState('')
  const [refAccount, setRefAccount] = useState('')
  const [refNumber, setRefNumber] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { ConnStatus } = useSelector(state => state.Ripple)
  const { isLoading, loadingText, error } = useSelector(state => state.Counter)
  const { GameSetting, isReffered, Tickets, activeTabConsole } = useSelector(state => state.Dealer)

  const RefreshTime = 5
  const [countdown, setCountdown] = useState(RefreshTime)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isActive && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prevCount => prevCount - 1)
      }, 1000)
    } else if (isActive && countdown === 0) {
      dispatch(loadTicketsStart())
      setCountdown(RefreshTime)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, countdown])

  useEffect(() => {
    if (activeTabConsole === ConsolePageTab.Play && ConnStatus) {
      dispatch(loadTicketsStart())
      setIsActive(true)
    }
  }, [dispatch, activeTabConsole, ConnStatus])

  useEffect(() => {
    if (GameSetting === null) {
      dispatch(loadGameSettingStart())
    }
  }, [dispatch])

  const handelRefAccount = async (e) => {
    let account = e.target.value.trim()
    console.log(account)
    setRefAccount(account)
    setRefNumber(genReferralNumber(account))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let payload = {
      action: TxType.Payment,
      sub_aciton: PaySubAction.Play,
      dest_account: GameSetting?.GameAccount,
      amount: codeAmount,
      sour_tag: parseInt(refNumber)
    }
    dispatch(submitActionStart(payload))

    // reset
    setCodeAmount('')
    setRefAccount('')
    setRefNumber('')
  }

  return (
    <div className="flex justify-center items-center">
      <div className="tab-page">
        <div className="mx-auto flex flex-col mt-4">

          <LoadingDiv isLoading={isLoading} text={loadingText} />
          <div className="card-title">
            Play
          </div>

          {
            GameSetting &&
            <div className="min-w-full p-2 flex gap-1 rounded-lg shadow-xl justify-center">
              <div className={`mt-1 flex-1`}>
                <form className="max-w-4xl mx-auto flex flex-col items-center justify-start" onSubmit={handleSubmit}>
                  <TextInput label={'Game Account:'} value={GameSetting?.GameAccount} disabled={true} />
                  <TextInput label={'Code Amount:'} type='number' placeholder={`each code cost ${GameSetting.CodePrice} XRP`} value={codeAmount} onChange={(e) => setCodeAmount(e.target.value)} />
                  <div className={`${isReffered ? 'hidden' : ''}`}>
                    <TextInput label={'Ref Account:'} placeholder={"r...ref.account..."} value={refAccount} onChange={handelRefAccount} />
                    <TextInput label={'Ref Number:'} value={refNumber} disabled={true} />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    Buy
                  </button>
                </form>
                <FormError error={error} />
              </div>
              <div className={`mt-1 flex-1 justify-center`}>
                {
                  Tickets.length > 0 &&
                  <div className="mx-auto rounded-full p-1 border-2 border-gray-200 dark:border-gray-700 px-4">
                    <h3 className='text-2xl text-gray-500 dark:text-gray-200'>
                      You Codes of Current Draw:
                    </h3>
                  </div>
                }
                {
                  Tickets.map((ticket, index) => (
                    <div key={index + Math.random()} className='text-xs text-gray-200 mt-1 p-1'>
                      <CurrentTicketCode codes={ticket.Codes} />
                    </div>
                  ))
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}