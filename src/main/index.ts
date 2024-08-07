import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { optimizer, is } from '@electron-toolkit/utils'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fixPath from 'fix-path'
import Scrcpy from './scrcpy'
import { createTray, addTray, updateTray } from './tray'
import { appStore } from './store/appStore'

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 513,
    height: 800,
    show: false,
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    console.log('🚀 ~ file: index.ts:21 ~ mainWindow.on ~ ready-to-show:')
    win.show()
  })

  is.dev && win.webContents.openDevTools()

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createTray()

  !appStore.get('hideWindow') && createWindow()

  setTimeout(fixPath)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    console.log('🚀 ~ file: index.ts:50 ~ app.on ~ browser-window-created:')

    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function() {
    console.log('🚀 ~ file: index.ts:60 ~ app.on ~ activate:')
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('setStoreIps', (_, ips: string[]) => {
    appStore.set('ips', ips)
    addTray(...ips.map((ip, i) => ({
      id: 'tcp' + (i + 1),
      type: 'radio',
      label: ip,
      checked: false,
      click: () => {
        Scrcpy.start(['--tcpip=' + ip])
      }
    } as const)))
  })

  ipcMain.on('scrcpy', (_, ip: string) => {
    if (ip) {
      Scrcpy.start(['--tcpip=' + ip])
      updateTray({ label: ip, checked: true })
    } else {
      Scrcpy.start(['--select-usb'])
      updateTray({ id: 'usb', label: 'USB', checked: true })
    }
    updateTray({ id: 'close', checked: false })
    // !win?.isDestroyed() && win?.close()

    ipcMain.once('scrcpy-kill', () => {
      Scrcpy.stop()
    })
  })

  Scrcpy.event.on('kill', () => {
    console.log('🚀 ~ file: index.ts:101 ~ Scrcpy.event.on ~ kill:')
    updateTray({ id: 'close', checked: true })
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  Scrcpy.stop()
})
