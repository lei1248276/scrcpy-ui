import Store from 'electron-store'

export const appStore = new Store({
  defaults: {
    ips: [] as string[],
    alwaysTop: false,
    hideDock: false,
    hideWindow: false
  }
})
