<div align="center">
	<img width="100" height="100" src="./resources/icon.svg" alt="Scrcpy UI">
	<br>
	<h1>Scrcpy UI</h1>
  <br>
  <img width="550" height="800" src="./resources/dashboard.png" alt="dashboard">
  <img width="80" height="120" src="./resources/tray.png" alt="dashboard">
</div>

## Use

- Electron 、 TypeScript 、 ESLint 、 Vue3 、 Tailwind CSS 、 shadcn-vue 、 scrcpy 、 adb

## Requirements
- Install [Scrcpy](https://github.com/Genymobile/scrcpy)
- This application mirrors Android devices (video and audio) connected via USB or over [TCP/IP](https://github.com/Genymobile/scrcpy/blob/master/doc/connection.md#tcpip-wireless), and allows to control the device with the keyboard and the mouse of the computer. It does not require any root access. It works on Linux, Windows and macOS.
- 此应用程序通过 USB 或基于 [TCP/IP](https://github.com/Genymobile/scrcpy/blob/master/doc/connection.md#tcpip-wireless)连接镜像 Android 设备（视频和音频），并允许使用计算机的键盘和鼠标控制设备。它不需要任何root权限。该应用支持Linux、Windows和macOS系统。

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
