import { useState, useEffect } from 'react'
import { DefaultCoinCode, DefaultCoinIssuer } from "../../lib/RippleConst"
import { dropsToXrp } from 'xrpl'

const PathConvert = ({ alt, disabled, handleConvert }) => {
  const [displayAsset, setDisplayAsset] = useState([])

  useEffect(() => {
    let tmpAsset = {
      Issuer: DefaultCoinIssuer,
      Currency: DefaultCoinCode
    }
    if (typeof alt.source_amount === 'string') {
      tmpAsset.Amount = alt.source_amount
    } else {
      tmpAsset.Issuer = alt.source_amount.issuer
      tmpAsset.Currency = alt.source_amount.currency
      tmpAsset.Amount = alt.source_amount.value
    }
    setDisplayAsset(tmpAsset)
  }, [])

  return (
    <form className="max-w-2xl p-1 mx-auto flex flex-col items-center justify-start" onSubmit={handleConvert}>
      <div className={`text-xl`}>
        {
          displayAsset.Currency === DefaultCoinCode ?
            <span>
              <span className='font-bold'>
                {dropsToXrp(displayAsset.Amount)}
              </span>
              <span className={'text-green-500'}>
                {DefaultCoinCode}
              </span>
            </span>
            :
            <span title={`${displayAsset.Currency}.${displayAsset.Issuer}`}>
              <span className='font-bold'>
                {displayAsset.Amount}
              </span>
              <span className={'text-yellow-500'}>
                {displayAsset.Currency}
              </span>
            </span>
        }
      </div>
      <div className={`mt-1`}>
        <button
          type="submit"
          className="w-64 mt-2 py-2 text-2xl font-bold text-white rounded bg-green-600 hover:bg-green-500"
          disabled={disabled}
        >
          Convert
        </button>
      </div>
    </form>
  )
}

export default PathConvert