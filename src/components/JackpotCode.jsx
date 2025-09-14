const JackpotCode = ({ jackpot_code, className = '' }) => {
  return (
    <div className="justify-evenly flex flex-row">
      {jackpot_code.split('').map((char, index) => (
        <div key={index} className="flex mx-1 items-center justify-center w-16 h-16 rounded-full bg-red-500">
          <span className="text-6xl font-bold text-gray-800">
            {char}
          </span>
        </div>
      ))}
    </div>
  )
}

export default JackpotCode