import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadIssuerCurrencyListStart, loadIssuerCurrencyListSuccess, resetIssuerCurrencyList, submitActionStart } from '../../store/slices/CounterSlice'
import TextInput from '../../components/Form/TextInput'
import SelectInput from '../../components/Form/SelectInput'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { DefaultCoinCode, TxType } from '../../lib/RippleConst'
import SubmitResult from '../../components/SubmitResult'

export default function TabAsset() {
  const { isLoading, loadingText, submitResult, error, IssuerCurrencyList } = useSelector(state => state.Counter)

  const [issuer, setIssuer] = useState('')
  const [assetOptions, setAssetOptions] = useState([])
  const [assetSelectd, setAssetSelectd] = useState('')
  const [amount, setAmount] = useState('')
  const [newAsset, setNewAsset] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleAsset = (e) => {
    setAssetSelectd(e.target.value)
  }

  const handelNewAsset = (value) => {
    const regex = /^[A-Z?!#$%*@(){}[\]|]{3}$/
    if (value.length === 3 && regex.test(value) && value !== DefaultCoinCode) {
      setNewAsset(value)
    } else {
      setNewAsset('')
    }
  }

  function loadCurrencyList(value) {
    value = value.trim()
    setIssuer(value)

    if (value !== '') {
      dispatch({ type: loadIssuerCurrencyListStart.type, payload: { issuer: value } })
    } else {
      dispatch(loadIssuerCurrencyListSuccess({ error: null, currency_list: [] }))
    }
  }

  useEffect(() => {
    if (IssuerCurrencyList.length === 0) {
      setAssetOptions([])
    } else {
      let tmp = IssuerCurrencyList.map((c) => ({ value: c, label: c }))
      setAssetOptions(tmp)
    }
  }, [IssuerCurrencyList])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (IssuerCurrencyList.length === 0 && newAsset !== '') {
      dispatch(submitActionStart({ action: TxType.TrustSet, issuer: issuer, currency: newAsset, amount: amount }))
    } else {
      dispatch(submitActionStart({ action: TxType.TrustSet, issuer: issuer, currency: assetSelectd, amount: amount }))
    }

    // reset
    setIssuer('')
    setAssetSelectd('')
    setNewAsset('')
    setAmount('')
    dispatch(resetIssuerCurrencyList())
  }

  return (
    <div className="flex justify-center items-center">
      <LoadingDiv isLoading={isLoading} text={loadingText} />
      <div className="tab-page">
        <div className="mx-auto flex flex-col mt-4">
          <div className="card-title">
            Trust Asset
          </div>

          <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
            <form className="max-w-4xl mx-auto flex flex-col items-center justify-start" onSubmit={handleSubmit}>
              <TextInput label={'Issuer:'} placeholder={"r...issuer...account..."} value={issuer} onChange={(e) => loadCurrencyList(e.target.value)} />
              <div className={`mt-1 ${IssuerCurrencyList.length === 0 ? 'hidden' : ''}`}>
                <SelectInput label={'Asset:'} options={assetOptions} selectdOption={assetSelectd} onChange={handleAsset} disabled={isLoading} />
              </div>
              <div className={`mt-1 ${error !== 'issuer issues none...' ? 'hidden' : ''}`}>
                <TextInput label={'!!!Trust New Asset:'} placeholder={`a 3-character string such as "BTC" or "USD"`} value={newAsset} onChange={(e) => handelNewAsset(e.target.value)} />
              </div>
              <div className={`mt-1 ${IssuerCurrencyList.length === 0 && error !== 'issuer issues none...' ? 'hidden' : ''}`}>
                <TextInput label={'Trust Amount:'} placeholder={"1,000,000"} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className={`mt-1 ${IssuerCurrencyList.length === 0 && error !== 'issuer issues none...' ? 'hidden' : ''}`}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  Set
                </button>
              </div>
            </form>
            <FormError error={error} />
            <SubmitResult result={submitResult} />
          </div>
        </div>
      </div>
    </div>
  )
}