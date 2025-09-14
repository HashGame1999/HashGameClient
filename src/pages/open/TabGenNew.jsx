import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { Wallet, ECDSA } from 'xrpl'
import TextInput from '../../components/Form/TextInput'
import { MainNetURL } from '../../lib/RippleConst'
import { getWallet } from '../../lib/RippleUtil'

export default function TabGenNew() {
  const [newSeed, setNewSeed] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [ServerURL, setServerURL] = useLocalStorage('ServerURL', MainNetURL)

  const { IsAuth } = useSelector(state => state.User)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const genNewAccount = async () => {
    const tmp = Wallet.generate(ECDSA.secp256k1)
    setNewSeed(tmp.seed)
    const wallet = getWallet(tmp.seed, ServerURL)
    setNewAddress(wallet.classicAddress)
  }

  useEffect(() => {
    if (IsAuth) {
      navigate('/wallet')
    }
  }, [IsAuth])

  return (
    <div className="tab-page">
      <div className="p-2 rounded-lg shadow-xl mb-10">
        <div className="flex flex-col justify-center">
          <button
            onClick={genNewAccount}
            className="btn-primary"
          >
            Generate Account
          </button>
          <div className={`mt-2 ${newSeed === '' ? 'hidden' : ''}`}>
            <TextInput label={'Seed:'} value={newSeed} disabled={true} />
          </div>
          <div className={`mt-2 ${newAddress === '' ? 'hidden' : ''}`}>
            <TextInput label={'Address:'} value={newAddress} disabled={true} />
          </div>
        </div>
      </div>
    </div>
  )
}