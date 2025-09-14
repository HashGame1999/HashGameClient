const XRP2DropRate = 1000 * 1000
const DefaultCoinIssuer = 'Ripple'
const DefaultCoinCode = 'XRP'
const MainNetURL = 'wss://xrplcluster.com'
const MainNetS1URL = 'wss://s1.ripple.com'
const MainNetS2URL = 'wss://s2.ripple.com'
const TestNetURL = 'wss://s.altnet.rippletest.net:51233'
const ServerOptions = [
  { value: MainNetURL, label: `Main Net: ${MainNetURL}` },
  { value: MainNetS1URL, label: `Main Net: ${MainNetS1URL}` },
  { value: MainNetS2URL, label: `Main Net: ${MainNetS2URL}` }
]

const MasterAccount = 'rBoy4AAAAA9qxv7WANSdP5j5y59NP6soJS'
const SettingAccount = 'r99919888p3cmJJR3RwATzhR5pCebJqzwd'
const GameAccount = 'rGame2259FRZwRYHCZsQT8JWiFDWpvPjCd'

const TxType = {
  Payment: 'Payment',
  OfferCreate: 'OfferCreate',
  OfferCancel: 'OfferCancel',
  TrustSet: 'TrustSet',
  AccountDelete: 'AccountDelete'
}

const TxResult = {
  Success: 'tesSUCCESS'
}

const PaySubAction = {
  Normal: 'Normal',
  Path: 'Path',
  Play: 'Play'
}

const TableSetting = {
  GameTxs: {
    Name: 'GAME_TXS',
    Key: 'tx_hash'
  },
  OperatorTxs: {
    Name: 'OPERATOR_TXS',
    Key: 'tx_hash'
  },
  Draws: {
    Name: 'DRAWS',
    Key: 'draw_id'
  },
  Breakdowns: {
    Name: 'BREAKDOWNS',
    Key: 'ticket_tx_hash'
  }
}

const CodeColor = {
  0: 'border border-green-500 text-gray-800 dark:text-gray-300',
  1: 'border border-green-500 text-gray-800 dark:text-gray-300',
  2: 'border border-green-500 text-gray-800 bg-yellow-300 text-gray-700',
  3: 'border border-green-500 text-gray-800 bg-yellow-300 text-gray-700',
  4: 'border border-green-500 text-gray-800 bg-yellow-400 text-gray-700',
  5: 'border border-green-500 text-gray-800 bg-indigo-500 text-gray-700'
}

export {
  DefaultCoinIssuer,
  DefaultCoinCode,
  MasterAccount,
  SettingAccount,
  GameAccount,
  XRP2DropRate,
  MainNetURL,
  TestNetURL,
  ServerOptions,
  TxType,
  TxResult,
  TableSetting,
  PaySubAction,
  CodeColor
}