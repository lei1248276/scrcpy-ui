import { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain } from 'electron'
import Scrcpy, { defaultScrcpyOptions } from '../scrcpy'
import { appStore } from '../store/appStore'

import icon_22x22 from '../../../resources/icon_22x22.png?asset'

let tray = null as Tray | null

const trayTemplate: Parameters<typeof Menu.buildFromTemplate>[0] = [
  {
    id: 'usb',
    type: 'radio',
    label: 'USB',
    click: () => {
      Scrcpy.start(['--select-usb'])
    }
  },
  {
    id: 'close',
    type: 'radio',
    label: 'Close',
    checked: true,
    click: () => {
      Scrcpy.stop()
    }
  },
  { type: 'separator' },
  {
    id: 'alwaysTop',
    label: 'Always on Top',
    type: 'checkbox',
    checked: appStore.get('alwaysTop')
      ? (defaultScrcpyOptions.push('--always-on-top'), true)
      : false,
    click: (menuItem) => {
      appStore.set('alwaysTop', menuItem.checked)
      menuItem.checked
        ? defaultScrcpyOptions.splice(defaultScrcpyOptions.indexOf('--always-on-top'), 1)
        : defaultScrcpyOptions.push('--always-on-top')
    }
  },
  {
    id: 'hideDock',
    label: 'Hide Dock',
    type: 'checkbox',
    checked: appStore.get('hideDock')
      ? (app.dock.hide(), true)
      : false,
    click: (menuItem) => {
      appStore.set('hideDock', menuItem.checked)
      menuItem.checked ? app.dock.hide() : app.dock.show()
    }
  },
  {
    id: 'hideWindow',
    label: 'Hide Window',
    type: 'checkbox',
    checked: appStore.get('hideWindow'),
    click: (menuItem) => {
      appStore.set('hideWindow', menuItem.checked)
    }
  },
  { type: 'separator' },
  {
    id: 'add',
    label: 'Add IP Address',
    click: () => {
      showInputBox()
    }
  },
  {
    id: 'exit',
    label: 'Exit',
    click: () => {
      Scrcpy.stop()
      app.quit()
    }
  }
]

function showInputBox() {
  const win = new BrowserWindow({
    width: 300,
    height: 60,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body>
        <input id="input" type="text" autofocus style="width: 100%; height: 100%; display: block; vertical-align: middle; font-size: 26px; padding: 10px; border: none; outline: none;" />

        <script>
          const { ipcRenderer } = require('electron');
          const validIp = ${/^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?::(?:[0-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/}

          document.getElementById('input').addEventListener('keydown', ({ key, target }) => {
            if (key === 'Enter') {
              validIp.test(target.value)
                ? ipcRenderer.send(target.value)
                : target.select()
            }
          });
        </script>
      </body>
    </html>`
  )

  win.webContents.once('ipc-message', (_, _ip) => {
    console.log('输入的内容:', _ip)
    win.close()

    const _ips = appStore.get('ips')
    !_ips.includes(_ip) && ipcMain.emit('setStoreIps', undefined, [_ip].concat(_ips))
    ipcMain.emit('scrcpy', undefined, _ip)
  })
}

//* 从 appStore 缓存中获取 ips，创建对应的菜单项
function getIps() {
  return appStore.get('ips')
    .filter(Boolean)
    .map((ip: string, i: number) => {
      const obj: typeof trayTemplate[number] = {
        id: 'tcp' + i,
        type: 'radio',
        label: ip,
        click: () => {
          Scrcpy.start(['--tcpip=' + ip])
        }
      }
      return obj
    }) as typeof trayTemplate
}

let timer: ReturnType<typeof setTimeout> | null = null
export const replaceTray = (...item: typeof trayTemplate[number][]) => {
  if (!tray) return

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const contextMenu = Menu.buildFromTemplate(item.concat(trayTemplate))
    tray!.setContextMenu(contextMenu)
    timer = null
  })
}

export const updateTray = (match: typeof trayTemplate[number]) => {
  if (!tray) return

  const item = trayTemplate.find((item) => item.id === match.id || item.label === match.label)
  if (!item) return console.error('未找到匹配项')

  Object.assign(item, match)
  const contextMenu = Menu.buildFromTemplate(getIps().concat(trayTemplate))
  tray.setContextMenu(contextMenu)
}

export const createTray = () => {
  if (tray) return tray

  tray = new Tray(nativeImage.createFromPath(icon_22x22))
  const contextMenu = Menu.buildFromTemplate(getIps().concat(trayTemplate))
  tray.setContextMenu(contextMenu)
  tray.popUpContextMenu(contextMenu)

  return tray
}
