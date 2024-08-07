import { spawn } from 'node:child_process'
import EventEmitter from 'node:stream'

export const defaultScrcpyOptions = [
  '--no-audio',
  '--keyboard=uhid',
  '--turn-screen-off',
  '--power-off-on-close'
]

const Scrcpy = {
  scrcpy: null as ReturnType<typeof spawn> | null,
  event: new EventEmitter(),
  start(options: string[] = []) {
    if (this.scrcpy) this.stop()

    this.scrcpy = spawn('scrcpy', defaultScrcpyOptions.concat(options)) // 在这里可以添加任何 scrcpy 的选项
    console.log('🚀 ~ file: index.ts:57 ~ app.on ~ scrcpy:', 'scrcpy 已启动')

    this.scrcpy.stdout!.on('data', (output) => {
      console.log(`标准输出: ${output.toString()}`)
      this.event.emit('message', { type: 'stdout', data: output.toString() })
    })

    this.scrcpy.stderr!.on('data', (errorOutput) => {
      console.error(`标准错误: ${errorOutput.toString()}`)
      this.event.emit('message', { type: 'stderr', data: errorOutput.toString() })
    })

    this.scrcpy.on('close', (code) => {
      console.log(`子进程退出码: ${code}`)
      this.scrcpy = null
      this.event.emit('kill')
      this.event.emit('message', { type: 'close', data: 'scrcpy 已关闭' })
    })

    this.scrcpy.on('error', (err) => {
      console.error(`子进程启动失败: ${err}`)
      this.scrcpy = null
      this.event.emit('kill')
      this.event.emit('message', { type: 'error', data: 'scrcpy 启动失败' })
    })
  },
  stop() {
    if (this.scrcpy) {
      this.scrcpy.kill()
      this.scrcpy = null
      this.event.emit('kill')
    }
  }
}

export default Scrcpy
