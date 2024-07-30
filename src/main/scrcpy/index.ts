import { spawn } from 'node:child_process'
import { updateTray } from '../tray'
import { appStore } from '../store/appStore'

const defaultScrcpyOptions = [
  '--no-audio',
  '--keyboard=uhid',
  '--turn-screen-off',
  '--power-off-on-close'
]

const Scrcpy = {
  scrcpy: null as ReturnType<typeof spawn> | null,
  start(options: string[] = []) {
    if (this.scrcpy) this.stop()

    ;(appStore as any).get('alwaysTop') && options.push('--always-on-top')

    this.scrcpy = spawn('scrcpy', defaultScrcpyOptions.concat(options)) // 在这里可以添加任何 scrcpy 的选项
    console.log('%c🚀 ~ file: index.ts:57 ~ app.on ~ scrcpy:', 'color:#a8c7fa', 'scrcpy 已启动')

    this.scrcpy.stdout!.on('data', (output) => {
      console.log(`标准输出: ${output.toString()}`)
    })

    this.scrcpy.stderr!.on('data', (errorOutput) => {
      console.error(`标准错误: ${errorOutput.toString()}`)
    })

    this.scrcpy.on('close', (code) => {
      console.log(`子进程退出码: ${code}`)
      this.scrcpy = null
      updateTray({ id: 'close', checked: true })
    })

    this.scrcpy.on('error', (err) => {
      console.error(`子进程启动失败: ${err}`)
      this.scrcpy = null
      updateTray({ id: 'close', checked: true })
    })
  },
  stop() {
    if (this.scrcpy) {
      this.scrcpy.kill()
      this.scrcpy = null
      updateTray({ id: 'close', checked: true })
    }
  }
}

export default Scrcpy
