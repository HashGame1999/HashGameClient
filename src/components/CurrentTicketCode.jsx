import { useState, useEffect } from 'react'
import { BsHeartFill } from "react-icons/bs"

const CurrentTicketCode = ({ codes }) => {
  return (
    <div className={`inline-block flex flex-wrap gap-1`}>
      {codes.map((code, index) => (
        <span key={index+Math.random()} className={`border border-green-500 font-mono flex border rounded items-center justify-center`}>
          <BsHeartFill className={'text-gray-500'} />
          <span className="text-gray-800 dark:text-gray-200">
            {code}
          </span>
        </span>
      ))}
    </div>
  )
}

export default CurrentTicketCode