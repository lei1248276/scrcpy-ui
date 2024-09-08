import { app, shell, BrowserWindow } from 'electron'
import { optimizer, is, platform } from '@electron-toolkit/utils'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import fixPath from 'fix-path'
import Scrcpy from './scrcpy'
import { createTray } from './tray'
import { appStore } from './store/appStore'

import icon_256x256 from '../../resources/icon_256x256.png?asset'

export function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 550,
    height: 800,
    show: false,
    icon: icon_256x256,
    autoHideMenuBar: true,
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    console.log('🚀 ~ file: index.ts:21 ~ mainWindow.on ~ ready-to-show:')
    win.show()
    is.dev && win.webContents.openDevTools()
  })

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

  const onMessage = (data) => win.webContents.send('scrcpyMessage', data)
  Scrcpy.on('scrcpyMessage', onMessage)
  win.on('close', () => {
    console.log('🚀 ~ file: index.ts:51 ~ win.on ~ close:')
    Scrcpy.off('scrcpyMessage', onMessage)
  })
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
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') e.preventDefault()
})

app.on('before-quit', () => {
  Scrcpy.stop()
  exec(`${platform.isWindows ? Scrcpy.scrcpyPath.replace('scrcpy.exe', 'adb.exe') : 'adb'} kill-server`)
})
