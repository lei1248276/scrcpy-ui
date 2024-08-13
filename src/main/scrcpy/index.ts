import { spawn } from 'node:child_process'
import EventEmitter from 'node:stream'
import { ipcMain, Notification } from 'electron'
import { updateTray } from '../tray'

const Noti = {
  get error() {
    // @ts-ignore - 懒加载赋值
    return delete this.error && (this.error = new Notification({
      title: 'Scrcpy 启动失败',
      silent: true
    }))
  },
  get close() {
    // @ts-ignore - 懒加载赋值
    return delete this.close && (this.close = new Notification({
      title: 'Scrcpy 已退出',
      silent: true
    }))
  }
}

const Scrcpy = {
  scrcpy: null as ReturnType<typeof spawn> | null,
  event: new EventEmitter(),
  start(options: string[] = []) {
    if (this.scrcpy) this.stop()

    this.scrcpy = spawn('scrcpy', options) // 在这里可以添加任何 scrcpy 的选项
    console.log('🚀 ~ file: index.ts:57 ~ app.on ~ scrcpy:', 'scrcpy 已启动')
    ipcMain.handle('scrcpy-start', () => !!this.scrcpy)

    this.scrcpy.stdout!.on('data', (output) => {
      console.log(`标准输出: ${output.toString()}`)
      this.event.emit('message', { type: 'stdout', data: output.toString() })
    })

    this.scrcpy.stderr!.on('data', (errorOutput) => {
      console.error(`标准错误: ${errorOutput.toString()}`)
      this.event.emit('message', { type: 'stderr', data: errorOutput.toString() })
      new Notification({
        title: 'Scrcpy 错误提示',
        body: errorOutput.toString(),
        silent: true
      }).show()
    })

    this.scrcpy.on('close', (code) => {
      console.log(`子进程退出码: ${code}`)
      this.stop()
      this.event.emit('message', { type: 'close', data: 'scrcpy 已关闭' })
      Noti.close.show()
    })

    this.scrcpy.on('error', (err) => {
      console.error(`子进程启动失败: ${err}`)
      this.stop()
      this.event.emit('message', { type: 'error', data: 'scrcpy 启动失败' })
      Noti.error.show()
    })
  },
  stop() {
    if (this.scrcpy) {
      this.scrcpy.kill()
      this.event.emit('kill')
      this.scrcpy = null
      updateTray({ id: 'close', checked: true })
      ipcMain.removeHandler('scrcpy-start')
    }
  }
}

export default Scrcpy
