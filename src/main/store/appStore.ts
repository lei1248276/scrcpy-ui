import Store from 'electron-store'

export const appStore = new Store({
  defaults: {
    ips: [] as string[],
    hideDock: false,
    hideWindow: false
  }
})
