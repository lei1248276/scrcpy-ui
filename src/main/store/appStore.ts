import Store from 'electron-store'
import { ipcMain } from 'electron'
import Scrcpy from '../scrcpy'
import { replaceTray } from '../tray'

export const appStore = new Store({
  defaults: {
    ips: [] as string[],
    scrcpyOptions: [] as string[],
    hideDock: false,
    hideWindow: false,
    isStartScrcpy: false
  }
})

ipcMain.handle('getStoreIsStartScrcpy', () => appStore.get('isStartScrcpy'))

ipcMain.handle('getStoreIps', () => appStore.get('ips'))
ipcMain.on('setStoreIps', (_, ips: string[]) => {
  appStore.set('ips', ips)
  replaceTray(...ips.map((ip, i) => ({
    id: 'tcp' + (i + 1),
    type: 'radio',
    label: ip,
    checked: false,
    click: () => {
      Scrcpy.start(['--tcpip=' + ip, ...appStore.get('scrcpyOptions')])
    }
  } as const)))
})

ipcMain.handle('getStoreScrcpyOptions', () => appStore.get('scrcpyOptions'))
ipcMain.on('setStoreScrcpyOptions', (_, options: string[]) => {
  appStore.set('scrcpyOptions', options)
})
