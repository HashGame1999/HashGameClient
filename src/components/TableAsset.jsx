import { useState, useEffect } from 'react'
import { DefaultCoinCode, DefaultCoinIssuer } from "../lib/RippleConst"
import { dropsToXrp } from 'xrpl'

const TableAsset = ({ asset, textSize = 'text-base' }) => {
  const [displayAsset, setDisplayAsset] = useState([])

  useEffect(() => {
    let tmpAsset = {
      Issuer: DefaultCoinIssuer,
      Currency: DefaultCoinCode
    }
    if (typeof asset === 'string') {
      tmpAsset.Amount = asset
    } else {
      tmpAsset.Issuer = asset.issuer
      tmpAsset.Currency = asset.currency
      tmpAsset.Amount = asset.value
    }
    setDisplayAsset(tmpAsset)
  }, [])

  return (
    <div className={`${textSize}`}>
      {
        displayAsset.Currency === DefaultCoinCode ?
          <span>
            <span className='font-bold pl-1'>
              {dropsToXrp(displayAsset.Amount)}
            </span>
            <span className={'text-green-500'}>
              {DefaultCoinCode}
            </span>
          </span>
          :
          <span title={`${displayAsset.Currency}.${displayAsset.Issuer}`}>
            <span className='font-bold pl-1'>
              {displayAsset.Amount}
            </span>
            <span className={'text-yellow-500'}>
              {displayAsset.Currency}
            </span>
          </span>
      }
    </div>
  )
}

export default TableAsset