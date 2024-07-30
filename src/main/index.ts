import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'node:path'
import fixPath from 'fix-path'
import Scrcpy from './scrcpy'
import { createTray } from './tray'

let win: BrowserWindow

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 513,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    console.log('%c🚀 ~ file: index.ts:21 ~ mainWindow.on ~ ready-to-show:', 'color:#a8c7fa')
    win.show()
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.scrcpyui.app')

  createTray()

  // createWindow()

  fixPath()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    console.log('%c🚀 ~ file: index.ts:50 ~ app.on ~ browser-window-created:', 'color:#a8c7fa')

    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function() {
    console.log('%c🚀 ~ file: index.ts:60 ~ app.on ~ activate:', 'color:#a8c7fa')
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('scrcpy', (_, _ip: string) => {
    Scrcpy.start(_ip ? [`--tcpip=${_ip}`] : ['--select-usb'])
    !win?.isDestroyed() && win?.close()

    ipcMain.on('scrcpy-kill', () => {
      Scrcpy.stop()
    })
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  Scrcpy.stop()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
