<div align="center">
	<img width="100" height="100" src="./static/icon.svg" alt="Scrcpy UI">
	<br>
	<h1>Scrcpy UI</h1>
	<p>GUI application for scrcpy</p>
  <br>
  <div style="display:flex;justify-content: center;">
    <img width="400" height="600" src="./static/dashboard.png" alt="dashboard">
    <img width="400" height="600" src="./static/log.png" alt="log">
    <img width="135" height="250" src="./static/tray.png" alt="tray">
  </div>
</div>

## quick start
<div align="center">
  <img width="155" height="40" src="./static/add-ip.png" alt="add-ip">
  <img width="350" height="115" src="./static/ip-box.png" alt="ip-box">
</div>

## [scrcpy](https://github.com/Genymobile/scrcpy)
- This application mirrors Android devices (video and audio) connected via USB or over [TCP/IP](https://github.com/Genymobile/scrcpy/blob/master/doc/connection.md#tcpip-wireless), and allows to control the device with the keyboard and the mouse of the computer. It does not require any root access. It works on Linux, Windows and macOS.
- 此应用程序通过 USB 或基于 [TCP/IP](https://github.com/Genymobile/scrcpy/blob/master/doc/connection.md#tcpip-wireless)连接镜像 Android 设备（视频和音频），并允许使用计算机的键盘和鼠标控制设备。它不需要任何root权限。该应用支持Linux、Windows和macOS系统。

## Requirements
- Mac install [scrcpy](https://github.com/Genymobile/scrcpy/blob/master/doc/macos.md) and adb （mac需要先安装scrcpy和adb）
```bash
brew install scrcpy
```
```bash
brew install android-platform-tools
```

- Windows out-of-the-box with built-in scrcpy （windows可以直接使用）

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
