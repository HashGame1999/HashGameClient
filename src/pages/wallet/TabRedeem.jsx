import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { submitActionStart } from '../../store/slices/CounterSlice'
import TextInput from '../../components/Form/TextInput'
import SelectInput from '../../components/Form/SelectInput'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { TxType } from '../../lib/RippleConst'
import TextareaInput from '../../components/Form/TextareaInput'
import FormButton from '../../components/Form/FormButton'
import SubmitResult from '../../components/SubmitResult'

export default function TabRedeem() {
  const { isLoading, loadingText, submitResult, error, TrustLineList } = useSelector(state => state.Counter)

  const [assetOptions, setAssetOptions] = useState([])
  const [assetSelectd, setAssetSelectd] = useState('')
  const [amount, setAmount] = useState('')
  const [advancedCheckbox, setAdvancedCheckbox] = useState(false)
  const [sourTag, setSourTag] = useState('')
  const [destTag, setDestTag] = useState('')
  const [memo, setMemo] = useState('')
  const [amountPlaceHolder, setAmountPlaceHolder] = useState('')

  const dispatch = useDispatch()

  const handleAsset = (value) => {
    setAssetSelectd(value)
    const [currency, account] = value.split('.')
    let match_line = TrustLineList.find(line => line.currency === currency && line.account === account)
    setAmountPlaceHolder(match_line.balance)
  }

  useEffect(() => {
    if (TrustLineList !== null && TrustLineList !== undefined) {
      let tmp_options = TrustLineList.map((line) => ({ value: `${line.currency}.${line.account}`, label: `${line.currency}.${line.account}` }))
      setAssetOptions(tmp_options)
      if (tmp_options.length > 0) {
        setAssetSelectd(tmp_options[0].value)
      }
    }
  }, [TrustLineList])

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
    console.log(assetSelectd)
    const [currency, issuer] = assetSelectd.split('.')
    let payload = {
      action: TxType.Payment,
      dest_account: issuer,
      issuer: issuer,
      currency: currency,
      amount: amount,
      sour_tag: parseInt(sourTag),
      dest_tag: parseInt(destTag),
      memo: memo
    }
    dispatch(submitActionStart(payload))

    // reset
    setAssetSelectd('')
    setAmount('')
    setSourTag('')
    setDestTag('')
    setMemo('')
  }

  return (
    <div className="flex justify-center items-center">
      <div className="tab-page">
        <div className="flex flex-col p-1">
          <LoadingDiv isLoading={isLoading} text={loadingText} />
          <div className="mx-auto flex flex-col mt-4">
            <div className="card-title">
              !!!Redeem
            </div>

            <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
              <form className="max-w-4xl mx-auto flex flex-col items-center justify-start" onSubmit={handleSubmit}>
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
                  <FormButton disabled={isLoading} title={'!!!Redeem'} bgColor='bg-red-500 hover:bg-red-600' />
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