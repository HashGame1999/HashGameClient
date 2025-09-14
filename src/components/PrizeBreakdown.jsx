import { useState, useEffect } from 'react'
import { BsHeartbreakFill, Bs1CircleFill, Bs2CircleFill, Bs3CircleFill, BsTrophyFill } from "react-icons/bs"

const PrizeBreakdown = ({ breakdown_json }) => {
  const [rank1Count, setRank1Count] = useState(0)
  const [rank2Count, setRank2Count] = useState(0)
  const [rank3Count, setRank3Count] = useState(0)

  useEffect(() => {
    Object.keys(breakdown_json).forEach(key => {
      if (key === 'Rank#1') {
        setRank1Count(breakdown_json[key].length)
      } else if (key === 'Rank#2') {
        setRank2Count(breakdown_json[key].length)
      } else if (key === 'Rank#3') {
        setRank3Count(breakdown_json[key].length)
      }
    })
  }, [])

  return (
    <div className={`font-mono flex items-center justify-center`}>
      {
        rank1Count > 0 &&
        <div className="mx-auto flex flex-row">
          <Bs1CircleFill className='text-rose-700 text-2xl' />
          <h3 className="px-1 rounded-full font-bold text-gray-500">
            x
          </h3>
          <h3 className="font-bold text-gray-500">
            {rank1Count}
          </h3>
        </div>
      }
      {
        rank2Count > 0 &&
        <div className="mx-auto flex flex-row">
          <Bs2CircleFill className='text-rose-500 text-2xl' />
          <h3 className="px-1 rounded-full font-bold text-gray-500">
            x
          </h3>
          <h3 className="font-bold text-gray-500">
            {rank2Count}
          </h3>
        </div>
      }
      {
        rank3Count > 0 &&
        <div className="mx-auto flex flex-row items-center justify-center text-base">
          <Bs3CircleFill className='text-rose-300 text-2xl' />
          <h3 className="px-1 rounded-full font-bold text-gray-500">
            x
          </h3>
          <h3 className="font-bold text-gray-500">
            {rank3Count}
          </h3>
        </div>
      }
    </div>
  )
}

export default PrizeBreakdown