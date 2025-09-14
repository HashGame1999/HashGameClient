const XTextInput = ({ currency, label, placeholder, value, onChange, disabled = false, onClick }) => {
  return (
    <div className="justify-center flex flex-col">
      <span className={`lable`}>
        {label}
      </span>
      <div className="justify-center flex flex-row items-center">
        <input type="number"
          id={label}
          name={label}
          placeholder={placeholder}
          autoComplete="off"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-80 p-2 border rounded shadow-xl appearance-none ${disabled ? 'input-hover-disabled' : 'input-hover border-green-500'} input-color`}
        />
        <div className="px-4 py-2 border rounded bg-gray-500" onClick={onClick}>
          {currency}
        </div>
      </div>
    </div>
  )
}

export default XTextInput