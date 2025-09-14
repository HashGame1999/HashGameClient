import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ConsolePageTab } from '../lib/AppConst'
import TabPlay from './console/TabPlay'
import TabArchive from './console/TabArchive'
import TabSetting from './console/TabSetting'
import { setActiveTabConsole } from '../store/slices/DealerSlice'

export default function ConsolePage() {
  const tabItems = [
    { name: ConsolePageTab.Play, content: <TabPlay /> },
    { name: ConsolePageTab.Archive, content: <TabArchive /> },
    { name: ConsolePageTab.Setting, content: <TabSetting /> },
  ]

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { activeTabConsole } = useSelector(state => state.Dealer)

  return (
    <div className="p-1 mt-8">
      <div className="flex justify-center items-center">
        <div className="w-full overflow-y-auto text-gray-800 dark:text-gray-200 transition-width duration-300 ease-in-out pb-20"
        >
          <div className="flex border-b">
            {tabItems.map((item, index) => (
              <button
                key={item.name}
                onClick={() => dispatch(setActiveTabConsole(item.name))}
                className={`px-6 py-3 ${activeTabConsole === item.name ?
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
            {tabItems.map((item, index) => (
              <div
                key={item.name}
                className={`${activeTabConsole === item.name ? 'block' : 'hidden'}`}
              >
                {item.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}