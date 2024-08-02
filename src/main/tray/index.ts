import { app, Tray, Menu, nativeImage } from 'electron'
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
  { type: 'separator' },
  {
    id: 'exit',
    label: 'Exit',
    click: () => {
      Scrcpy.stop()
      app.quit()
    }
  }
]

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
export const addTray = (...item: typeof trayTemplate[number][]) => {
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
