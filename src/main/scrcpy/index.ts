import { spawn, exec } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { ipcMain, Notification } from 'electron'
import { updateTray } from '../tray'
import { appStore } from '../store/appStore'
import { platform } from '@electron-toolkit/utils'
import useLazyData from 'use-lazy-data'

const Noti = useLazyData({
  error() {
    return new Notification({
      title: 'Scrcpy 启动失败',
      silent: true
    })
  },
  close() {
    return new Notification({
      title: 'Scrcpy 已退出',
      silent: true
    })
  }
})
let isNoti = !appStore.get('closeNotification') && platform.isMacOS
platform.isMacOS && appStore.onDidChange('closeNotification', (v) => { isNoti = !v })

class Scrcpy extends EventEmitter<{
  scrcpyMessage: [{ type: 'stdout' | 'stderr' | 'close' | 'error', data: string }]
}> {
  scrcpy: ReturnType<typeof spawn> | null = null
  scrcpyPath = 'scrcpy'

  constructor() {
    super()
    platform.isWindows
      ? import('../../../resources/scrcpy-win64-v2.6.1/scrcpy.exe?asset&asarUnpack').then(res => {
        this.scrcpyPath = res.default
        exec(`${this.scrcpyPath.replace('scrcpy.exe', 'adb.exe')} start-server`)
      })
      : exec('adb start-server')
  }

  start(options: string[] = []) {
    if (this.scrcpy) this.stop()

    this.scrcpy = spawn(this.scrcpyPath, options) // 在这里可以添加任何 scrcpy 的选项
    appStore.set('isStartScrcpy', true)
    console.log('🚀 ~ file: index.ts:57 ~ app.on ~ scrcpy:', 'scrcpy 已启动')

    this.scrcpy.stdout!.on('data', (output) => {
      console.log(`标准输出: ${output.toString()}`)
      this.emit('scrcpyMessage', { type: 'stdout', data: output.toString() })
    })

    this.scrcpy.stderr!.on('data', (errorOutput) => {
      console.error(`标准错误: ${errorOutput.toString()}`)
      this.emit('scrcpyMessage', { type: 'stderr', data: errorOutput.toString() })
      isNoti && new Notification({
        title: 'Scrcpy 错误提示',
        body: errorOutput.toString(),
        silent: true
      }).show()
    })

    this.scrcpy.on('close', (code) => {
      console.log(`子进程退出码: ${code}`)
      this.close()
      this.emit('scrcpyMessage', { type: 'close', data: 'scrcpy 已关闭' })
      isNoti && Noti.close.show()
    })

    this.scrcpy.on('error', (err) => {
      console.error(`子进程启动失败: ${err}`)
      this.close()
      this.emit('scrcpyMessage', { type: 'error', data: 'scrcpy 启动失败' })
      isNoti && Noti.error.show()
    })
  }
  stop() {
    if (this.scrcpy) {
      this.scrcpy.kill()
      this.scrcpy = null
    }
  }
  close() {
    this.scrcpy = null
    updateTray({ id: 'close', checked: true })
    appStore.set('isStartScrcpy', false)
  }
}

const scrcpyInstance = new Scrcpy()

ipcMain.on('scrcpy', (_, ip: string, options: string[] = appStore.get('scrcpyOptions')) => {
  if (ip) {
    scrcpyInstance.start(['--tcpip=' + ip, ...options])
    updateTray({ label: ip, checked: true })
  } else {
    scrcpyInstance.start(['--select-usb', ...options])
    updateTray({ id: 'usb', label: 'USB', checked: true })
  }
  updateTray({ id: 'close', checked: false })
  // !win?.isDestroyed() && win?.close()
})

ipcMain.on('scrcpy-kill', () => {
  scrcpyInstance.stop()
})

export default scrcpyInstance
