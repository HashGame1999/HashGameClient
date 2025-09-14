import { useState } from 'react'
import { useSelector } from 'react-redux'
import { signJson, verifyJson } from '../../lib/RippleUtil'

export default function TabSignature() {
  const [json2Sign, setJson2Sign] = useState('')
  const [signResult, setSignResult] = useState('')
  const [json2Verify, setJson2Verify] = useState('')
  const [verifyResult, setVerifyResult] = useState('')

  const { seed } = useSelector(state => state.Counter)

  const handelSign = async (value) => {
    value = value.trim()
    setJson2Sign(value)
    if (value === '') {
      setSignResult('')
      return
    }
    try {
      let json = JSON.parse(value)
      let signed_json = signJson(json, seed)
      setSignResult(JSON.stringify(signed_json))
    } catch (e) {
      setSignResult(e.message)
    }
  }

  const handelVerify = async (value) => {
    value = value.trim()
    setJson2Verify(value)
    if (value === '') {
      setVerifyResult('')
      return
    }
    try {
      let json = JSON.parse(value)
      let result = verifyJson(json)
      if (result) {
        setVerifyResult(`signed by ${result}`)
      } else {
        setVerifyResult(`signature invalid...`)
      }
    } catch (e) {
      setVerifyResult(`json invalid...`)
    }
  }

  return (
    <div className="tab-page">
      <div className="mx-auto w-full flex flex-col mt-4">
        <div className="card-title">
          Signature
        </div>

        <div className="min-w-full p-2 flex gap-1 rounded-lg shadow-xl justify-center">
          <div className={`mt-1 flex-1 p-2`}>
            <div className="justify-center flex flex-col p-2">
              <span className={`lable`}>
                {'Json to sign:'}
              </span>
              <textarea type={"text"}
                id={`${'Json to sign:' + Math.random()}`}
                name={'Json to sign:'}
                value={json2Sign}
                rows="6"
                onChange={(e) => handelSign(e.target.value)}
                className={`p-2 border rounded shadow-xl appearance-none input-color`}
              />
            </div>
            <div className="max-w-xl overflow-x-auto overflow-y-auto whitespace-normal break-words p-2 rounded-xl shadow-2xl items-center p-2 text-text-secondary dark:text-dark-text-secondary">
              {signResult}
            </div>
          </div>
          <div className={`mt-1 flex-1 p-2`}>
            <div className="justify-center flex flex-col p-2">
              <span className={`lable`}>
                {'Json to verify:'}
              </span>
              <textarea type={"text"}
                id={`${'Json to verify:' + Math.random()}`}
                name={'Json to verify:'}
                value={json2Verify}
                rows="6"
                onChange={(e) => handelVerify(e.target.value)}
                className={`p-2 border rounded shadow-xl appearance-none input-color`}
              />
            </div>
            <div className="overflow-x-auto overflow-y-auto whitespace-normal break-words p-2 rounded-xl shadow-2xl items-center p-2 text-text-secondary dark:text-dark-text-secondary">
              {verifyResult}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}