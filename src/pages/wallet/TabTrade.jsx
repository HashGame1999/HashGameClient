import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCounterAsset, setBaseAsset, submitActionStart } from '../../store/slices/CounterSlice'
import LoadingDiv from '../../components/LoadingDiv'
import { DefaultCoinCode, TxType } from '../../lib/RippleConst'
import AssetSelect from '../../components/AssetSelect'
import { LiaExchangeAltSolid } from "react-icons/lia"
import IconButton from '../../components/IconButton'
import { setOfferBookLeft, setOfferBookRight } from '../../store/slices/RippleSlice'
import { dropsToXrp, xrpToDrops } from 'xrpl'
import XTextInput from '../../components/Form/XTextInput'
import { Asset2Coin, CoinStr2Coin, CompareCoin, fixedDecimals, preciseDivide, preciseMultiply } from '../../lib/RippleUtil'
import InternalButton from '../../components/InternalButton'
import OfferAsset from '../../components/OfferAsset'
import SubmitResult from '../../components/SubmitResult'

export default function TabTrade() {
  const DefaultOptions = { value: DefaultCoinCode, label: DefaultCoinCode }
  const { Address } = useSelector(state => state.User)
  const { isLoading, loadingText, submitResult, baseAsset, counterAsset, TrustLineList, walletInfo, OfferList } = useSelector(state => state.Counter)
  const { OfferBookLeft, OfferBookRight } = useSelector(state => state.Ripple)

  const [baseAssetOptions, setBaseAssetOptions] = useState([DefaultOptions])
  const [counterAssetOptions, setCounterAssetOptions] = useState([DefaultOptions])

  const [displayBaseAsset, setDisplayBaseAsset] = useState(DefaultCoinCode)
  const [displayCounterAsset, setDisplayCounterAsset] = useState(DefaultCoinCode)
  const [holderBaseAsset, setHolderBaseAsset] = useState('')
  const [holderCounterAsset, setHolderCounterAsset] = useState('')

  const [leftTable, setLeftTable] = useState([])
  const [rightTable, setRightTable] = useState([])

  const [buyOffers, setBuyOffers] = useState([])
  const [sellOffers, setSellOffers] = useState([])

  const dispatch = useDispatch()

  useEffect(() => {
    if (TrustLineList !== null && TrustLineList !== undefined) {
      let tmp_options = TrustLineList.map((line) => ({ value: `${line.currency}.${line.account}`, label: `${line.currency}.${line.account}` }))
      tmp_options.unshift(DefaultOptions)
      setBaseAssetOptions(tmp_options)
      setCounterAssetOptions(tmp_options)
    }
  }, [TrustLineList])

  // offer_list
  useEffect(() => {
    if (OfferList) {
      let tmp_buy_offers = []
      let tmp_sell_offers = []
      for (let i = 0; i < OfferList.length; i++) {
        const offer = OfferList[i]
        if (CompareCoin(CoinStr2Coin(baseAsset), Asset2Coin(offer.taker_pays))
          && CompareCoin(CoinStr2Coin(counterAsset), Asset2Coin(offer.taker_gets))) {
          let tmp = { ...offer }
          tmp.price = caclPrice(offer.taker_pays, offer.taker_gets)
          tmp_buy_offers.push(tmp)
        } else if (CompareCoin(CoinStr2Coin(counterAsset), Asset2Coin(offer.taker_pays))
          && CompareCoin(CoinStr2Coin(baseAsset), Asset2Coin(offer.taker_gets))) {
          let tmp = { ...offer }
          tmp.price = caclPrice(offer.taker_gets, offer.taker_pays)
          tmp_sell_offers.push(tmp)
        }
      }
      setBuyOffers(tmp_buy_offers)
      setSellOffers(tmp_sell_offers)
    }
  }, [baseAsset, counterAsset, OfferList])

  const cancelOffer = async (seq) => {
    dispatch(submitActionStart({ action: TxType.OfferCancel, offer_sequence: seq }))
  }

  function caclPrice(base, counter) {
    let counter_amount = 0
    let base_amount = 0
    if (typeof counter === 'string') {
      counter_amount = dropsToXrp(counter)
    } else {
      counter_amount = counter.value
    }

    if (typeof base === 'string') {
      base_amount = dropsToXrp(base)
    } else {
      base_amount = base.value
    }
    return (parseFloat(counter_amount) / parseFloat(base_amount)).toFixed(4)
  }

  function genTable(offer_list) {
    let table = []
    let sum = 0
    for (let i = 0; i < offer_list.length; i++) {
      const offer = offer_list[i]
      let row = {}
      if (baseAsset === DefaultCoinCode) {
        // base = xrp => get or pay === xrp
        if (typeof offer.TakerGets === 'string') {
          // get = base => amount = get
          if (offer.taker_gets_funded) {
            row.Amount = dropsToXrp(offer.taker_gets_funded)
          } else {
            row.Amount = dropsToXrp(offer.TakerGets)
          }
        } else {
          // pay = base => amount = pay
          if (offer.taker_pays_funded) {
            row.Amount = dropsToXrp(offer.taker_pays_funded)
          } else {
            row.Amount = dropsToXrp(offer.TakerPays)
          }
        }
      } else {
        // base != xrp
        const [currency, issuer] = baseAsset.split('.')
        if (currency === offer.TakerGets.currency && issuer === offer.TakerGets.issuer) {
          // get = base base!=xrp
          if (offer.taker_gets_funded) {
            row.Amount = parseFloat(offer.taker_gets_funded.value)
          } else {
            row.Amount = parseFloat(offer.TakerGets.value)
          }
        } else {
          // pay = base => amount = pay
          if (offer.taker_pays_funded) {
            row.Amount = parseFloat(offer.taker_pays_funded.value)
          } else {
            row.Amount = parseFloat(offer.TakerPays.value)
          }
        }
      }

      if (CompareCoin(CoinStr2Coin(baseAsset), Asset2Coin(offer.TakerPays))) {
        if (offer.taker_gets_funded) {
          row.Price = caclPrice(offer.taker_pays_funded, offer.taker_gets_funded)
        } else {
          row.Price = caclPrice(offer.TakerPays, offer.TakerGets)
        }
      } else {
        if (offer.taker_gets_funded) {
          row.Price = caclPrice(offer.taker_gets_funded, offer.taker_pays_funded)
        } else {
          row.Price = caclPrice(offer.TakerGets, offer.TakerPays)
        }
      }

      sum += parseFloat(row.Amount)
      row.Sum = sum.toFixed(2)
      row.Amount = row.Amount.toFixed(2)
      row.Account = offer.Account
      table.push(row)
    }
    return table
  }

  // offer table left
  useEffect(() => {
    let tmp = genTable(OfferBookLeft)
    setLeftTable(tmp)
  }, [OfferBookLeft])

  // offer table right
  useEffect(() => {
    let tmp = genTable(OfferBookRight)
    setRightTable(tmp)
  }, [OfferBookRight])

  const xPay2Get = () => {
    if (baseAsset !== counterAsset) {
      let tmp_counter = counterAsset
      let tmp_base = baseAsset
      dispatch(setBaseAsset(tmp_counter))
      dispatch(setCounterAsset(tmp_base))

      let tmp_book_l = OfferBookLeft
      let tmp_book_r = OfferBookRight
      dispatch(setOfferBookLeft(tmp_book_r))
      dispatch(setOfferBookRight(tmp_book_l))
    }
  }

  const RefreshTime = 10
  const [countdown, setCountdown] = useState(RefreshTime)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef(null)

  // form place holder
  useEffect(() => {
    if (baseAsset !== undefined && counterAsset !== undefined) {
      setDisplayBaseAsset(baseAsset === DefaultCoinCode ? baseAsset : baseAsset.split('.')[0])
      setDisplayCounterAsset(counterAsset === DefaultCoinCode ? counterAsset : counterAsset.split('.')[0])

      setBuyAmount('')
      setBuyPrice('')
      setBuyVaule('')

      setSellAmount('')
      setSellPrice('')
      setSellVaule('')

      if (baseAsset === DefaultCoinCode && walletInfo) {
        setHolderBaseAsset(dropsToXrp(walletInfo.account_data.Balance))
      } else {
        const [currency, account] = baseAsset.split('.')
        let match_line = TrustLineList?.find(line => line.currency === currency && line.account === account)
        if (match_line) {
          setHolderBaseAsset(match_line.balance)
        }
      }

      if (counterAsset === DefaultCoinCode && walletInfo) {
        setHolderCounterAsset(dropsToXrp(walletInfo.account_data.Balance))
      } else {
        const [currency, account] = counterAsset.split('.')
        let match_line = TrustLineList?.find(line => line.currency === currency && line.account === account)
        if (match_line) {
          setHolderCounterAsset(match_line.balance)
        }
      }

      if (baseAsset !== counterAsset) {
        dispatch({ type: 'FetchOfferBookRight' })
        dispatch({ type: 'FetchOfferBookLeft' })
        if (!isActive) {
          setIsActive(true)
          setCountdown(RefreshTime)
        }
      } else {
        setLeftTable([])
        setRightTable([])
      }
    }
  }, [baseAsset, counterAsset, walletInfo, TrustLineList])

  useEffect(() => {
    // console.log(countdown)
    if (isActive && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prevCount => prevCount - 1)
      }, 1000)
      if (countdown === 5) {
        dispatch({ type: 'FetchOfferBookRight' })
      } else if (countdown === 10) {
        dispatch({ type: 'FetchOfferBookLeft' })
      }
    } else if (isActive && countdown === 0) {
      setCountdown(RefreshTime)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, countdown])

  // buy form
  const [buyAmount, setBuyAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [buyVaule, setBuyVaule] = useState('')
  const [disabledBuyInput, setDisabledBuyInput] = useState('BuyValue')

  const handleBuy = async (e) => {
    e.preventDefault()
    let payload = {
      action: TxType.OfferCreate,
    }
    if (baseAsset === DefaultCoinCode) {
      payload.TakerPays = xrpToDrops(buyAmount)
    } else {
      const [currency, issuer] = baseAsset.split('.')
      payload.TakerPays = {
        currency: currency,
        issuer: issuer,
        value: buyAmount.toString()
      }
    }
    if (counterAsset === DefaultCoinCode) {
      payload.TakerGets = xrpToDrops(buyVaule)
    } else {
      const [currency, issuer] = counterAsset.split('.')
      payload.TakerGets = {
        currency: currency,
        issuer: issuer,
        value: buyVaule.toString()
      }
    }
    dispatch(submitActionStart(payload))

    // reset
    setBuyAmount('')
    setBuyPrice('')
    setBuyVaule('')
  }

  const handleBuyAmount = async (value, flag) => {
    if (value.trim() === '') {
      setBuyAmount('')
      if (flag) {
        if (disabledBuyInput === 'BuyValue') {
          setBuyVaule('', false)
        } else if (disabledBuyInput === 'BuyPrice') {
          setBuyPrice('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setBuyAmount('')
    } else {
      value = fixedDecimals(value, 6)
      setBuyAmount(value)
    }

    if (flag) {
      if (disabledBuyInput === 'BuyValue' && buyPrice !== '' && !Number.isNaN(buyPrice)) {
        const result = preciseMultiply(parseFloat(value), parseFloat(buyPrice))
        setBuyVaule(result, false)
      } else if (disabledBuyInput === 'BuyPrice' && buyVaule !== '' && !Number.isNaN(buyVaule)) {
        const result = preciseDivide(parseFloat(buyVaule), parseFloat(value), 4)
        setBuyPrice(result, false)
      }
    }
  }

  const handleBuyPrice = async (value, flag) => {
    if (value.trim() === '') {
      setBuyPrice('')
      if (flag) {
        if (disabledBuyInput === 'BuyValue') {
          setBuyVaule('', false)
        } else if (disabledBuyInput === 'BuyAmount') {
          setBuyAmount('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setBuyPrice('')
    } else {
      value = fixedDecimals(value, 4)
      setBuyPrice(value)
    }

    if (flag) {
      if (disabledBuyInput === 'BuyValue' && buyAmount !== '' && !Number.isNaN(buyAmount)) {
        const result = preciseMultiply(parseFloat(buyAmount), parseFloat(value))
        setBuyVaule(result, false)
      } else if (disabledBuyInput === 'BuyAmount' && buyVaule !== '' && !Number.isNaN(buyVaule)) {
        const result = preciseDivide(parseFloat(buyVaule), parseFloat(value), 6)
        setBuyAmount(result, false)
      }
    }
  }

  const handleBuyValue = async (value, flag) => {
    if (value.trim() === '') {
      setBuyVaule('')
      if (flag) {
        if (disabledBuyInput === 'BuyPrice') {
          setBuyPrice('', false)
        } else if (disabledBuyInput === 'BuyAmount') {
          setBuyAmount('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setBuyVaule('')
    } else {
      value = fixedDecimals(value, 6)
      setBuyVaule(value)
    }

    if (flag) {
      if (disabledBuyInput === 'BuyPrice' && buyAmount !== '' && !Number.isNaN(buyAmount)) {
        const result = preciseDivide(parseFloat(value), parseFloat(buyAmount), 4)
        setBuyPrice(result, false)
      } else if (disabledBuyInput === 'BuyAmount' && buyPrice !== '' && !Number.isNaN(buyPrice)) {
        const result = preciseDivide(parseFloat(value), parseFloat(buyPrice), 6)
        setBuyAmount(result, false)
      }
    }
  }

  // sell form
  const [sellAmount, setSellAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellVaule, setSellVaule] = useState('')
  const [disabledSellInput, setDisabledSellInput] = useState('SellValue')

  const handleSell = async (e) => {
    e.preventDefault()
    let payload = {
      action: TxType.OfferCreate,
    }
    if (baseAsset === DefaultCoinCode) {
      payload.TakerGets = xrpToDrops(sellAmount)
    } else {
      const [currency, issuer] = baseAsset.split('.')
      payload.TakerGets = {
        currency: currency,
        issuer: issuer,
        value: sellAmount.toString()
      }
    }
    if (counterAsset === DefaultCoinCode) {
      payload.TakerPays = xrpToDrops(sellVaule)
    } else {
      const [currency, issuer] = counterAsset.split('.')
      payload.TakerPays = {
        currency: currency,
        issuer: issuer,
        value: sellVaule.toString()
      }
    }
    dispatch(submitActionStart(payload))
    // reset
    setSellAmount('')
    setSellPrice('')
    setSellVaule('')
  }

  const handleSellAmount = async (value, flag) => {
    if (value.trim() === '') {
      setSellAmount('')
      if (flag) {
        if (disabledSellInput === 'SellValue') {
          setSellVaule('', false)
        } else if (disabledSellInput === 'SellPrice') {
          setSellPrice('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setSellAmount('')
    } else {
      value = fixedDecimals(value, 6)
      setSellAmount(value)
    }

    if (flag) {
      if (disabledSellInput === 'SellValue' && sellPrice !== '' && !Number.isNaN(sellPrice)) {
        const result = preciseMultiply(parseFloat(sellPrice), parseFloat(value))
        setSellVaule(result, false)
      } else if (disabledSellInput === 'SellPrice' && sellVaule !== '' && !Number.isNaN(sellVaule)) {
        const result = preciseDivide(parseFloat(sellVaule), parseFloat(value), 4)
        setSellPrice(result, false)
      }
    }
  }

  const handleSellPrice = async (value, flag) => {
    if (value.trim() === '') {
      setSellPrice('')
      if (flag) {
        if (disabledSellInput === 'SellValue') {
          setSellVaule('', false)
        } else if (disabledSellInput === 'SellAmount') {
          setSellAmount('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setSellPrice('')
    } else {
      value = fixedDecimals(value, 4)
      setSellPrice(value)
    }

    if (flag) {
      if (disabledSellInput === 'SellValue' && sellAmount !== '' && !Number.isNaN(sellAmount)) {
        const result = preciseMultiply(parseFloat(sellAmount), parseFloat(value))
        setSellVaule(result, false)
      } else if (disabledSellInput === 'SellAmount' && sellVaule !== '' && !Number.isNaN(sellVaule)) {
        const result = preciseDivide(parseFloat(sellVaule), parseFloat(value), 6)
        setSellAmount(result, false)
      }
    }
  }

  const handleSellValue = async (value, flag) => {
    if (value.trim() === '') {
      setSellVaule('')
      if (flag) {
        if (disabledSellInput === 'SellPrice') {
          setSellPrice('', false)
        } else if (disabledSellInput === 'SellAmount') {
          setSellAmount('', false)
        }
      }
      return
    }
    value = parseFloat(value)
    if (value < 0) {
      setSellVaule('')
    } else {
      value = fixedDecimals(value, 6)
      setSellVaule(value)
    }

    if (flag) {
      if (disabledSellInput === 'SellPrice' && sellAmount !== '' && !Number.isNaN(sellAmount)) {
        const result = preciseDivide(parseFloat(value), parseFloat(sellAmount), 4)
        setSellPrice(result, false)
      } else if (disabledSellInput === 'SellAmount' && sellPrice !== '' && !Number.isNaN(sellPrice)) {
        const result = preciseDivide(parseFloat(value), parseFloat(sellPrice), 6)
        setSellAmount(result, false)
      }
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="tab-page">
        <div className="flex flex-col p-1">
          <LoadingDiv isLoading={isLoading} text={loadingText} />
          <div className="mx-auto flex flex-col mt-4">
            <div className="card-title">
              Trade
            </div>

            <div id="flexContainer" className="flex-container flex w-full gap-1 mt-4">
              <div className="flex-1 flex flex-col items-center px-1 rounded-xl">
                <AssetSelect label={'Base:'} options={baseAssetOptions} selectdOption={baseAsset} onChange={(e) => dispatch(setBaseAsset(e.target.value))} />
              </div>

              <div id="middleColumn" className="flex items-center">
                <div>
                  <IconButton
                    icon={<LiaExchangeAltSolid className="icon text-green-500 font-bold" />}
                    onClick={() => xPay2Get()}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center px-1 rounded-xl">
                <AssetSelect label={'Counter:'} options={counterAssetOptions} selectdOption={counterAsset} onChange={(e) => dispatch(setCounterAsset(e.target.value))} />
              </div>
            </div>

            <div className='flex flex-col justify-center items-center'>
              <div className={`${baseAsset === counterAsset ? 'hidden' : ''} min-w-full py-2 flex gap-1 rounded-lg shadow-xl`}>
                <div className={`mt-1 flex-1`}>
                  <form className="mx-auto flex flex-col items-center" onSubmit={handleBuy}>
                    <XTextInput
                      currency={displayBaseAsset}
                      label={'Amount:'}
                      value={buyAmount}
                      onChange={(e) => handleBuyAmount(e.target.value, true)}
                      disabled={disabledBuyInput === 'BuyAmount' ? true : false}
                      onClick={() => setDisabledBuyInput('BuyAmount')} />
                    <XTextInput
                      currency={displayCounterAsset}
                      label={'Price:'}
                      value={buyPrice}
                      onChange={(e) => handleBuyPrice(e.target.value, true)}
                      disabled={disabledBuyInput === 'BuyPrice' ? true : false}
                      onClick={() => setDisabledBuyInput('BuyPrice')} />
                    <XTextInput
                      currency={displayCounterAsset}
                      label={'Offer Value:'}
                      value={buyVaule}
                      placeholder={holderCounterAsset}
                      onChange={(e) => handleBuyValue(e.target.value, true)}
                      disabled={disabledBuyInput === 'BuyValue' ? true : false}
                      onClick={() => setDisabledBuyInput('BuyValue')} />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading}
                    >
                      Buy {displayBaseAsset}
                    </button>
                  </form>
                </div>
                <div className={`mt-1 flex-1`}>
                  <form className="mx-auto flex flex-col items-center" onSubmit={handleSell}>
                    <XTextInput
                      currency={displayBaseAsset}
                      label={'Amount:'}
                      placeholder={holderBaseAsset}
                      value={sellAmount}
                      onChange={(e) => handleSellAmount(e.target.value, true)}
                      disabled={disabledSellInput === 'SellAmount' ? true : false}
                      onClick={() => setDisabledSellInput('SellAmount')} />
                    <XTextInput
                      currency={displayCounterAsset}
                      label={'Price:'}
                      value={sellPrice}
                      onChange={(e) => handleSellPrice(e.target.value, true)}
                      disabled={disabledSellInput === 'SellPrice' ? true : false}
                      onClick={() => setDisabledSellInput('SellPrice')} />
                    <XTextInput
                      currency={displayCounterAsset}
                      label={'Offer Value:'}
                      value={sellVaule}
                      onChange={(e) => handleSellValue(e.target.value, true)}
                      disabled={disabledSellInput === 'SellValue' ? true : false}
                      onClick={() => setDisabledSellInput('SellValue')} />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoading}
                    >
                      Sell {displayBaseAsset}
                    </button>
                  </form>
                </div>
              </div>
              <SubmitResult result={submitResult} />
            </div>

            <div className={`${baseAsset === counterAsset ? 'hidden' : ''} min-w-full py-2 flex gap-1 rounded-lg shadow-xl`}>
              <div className={`mt-1 flex-1`}>
                {
                  buyOffers.length > 0 &&
                  <div className='mt-4'>
                    <table className="mx-auto table-auto border-collapse border border-gray-200 dark:border-gray-700">
                      <thead>
                        <tr>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Sequence
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Buy
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Pay
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Price
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Action
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {buyOffers.map((offer, index) => (
                          <tr key={offer.seq}>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-center">
                              {offer.seq}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              <OfferAsset asset={offer.taker_pays} textSize={'text-base'} />
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              <OfferAsset asset={offer.taker_gets} textSize={'text-base'} />
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              {offer.price}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-center">
                              <InternalButton title={`Cancel`} onClick={() => { cancelOffer(offer.seq) }} text_size={"text-base"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
              <div className={`mt-1 flex-1`}>
                {
                  sellOffers.length > 0 &&
                  <div className='mt-4'>
                    <table className="mx-auto table-auto border-collapse border border-gray-200 dark:border-gray-700">
                      <thead>
                        <tr>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Sequence
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Sell
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Get
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Price
                            </span>
                          </th>
                          <th className="border border-gray-200 dark:border-gray-700 px-2">
                            <span className='text-base text-gray-800 dark:text-gray-200'>
                              Action
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellOffers.map((offer, index) => (
                          <tr key={offer.seq}>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-center">
                              {offer.seq}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              <OfferAsset asset={offer.taker_gets} textSize={'text-base'} />
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              <OfferAsset asset={offer.taker_pays} textSize={'text-base'} />
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-right">
                              {offer.price}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-2 text-center">
                              <InternalButton title={`Cancel`} onClick={() => { cancelOffer(offer.seq) }} text_size={"text-base"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <div className={`${baseAsset === counterAsset ? 'hidden' : ''} min-w-full p-2 flex gap-1 rounded-lg shadow-xl justify-center`}>
              <div className={`mt-1 flex-1`}>
                {
                  leftTable.length > 0 ?
                    <table className="min-w-full border border-gray-200 dark:border-gray-700">
                      <thead className="">
                        <tr>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Total
                              </span>
                              <span>
                                ({displayBaseAsset})
                              </span>
                            </div>
                          </th>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Amount
                              </span>
                              <span>
                                ({displayBaseAsset})
                              </span>
                            </div>
                          </th>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Bid Price
                              </span>
                              <span>
                                ({displayCounterAsset})
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="border border-gray-200 dark:border-gray-700">
                        {
                          leftTable.map((row, index) => (
                            <tr key={index} className={`border border-gray-200 dark:border-gray-700 hover:bg-gray-500 ${Address === row.Account ? 'font-bold text-text-secondary dark:text-dark-text-secondary' : 'text-gray-800 dark:text-gray-300'}`} title={row.Account}>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Sum}
                              </td>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Amount}
                              </td>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Price}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                    :
                    <div className='w-full text-center'>
                      No bids for this pair...
                    </div>
                }
              </div>
              <div className={`mt-1 flex-1`}>
                {
                  rightTable.length > 0 ?
                    <table className="min-w-full border border-gray-200 dark:border-gray-700">
                      <thead className="">
                        <tr>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Ask Price
                              </span>
                              <span>
                                ({displayCounterAsset})
                              </span>
                            </div>
                          </th>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Amount
                              </span>
                              <span>
                                ({displayBaseAsset})
                              </span>
                            </div>
                          </th>
                          <th
                            className="p-2 text-right font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider">
                            <div className='flex flex-col'>
                              <span>
                                Total
                              </span>
                              <span>
                                ({displayBaseAsset})
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="border border-gray-200 dark:border-gray-700">
                        {
                          rightTable.map((row, index) => (
                            <tr key={index} className={`border border-gray-200 dark:border-gray-700 hover:bg-gray-500 ${Address === row.Account ? 'font-bold text-text-secondary dark:text-dark-text-secondary' : 'text-gray-800 dark:text-gray-300'}`} title={row.Account}>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Price}
                              </td>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Amount}
                              </td>
                              <td className="p-2 whitespace-nowrap text-base text-right">
                                {row.Sum}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    :
                    <div className='w-full text-center'>
                      No asks for this pair...
                    </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}