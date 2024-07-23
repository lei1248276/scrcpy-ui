import { app, Tray, Menu, nativeImage, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

import icon from '../../resources/icon.png?asset'
import icon_22x22 from '../../resources/icon_22x22.png?asset'

import fixPath from 'fix-path'

fixPath()

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 513,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    console.log('%c🚀 ~ file: index.ts:21 ~ mainWindow.on ~ ready-to-show:', 'color:#a8c7fa')
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('%c🚀 ~ file: index.ts:38 ~ mainWindow.webContents.on ~ did-finish-load:', 'color:#a8c7fa')
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  const win = createWindow()

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

  let scrcpy: ReturnType<typeof spawn>
  let ip: string
  const createScrcpy = (_ip: string) => {
    try {
      ip = _ip
      scrcpy = spawn('scrcpy', ['--no-audio', '--keyboard=uhid', '--turn-screen-off', '--power-off-on-close', `--tcpip=${_ip}`]) // 在这里可以添加任何 scrcpy 的选项
      console.log('%c🚀 ~ file: index.ts:57 ~ app.on ~ scrcpy:', 'color:#a8c7fa', 'scrcpy 已启动')

      scrcpy.stdout!.on('data', (output) => {
        console.log(`标准输出: ${output.toString()}`)
      })

      scrcpy.stderr!.on('data', (errorOutput) => {
        console.error(`标准错误: ${errorOutput.toString()}`)
      })

      scrcpy.on('close', (code) => {
        console.log(`子进程退出码: ${code}`)
      })

      scrcpy.on('error', (err) => {
        console.error(`子进程启动失败: ${err}`)
      })
    } catch (error) {
      console.error('Failed to find scrcpy:', error)
    }
  }
  ipcMain.on('scrcpy', (_, _ip: string) => {
    console.log('%c🚀 ~ file: index.ts:38 ~ ipcMain.on ~ scrcpy:', 'color:#a8c7fa', ip)
    createScrcpy(_ip)
    ipcMain.once('scrcpy-kill', () => {
      scrcpy.kill()
    })
    win.close()
  })

  const tray = new Tray(nativeImage.createFromPath(icon_22x22))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'start',
      type: 'radio',
      checked: true,
      click: () => {
        createScrcpy(ip)
      }
    },
    {
      label: 'close',
      type: 'radio',
      click: () => {
        scrcpy.kill()
      }
    },
    {
      label: 'Exit',
      click: () => {
        scrcpy.kill()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip(`${app.getName()}`)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
