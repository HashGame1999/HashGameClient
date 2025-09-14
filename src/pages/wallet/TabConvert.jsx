import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadConvertPathStart, submitActionStart, resetConvertPath } from '../../store/slices/CounterSlice'
import TextInput from '../../components/Form/TextInput'
import SelectInput from '../../components/Form/SelectInput'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { DefaultCoinCode, PaySubAction, TxType } from '../../lib/RippleConst'
import { CoinStr2Coin, fixedDecimals } from '../../lib/RippleUtil'
import { xrpToDrops } from 'xrpl'
import PathConvert from '../../components/Form/PathConvert'
import SubmitResult from '../../components/SubmitResult'

export default function TabConvert() {
  const RefreshTime = 15
  const { isLoading, loadingText, submitResult, error, TrustLineList, ConvertPathResult } = useSelector(state => state.Counter)

  const [countdown, setCountdown] = useState(RefreshTime)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef(null)

  const [assetOptions, setAssetOptions] = useState([{ value: DefaultCoinCode, label: DefaultCoinCode }])
  const [getAssetSelectd, setGetAssetSelectd] = useState('')
  const [getAmount, setGetAmount] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // set options
  useEffect(() => {
    if (TrustLineList !== null && TrustLineList !== undefined && TrustLineList.length > 0 && assetOptions.length === 1) {
      let tmp_options = TrustLineList.map((line) => ({ value: `${line.currency}.${line.account}`, label: `${line.currency}.${line.account}` }))
      tmp_options.unshift({ value: DefaultCoinCode, label: DefaultCoinCode })
      setAssetOptions(tmp_options)
      if (tmp_options.length > 0) {
        setGetAssetSelectd(tmp_options[0].value)
        setGetAmount('')
        dispatch(resetConvertPath())
      }
    }
  }, [TrustLineList])

  const handleGetAsset = (value) => {
    setGetAssetSelectd(value)
    dispatch(resetConvertPath())
    setGetAmount('')
  }

  const handleGetAmount = (value) => {
    setIsActive(false)
    value = parseFloat(value)
    if (value < 0) {
      setGetAmount('')
    } else {
      value = fixedDecimals(value, 6)
      setGetAmount(value)
    }
    dispatch(resetConvertPath())
  }

  const startFindPath = async () => {
    findPath()
    if (!isActive) {
      setIsActive(true)
      setCountdown(RefreshTime)
    }
  }

  const stopFindPath = async () => {
    if (isActive) {
      setIsActive(false)
    }
  }

  useEffect(() => {
    if (isActive && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prevCount => prevCount - 1)
      }, 1000)
    } else if (isActive && countdown === 0) {
      findPath()
      setCountdown(RefreshTime)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, countdown])

  const findPath = async () => {
    let paths = []
    for (let i = 0; i < assetOptions.length; i++) {
      const asset = assetOptions[i]
      if (asset.value !== getAssetSelectd) {
        if (asset.value === DefaultCoinCode) {
          paths.push({ currency: DefaultCoinCode })
        } else {
          paths.push(CoinStr2Coin(asset.value))
        }
      }
    }

    if (getAssetSelectd === DefaultCoinCode) {
      if (getAmount !== '') {
        dispatch(loadConvertPathStart({ get: xrpToDrops(getAmount), paths: paths }))
      }
    } else {
      let get = CoinStr2Coin(getAssetSelectd)
      get.value = getAmount
      dispatch(loadConvertPathStart({ get: get, paths: paths }))
    }
  }

  const handleConvertPayment = async (alt, destination_amount) => {
    setIsActive(false)
    let payload = {
      action: TxType.Payment,
      sub_aciton: PaySubAction.Path,
      alt: alt,
      destination_amount: destination_amount
    }
    dispatch(submitActionStart(payload))
    dispatch(resetConvertPath())
  }

  return (
    <div className="flex justify-center items-center">
      <LoadingDiv isLoading={isLoading} text={loadingText} />
      <div className="tab-page">
        <div className="mx-auto flex flex-col mt-4">
          <div className="card-title">
            Convert
          </div>

          <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
            <form className="max-w-4xl mx-auto flex flex-col items-center justify-start">
              <div className={`mt-1`}>
                <SelectInput label={'Get Asset:'} options={assetOptions} selectdOption={getAssetSelectd} onChange={(e) => handleGetAsset(e.target.value)} disabled={isLoading} />
              </div>
              <div className={`mt-1`}>
                <TextInput label={'Get Amount:'} type='number' placeholder={"1,000,000"} value={getAmount} onChange={(e) => handleGetAmount(e.target.value)} onBlur={() => startFindPath()} />
              </div>
            </form>
            <FormError error={error} />
            <SubmitResult result={submitResult} />
          </div>
        </div>

        {ConvertPathResult !== null &&
          <div className="mx-auto flex flex-col mt-4">
            <div className={`flex flex-row justify-center items-center ${isActive ? '' : 'hidden'}`}>
              <span className={`font-bold text-center text-gray-500 dark:text-gray-200`}>
                find path {countdown}s later
              </span>
              <button
                className="p-1 font-bold bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => stopFindPath()}
              >
                stop
              </button>
            </div>
            <div className="mx-auto flex flex-row mt-1">
              {
                ConvertPathResult.alternatives?.length > 0 && ConvertPathResult.alternatives.map((alt, index) => (
                  <div key={index}>
                    <PathConvert alt={alt} disabled={isLoading} handleConvert={(e) => {
                      e.preventDefault()
                      handleConvertPayment(alt, ConvertPathResult.destination_amount)
                    }} />
                  </div>
                ))
              }
            </div>
          </div>
        }
      </div>
    </div>
  )
}