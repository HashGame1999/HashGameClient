import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import PortalPage from './pages/PortalPage'
import HistroyPage from './pages/HistroyPage'
import DrawPage from './pages/DrawPage'
import AboutPage from './pages/AboutPage'
import OpenPage from './pages/OpenPage'
import WalletPage from './pages/WalletPage'
import ConsolePage from './pages/ConsolePage'
import SettingPage from './pages/SettingPage'

import NavBarIconLink from './components/NavBarIconLink'
import NavBarIconButton from './components/NavBarIconButton'
import ExternalLink from './components/ExternalLink'
import InternalLink from './components/InternalLink'

import { useLocalStorage } from './hooks/useLocalStorage'
import { updateIsExplicitDisconnect } from './store/slices/RippleSlice'
import { loginStart, logoutStart } from './store/slices/UserSlice'

import { TbCurrencyXrp } from "react-icons/tb"
import { IoGameControllerOutline, IoSettingsOutline, IoReloadSharp, IoArrowForwardSharp, IoArrowBackSharp } from "react-icons/io5"
import { FiSun, FiMoon, FiLogOut, FiLogIn } from "react-icons/fi"
import { HiOutlineStatusOnline, HiOutlineStatusOffline } from "react-icons/hi"
import FlashNotice from './components/FlashNotice'
import JsonDiv from './components/JsonDiv'

function App() {
  const [isDark, setIsDark] = useLocalStorage('isDark', false)

  const { ConnStatus, latestLedger } = useSelector(state => state.Ripple)
  const { Address, IsAuth, FlashNoticeMessage, DisplayJson, FlashNoticeDuration } = useSelector(state => state.User)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // route
  const location = useLocation()
  const UnAuthPaths = ['/open']
  const AuthPaths = ['/setting', '/wallet', '/console']
  const GeneralPaths = ['/', '/about', '/histroy', '/draw']

  useEffect(() => {
    let isGeneralPath = GeneralPaths.includes(location.pathname)
    let isAuthPaths = AuthPaths.includes(location.pathname)
    let isUnAuthPaths = UnAuthPaths.includes(location.pathname)
    const localSeed = localStorage.getItem("Seed")
    const localAddress = localStorage.getItem("Address")

    if (!IsAuth && localSeed) {
      dispatch(loginStart({ seed: localSeed, address: localAddress }))
    }

    if (isGeneralPath) {
      return
    } else if (localAddress && isUnAuthPaths) {
      navigate('/wallet')
    } else if (!localAddress && isAuthPaths) {
      navigate('/open')
    }
  }, [navigate])

  const walletLogout = () => {
    console.log('walletLogout')
    dispatch(logoutStart())
    navigate('/')
  }

  // xrpl
  const doConnect = async () => {
    if (!ConnStatus) {
      try {
        dispatch(updateIsExplicitDisconnect(false))
        dispatch({ type: 'ConnectXRPL' })
      } catch (error) {
        console.error('connecting:', error)
      }
    }
  }

  const doDisconnect = async () => {
    if (ConnStatus) {
      try {
        dispatch(updateIsExplicitDisconnect(true))
        dispatch({ type: 'DisconnectXRPL' })
      } catch (error) {
        console.error('disconnecting:', error)
      }
    }
  }

  // theme
  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (systemDark ? 'dark' : 'light')
    setIsDark(initialTheme === 'dark')
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {
        FlashNoticeMessage &&
        <FlashNotice message={FlashNoticeMessage} duration={FlashNoticeDuration} />
      }
      {
        DisplayJson &&
        <JsonDiv json={DisplayJson} />
      }
      <nav className="nav bar">
        <div className="mx-auto max-w-7xl flex justify-between items-center px-8">
          <div className="flex items-center">
            <InternalLink path={"/"} title={"HashGame"} text_size={"text-2xl"} />
            <button
              onClick={() => ConnStatus ? doDisconnect() : doConnect()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            >
              {
                ConnStatus ?
                  <HiOutlineStatusOnline className="icon text-green-600 dark:text-green-400" />
                  :
                  <HiOutlineStatusOffline className="icon text-red-600 dark:text-red-400" />
              }
              {
                ConnStatus && latestLedger !== null &&
                <span className="text-xs">
                  {latestLedger.ledger_index}
                </span>
              }
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              {isDark ?
                <FiSun className="icon" />
                :
                <FiMoon className="icon" />}
            </button>
          </div>

          <div className="hidden md:flex space-x-2">
            {
              IsAuth ?
                <div className="flex flex-row items-center">
                  <span className="pl-4">
                    {Address}
                  </span>
                  <NavBarIconLink
                    path="/console"
                    icon={<IoGameControllerOutline className="icon" />}
                    label="Console"
                  />
                  <NavBarIconLink
                    path="/wallet"
                    icon={<TbCurrencyXrp className="icon" />}
                    label="Wallet"
                  />
                  <NavBarIconLink
                    path="/setting"
                    icon={<IoSettingsOutline className="icon" />}
                    label="Setting"
                  />
                  <NavBarIconButton
                    icon={<FiLogOut className="icon" />}
                    label="Close"
                    onClick={walletLogout}
                  />
                </div>
                :
                <div className="flex flex-row items-center">
                  <NavBarIconLink
                    path="/open"
                    icon={<FiLogIn className="icon" />}
                    label="Open"
                  />
                </div>
            }
          </div>
        </div>
      </nav>

      <main className="flex-1 main">
        <div className="mx-auto max-w-6xl pt-16">
          <div className="p-2 rounded-lg">
            <Routes>
              {/* general */}
              <Route path="/" element={<PortalPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/histroy" element={<HistroyPage />} />
              <Route path="/draw/:open_ledger_index" element={<DrawPage />} />
              <Route path="/setting" element={<SettingPage />} />

              {/* unAuth */}
              <Route path="/open" element={<OpenPage />} />

              {/* auth */}
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/console" element={<ConsolePage />} />
            </Routes>
          </div>
        </div>
      </main>

      <footer className="footer bar">
        <div className="mx-auto max-w-7xl flex justify-between items-center px-8">
          <ExternalLink href={"https://github.com/HashGame1999/HashGameClient"} title={"HashGame"} text_size={"text-base"} />
          <div className="flex justify-center items-center">
            <button
              onClick={() => window.history.back()}
              className="px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            >
              <IoArrowBackSharp className="icon" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            >
              <IoReloadSharp className="icon" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            >
              <IoArrowForwardSharp className="icon" />
            </button>
          </div>
          <div className="flex space-x-4">
            <InternalLink path={"/about"} title={"About"} text_size={"text-base"} />
          </div>
        </div>
      </footer>
    </div >
  )
}

export default App