import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { SettingPageTab } from '../lib/AppConst'
import TabXRPNetwork from './setting/TabXRPNetwork'
import TabSignature from './setting/TabSignature'
import { setActiveTabSetting } from '../store/slices/UserSlice'

export default function SettingPage() {
  const tabItems = [
    { name: SettingPageTab.XRPNetwork, content: <TabXRPNetwork /> },
    { name: SettingPageTab.Signature, content: <TabSignature /> },
  ]

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { activeTabSetting } = useSelector(state => state.User)

  return (
    <div className="p-1 mt-8 flex justify-center items-center">
      <div className="w-full overflow-y-auto transition-width duration-300 ease-in-out"
      >
        <div className="flex border-b border-gray-700 dark:border-gray-200">
          {tabItems.map((item, index) => (
            <button
              key={index}
              onClick={() => dispatch(setActiveTabSetting(item.name))}
              className={`px-6 py-3 ${activeTabSetting === item.name ?
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
          <div>
            {
              tabItems.map((item, index) => (
                <div
                  key={index}
                  className={`${activeTabSetting === item.name ? 'block' : 'hidden'}`}
                >
                  {item.content}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}