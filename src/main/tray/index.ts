import { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import Scrcpy from '../scrcpy'
import { appStore } from '../store/appStore'
import { platform } from '@electron-toolkit/utils'
import { createWindow } from '../index'

import icon_22x22 from '../../../resources/icon_22x22.png?asset'

let tray = null as Tray | null

const trayTemplate: Parameters<typeof Menu.buildFromTemplate>[0] = [
  {
    id: 'usb',
    type: 'radio',
    label: 'USB',
    click: () => {
      Scrcpy.start(['--select-usb', ...appStore.get('scrcpyOptions')])
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
  ...(platform.isMacOS
    ? [{
      id: 'hideDock',
      label: 'Hide Dock',
      type: 'checkbox',
      get checked() {
        return appStore.get('hideDock')
          ? (app.dock.isVisible() && app.dock.hide(), true)
          : false
      },
      click: (menuItem) => {
        appStore.set('hideDock', menuItem.checked)
        menuItem.checked ? app.dock.hide() : app.dock.show()
      }
    }, {
      id: 'closeNotification',
      label: 'Close Notification',
      type: 'checkbox',
      get checked() {
        return appStore.get('closeNotification')
      },
      click: (menuItem) => {
        appStore.set('closeNotification', menuItem.checked)
      }
    }] as Parameters<typeof Menu.buildFromTemplate>[0]
    : [] as any),
  {
    id: 'hideWindow',
    label: 'Hide Window',
    type: 'checkbox',
    get checked() {
      return appStore.get('hideWindow')
    },
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
    id: 'launch',
    label: 'Launch',
    click: () => {
      !BrowserWindow.getAllWindows().length && createWindow()
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
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false
    }
  })

  win.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body>
        <input id="input" type="text" autofocus style="width: 100%; height: 100%; vertical-align: middle; font-size: 26px; padding: 10px; caret-color: rgb(204,51,56); border: none; outline: none;" />

        <script>
          const validIp = ${/^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?::(?:[0-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/}

          document.getElementById('input').addEventListener('keydown', ({ key, target }) => {
            if (key === 'Enter') {
              validIp.test(target.value)
                ? window.electron.ipcRenderer.send(target.value)
                : target.select()
            }
          });
        </script>
      </body>
    </html>`
  )

  win.webContents.once('ipc-message', (_, _ip: string) => {
    console.log('输入的内容:', _ip)
    win.close()

    const _ips = appStore.get('ips')
    if (!_ips.includes(_ip)) {
      _ips.unshift(_ip)
      ipcMain.emit('setStoreIps', undefined, _ips)
    }
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
          Scrcpy.start(['--tcpip=' + ip, ...appStore.get('scrcpyOptions')])
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

  if (platform.isWindows) {
    tray.setToolTip('Scrcpy UI')
    tray.on('click', () => {
      !BrowserWindow.getAllWindows().length && createWindow()
    })
  }

  return tray
}
