import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import TabAccount from './wallet/TabAccount'
import TabSend from './wallet/TabSend'
import TabConvert from './wallet/TabConvert'
import TabTrade from './wallet/TabTrade'
import TabHistroy from './wallet/TabHistroy'
import TabAsset from './wallet/TabAsset'
import TabDelete from './wallet/TabDelete'
import TabRedeem from './wallet/TabRedeem'
import { resetSubmitResult, setActiveTabWallet } from '../store/slices/CounterSlice'
import { WalletPageTab } from '../lib/AppConst'

export default function WalletPage() {
  const tabItems = [
    { name: WalletPageTab.Account, content: <TabAccount /> },
    { name: WalletPageTab.Send, content: <TabSend /> },
    { name: WalletPageTab.Convert, content: <TabConvert /> },
    { name: WalletPageTab.Trade, content: <TabTrade /> },
    { name: WalletPageTab.Assets, content: <TabAsset /> },
    { name: WalletPageTab.Histroy, content: <TabHistroy /> },
    { name: WalletPageTab.Delete, content: <TabDelete /> },
    { name: WalletPageTab.Redeem, content: <TabRedeem /> },
  ]

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { ConnStatus } = useSelector(state => state.Ripple)
  const { activeTabWallet, submitResult } = useSelector(state => state.Counter)

  useEffect(() => {
    let timer = null
    if (submitResult !== null) {
      timer = setTimeout(() => {
        dispatch(resetSubmitResult())
      }, 3000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [submitResult])

  return (
    <div className="p-1 mt-8 flex justify-center items-center">
      <div className="w-full overflow-y-auto text-gray-800 dark:text-gray-200 transition-width duration-300 ease-in-out"
      >
        <div className="flex border-b border-gray-700 dark:border-gray-200">
          {tabItems.map((item, index) => (
            <button
              key={index}
              onClick={() => dispatch(setActiveTabWallet(item.name))}
              className={`px-6 py-3 ${activeTabWallet === item.name ?
                'tab-title-active'
                :
                'tab-title'
                }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="p-4">
          {!ConnStatus ?
            <span className='text-3xl text-gray-800 dark:text-gray-200'>
              disconnect...
            </span>
            :
            <div>
              {
                tabItems.map((item, index) => (
                  <div
                    key={index}
                    className={`${activeTabWallet === item.name ? 'block' : 'hidden'}`}
                  >
                    {item.content}
                  </div>
                ))
              }
            </div>
          }
        </div>
      </div>
    </div>
  )
}