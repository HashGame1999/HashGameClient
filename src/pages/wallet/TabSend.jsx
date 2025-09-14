import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadSendCurrencyListStart, loadSendCurrencyListSuccess, resetSendCurrencyList, resetSubmitResult, setActiveTabWallet, submitActionStart } from '../../store/slices/CounterSlice'
import TextInput from '../../components/Form/TextInput'
import SelectInput from '../../components/Form/SelectInput'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { DefaultCoinCode, PaySubAction, TxType } from '../../lib/RippleConst'
import { dropsToXrp } from 'xrpl'
import TextareaInput from '../../components/Form/TextareaInput'
import SubmitResult from '../../components/SubmitResult'

export default function TabSend() {
  const DefaultOptions = { value: DefaultCoinCode, label: DefaultCoinCode }
  const { Address } = useSelector(state => state.User)
  const { isLoading, loadingText, submitResult, error, SendCurrencyList, TrustLineList, walletInfo } = useSelector(state => state.Counter)

  const [destAccount, setDestAccount] = useState('')
  const [assetOptions, setAssetOptions] = useState([DefaultOptions])
  const [assetSelectd, setAssetSelectd] = useState('')
  const [amount, setAmount] = useState('')
  const [advancedCheckbox, setAdvancedCheckbox] = useState(false)
  const [sourTag, setSourTag] = useState('')
  const [destTag, setDestTag] = useState('')
  const [memo, setMemo] = useState('')
  const [amountPlaceHolder, setAmountPlaceHolder] = useState('')
  const [commonLineList, setCommonLineList] = useState([])

  const dispatch = useDispatch()

  const handleAsset = (value) => {
    setAssetSelectd(value)
    if (value === DefaultCoinCode) {
      setAmountPlaceHolder(dropsToXrp(walletInfo.account_data.Balance))
    } else {
      let match_line = commonLineList.find(line => `${line.currency}.${line.account}` === value)
      console.log(match_line)
      setAmountPlaceHolder(match_line.balance)
    }
  }

  function loadCurrencyList(value) {
    value = value.trim()
    setDestAccount(value)

    if (value !== '') {
      dispatch({ type: loadSendCurrencyListStart.type, payload: { dest_account: value } })
    } else {
      dispatch(loadSendCurrencyListSuccess({ error: null, lines: [] }))
    }
  }

  useEffect(() => {
    if (SendCurrencyList !== null && SendCurrencyList !== undefined) {
      if (SendCurrencyList.length === 0) {
        setAssetOptions([DefaultOptions])
      } else if (TrustLineList !== null && TrustLineList !== undefined) {
        console.log(TrustLineList)
        console.log(SendCurrencyList)
        const common_lines = TrustLineList.filter(line_self =>
          SendCurrencyList.some(line_dest =>
            (line_self.account === line_dest.account || Address === line_dest.account) &&
            line_self.currency === line_dest.currency
          )
        )
        console.log(common_lines)
        setCommonLineList(common_lines)
        let tmp = common_lines.map((line) => ({ value: `${line.currency}.${line.account}`, label: `${line.currency}.${line.account}` }))
        tmp.unshift(DefaultOptions)
        setAssetOptions(tmp)
      }
      setAssetSelectd(DefaultCoinCode)
      if (walletInfo !== null) {
        setAmountPlaceHolder(dropsToXrp(walletInfo.account_data.Balance))
      }
    }
  }, [SendCurrencyList])

  const handleAdvancedCheckbox = async (value) => {
    setAdvancedCheckbox(value)
    if (!value) {
      setSourTag('')
      setDestTag('')
      setMemo('')
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    let payload = {
      action: TxType.Payment,
      sub_aciton: PaySubAction.Normal,
      dest_account: destAccount,
      amount: amount,
      sour_tag: parseInt(sourTag),
      dest_tag: parseInt(destTag),
      memo: memo
    }
    if (assetSelectd === DefaultCoinCode) {
      payload.currency = DefaultCoinCode
    } else {
      const [currency, issuer] = assetSelectd.split('.')
      payload.issuer = issuer
      payload.currency = currency
    }
    dispatch(submitActionStart(payload))

    // reset
    setDestAccount('')
    setAssetSelectd('')
    setAmount('')
    setSourTag('')
    setDestTag('')
    setMemo('')
    dispatch(resetSendCurrencyList())
  }

  return (
    <div className="flex justify-center items-center">
      <div className="tab-page">
        <div className="flex flex-col p-1">
          <LoadingDiv isLoading={isLoading} text={loadingText} />
          <div className="mx-auto flex flex-col mt-4">
            <div className="card-title">
              Send
            </div>

            <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
              <form className="max-w-4xl mx-auto flex flex-col items-center justify-start" onSubmit={handleSubmit}>
                <TextInput label={'Destination:'} placeholder={"r...dest...account..."} value={destAccount} onChange={(e) => loadCurrencyList(e.target.value)} />
                <div className={`mt-1`}>
                  <SelectInput label={'Asset:'} options={assetOptions} selectdOption={assetSelectd} onChange={(e) => handleAsset(e.target.value)} disabled={isLoading} />
                </div>
                <div className={`mt-1`}>
                  <TextInput label={'Amount:'} type='number' placeholder={amountPlaceHolder} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="mt-1 w-full">
                  <div className=" flex flex-col">
                    <span className='text-xl text-gray-500 dark:text-gray-200'>
                      Advanced Options:
                    </span>
                    <input type="checkbox" checked={advancedCheckbox}
                      onChange={(e) => handleAdvancedCheckbox(e.target.checked)}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className={`mt-1 ${advancedCheckbox ? '' : 'hidden'}`}>
                  <TextInput label={'SourceTag:'} type='number' placeholder={'optional...'} value={sourTag} onChange={(e) => setSourTag(e.target.value)} />
                </div>
                <div className={`mt-1 ${advancedCheckbox ? '' : 'hidden'}`}>
                  <TextInput label={'DestinationTag:'} type='number' placeholder={'optional...'} value={destTag} onChange={(e) => setDestTag(e.target.value)} />
                </div>
                <div className={`mt-1 ${advancedCheckbox ? '' : 'hidden'}`}>
                  <TextareaInput label={'Memo:'} placeholder={'optional...'} value={memo} onChange={(e) => setMemo(e.target.value)} />
                </div>
                <div className={`mt-1`}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    Send
                  </button>
                </div>
              </form>
              <FormError error={error} />
              <SubmitResult result={submitResult} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}