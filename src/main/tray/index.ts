import { app, Tray, Menu, nativeImage } from 'electron'
import Scrcpy from '../scrcpy'
import { appStore } from '../store/appStore'

import icon_22x22 from '../../../resources/icon_22x22.png?asset'

let tray = null as Tray | null

const trayTemplate: Parameters<typeof Menu.buildFromTemplate>[0] = [
  {
    id: 'tcp1',
    type: 'radio',
    label: '192.168.11.102',
    click: () => {
      Scrcpy.start(['--tcpip=192.168.11.102:5555'])
    }
  },
  {
    id: 'tcp2',
    type: 'radio',
    label: '10.26.0.222',
    click: () => {
      Scrcpy.start(['--tcpip=10.26.0.222:5555'])
    }
  },
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
    checked: (appStore as any).get('alwaysTop') || false,
    click: (menuItem) => {
      (appStore as any).set('alwaysTop', menuItem.checked)
    }
  },
  {
    id: 'hideDock',
    label: 'Hide Dock',
    type: 'checkbox',
    checked: (appStore as any).get('hideDock') ? (app.dock.hide(), true) : false,
    click: (menuItem) => {
      (appStore as any).set('hideDock', menuItem.checked)
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

export const updateTray = (match: typeof trayTemplate[number] & {id: string}) => {
  if (!tray) return

  const item = trayTemplate.find((item) => item.id === match.id)
  if (!item) return console.error('未找到匹配项')

  Object.assign(item, match)
  const contextMenu = Menu.buildFromTemplate(trayTemplate)
  tray.setContextMenu(contextMenu)
}

export const createTray = () => {
  tray = new Tray(nativeImage.createFromPath(icon_22x22))
  const contextMenu = Menu.buildFromTemplate(trayTemplate)
  tray.setContextMenu(contextMenu)
  tray.popUpContextMenu(contextMenu)

  return tray
}
