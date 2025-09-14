const TableJackpotCode = ({ jackpot_code }) => {
  return (
    <div className="justify-center flex flex-row">
      {jackpot_code.split('').map((char, index) => (
        <div key={index} className="flex mx-1 items-center justify-center w-8 h-8 rounded-full bg-red-500">
          <span className="text-2xl font-bold text-gray-800">
            {char}
          </span>
        </div>
      ))}
    </div>
  )
}

export default TableJackpotCode