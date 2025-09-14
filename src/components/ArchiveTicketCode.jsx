import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CodeColor } from '../lib/RippleConst'
import { BsHeartbreakFill, Bs1CircleFill, Bs2CircleFill, Bs3CircleFill, BsTrophyFill } from "react-icons/bs"

const ArchiveTicketCode = ({ codes, jackpot_code }) => {
  const [displayCodes, setDisplayCodes] = useState([])
  const { GameSetting } = useSelector(state => state.Dealer)

  useEffect(() => {
    let jackpot_code_length = jackpot_code.length
    let tmps = []
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]
      let match_count = 0
      for (let j = 0; j < jackpot_code_length; j++) {
        if (code[j] === jackpot_code[j]) {
          match_count += 1
        } else {
          break
        }
      }
      let tmp = {
        MatchCount: match_count,
        MatchChars: code.slice(0, match_count),
        DismatchChars: code.slice(match_count)
      }
      tmps.push(tmp)
    }
    setDisplayCodes(tmps)
  }, [])

  return (
    <div className={`inline-block flex flex-wrap gap-1`}>
      {displayCodes.map((code, index) => (
        <span key={index} className={`font-mono flex border rounded items-center justify-center ${CodeColor[code.MatchCount]}`}>
          {
            code.MatchCount < GameSetting.PrizeCodeLength[0] &&
            <BsHeartbreakFill className={''} />
          }
          {
            code.MatchCount === GameSetting.PrizeCodeLength[0] &&
            <Bs3CircleFill className={"text-red-500"} />
          }
          {
            code.MatchCount === GameSetting.PrizeCodeLength[1] &&
            <Bs2CircleFill className={"text-red-500"} />
          }
          {
            code.MatchCount === GameSetting.PrizeCodeLength[2] &&
            <Bs1CircleFill className={"text-red-500"} />
          }
          {
            code.MatchCount === GameSetting.JackpotCodeLength &&
            <BsTrophyFill className={"text-red-500"} />
          }
          <span className="text-red-500">
            {code.MatchChars}
          </span>
          <span>
            {code.DismatchChars}
          </span>
        </span>
      ))}
    </div>
  )
}

export default ArchiveTicketCode