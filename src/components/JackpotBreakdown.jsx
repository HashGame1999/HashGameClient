import { useState, useEffect } from 'react'
import { BsTrophyFill } from "react-icons/bs"

const JackpotBreakdown = ({ breakdown_json }) => {
  const [jackpotCount, setJackpotCount] = useState(0)

  useEffect(() => {
    setJackpotCount(breakdown_json.length)
  }, [])

  return (
    <div className={`font-mono flex items-center justify-center`}>
      {
        jackpotCount > 0 &&
        <div className="mx-auto flex flex-row">
          <BsTrophyFill className='text-indigo-500 text-2xl' />
          <h3 className="px-1 rounded-full font-bold text-gray-500">
            x
          </h3>
          <h3 className="font-bold text-gray-500">
            {jackpotCount}
          </h3>
        </div>
      }
    </div>
  )
}

export default JackpotBreakdown