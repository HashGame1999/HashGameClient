import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { MainNetURL, ServerOptions } from '../../lib/RippleConst'
import SelectInput from '../../components/Form/SelectInput'
import { SettingPageTab } from '../../lib/AppConst'

export default function TabXRPNetwork() {
  const [serverURL, setServerURL] = useLocalStorage('ServerURL', MainNetURL)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleServer = (value) => {
    setServerURL(value)
    dispatch({ type: 'DisconnectXRPL' })
  }

  return (
    <div className="tab-page">
      <div className="mx-auto flex flex-col mt-4">
        <div className="card-title">
          {SettingPageTab.XRPNetwork}
        </div>
        <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
          <div className="mx-auto space-y-2">
            <SelectInput label={'Server:'} options={ServerOptions} selectdOption={serverURL} onChange={(e) => handleServer(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}