const WalletPageTab = {
  Account: 'Account',
  Send: 'Send',
  Convert: 'Convert',
  Trade: 'Trade',
  Assets: 'Assets',
  Histroy: 'Histroy',
  Delete: '!!!Delete',
  Redeem: '!!!Redeem'
}

const ConsolePageTab = {
  Play: 'Play',
  Archive: 'Archive',
  Setting: 'Setting',
}

const OpenPageTab = {
  GenNew: 'Generate',
  Temp: 'Temp',
  Saved: 'Saved',
  Add: 'Add',
}

const SettingPageTab = {
  XRPNetwork: 'XRP Network',
  Signature: 'Signature'
}

const CommonDBSchame = {
  LocalAccounts: `Address&, Salt, CipherData, UpdatedAt`,

  GameSettings: `OpenLedgerIndex&, CloseLedgerIndex, Index, Version`
}

export {
  OpenPageTab,
  SettingPageTab,
  WalletPageTab,
  ConsolePageTab,
  CommonDBSchame
}