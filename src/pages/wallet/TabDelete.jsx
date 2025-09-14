import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { submitActionStart } from '../../store/slices/CounterSlice'
import TextInput from '../../components/Form/TextInput'
import FormError from '../../components/Form/FormError'
import LoadingDiv from '../../components/LoadingDiv'
import { TxType } from '../../lib/RippleConst'
import FormButton from '../../components/Form/FormButton'
import SubmitResult from '../../components/SubmitResult'

export default function TabDelete() {
  const { isLoading, loadingText, submitResult, error, TrustLineList, OfferList } = useSelector(state => state.Counter)

  const [dest, setDest] = useState('')

  const dispatch = useDispatch()

  const handleSubmit = async (e) => {
    e.preventDefault()
    let payload = {
      action: TxType.AccountDelete,
      dest: dest
    }
    dispatch(submitActionStart(payload))

    // reset
    setDest('')
  }

  return (
    <div className="flex justify-center items-center">
      <div className="tab-page">
        <div className="flex flex-col p-1">
          <LoadingDiv isLoading={isLoading} text={loadingText} />
          <div className="mx-auto flex flex-col mt-4">
            <div className="card-title">
              !!!Delete
            </div>

            {TrustLineList?.length === 0 && OfferList?.length === 0 ?
              <div className="min-w-full p-2 rounded-lg shadow-xl justify-center">
                <form className="max-w-4xl mx-auto flex flex-col items-center justify-start" onSubmit={handleSubmit}>
                  <div className={`mt-1`}>
                    <TextInput label={'Destination:'} placeholder={'r...destination...'} value={dest} onChange={(e) => setDest(e.target.value)} />
                  </div>
                  <div className={`mt-1`}>
                    <FormButton disabled={isLoading} title={'!!!Delete'} bgColor='bg-red-500 hover:bg-red-600' />
                  </div>
                </form>
                <FormError error={error} />
                <SubmitResult result={submitResult} />
              </div>
              :
              <div>
                make sure your account has no trusted asset and no offer...
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}