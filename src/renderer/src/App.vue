<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f6f7]">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-[200px] justify-between"
          :class="ip ? '' : 'text-gray-500'"
        >
          {{ ip || "USB连接" }}
          <CaretSortIcon class="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput
            class="h-9"
            placeholder="新增/搜索IP地址"
            @keyup.enter="onScrcpy(ip = $event.target.value); open = false"
          />
          <CommandEmpty>没有ip地址....</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="(v, i) in ips"
                :key="v"
                :value="v"
                @select="({ detail: { value }}) => { typeof value === 'string' && (ip = value === ip ? '' : value); open = false }"
              >
                {{ v }}
                <CheckIcon
                  class="ml-auto size-4"
                  :class="ip === v ? 'opacity-100' : 'opacity-0'"
                />
                <Cross2Icon
                  class="ml-auto size-4 cursor-pointer"
                  @click.stop="ips.splice(i, 1); saveIps(ips); ip === v && (ip = '')"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <div class="flex items-center gap-x-2">
      <Button
        :variant="isStartScrcpy ? 'destructive' : 'default'"
        class="transition-colors duration-300"
        @click="isStartScrcpy ? onScrcpyKill() : onScrcpy(ip)"
      >
        {{ isStartScrcpy ? 'Scrcpy Kill' : 'Scrcpy Start' }}
      </Button>
    </div>

    <Carousel class="h-[500px] w-full">
      <CarouselContent>
        <CarouselItem>
          <JTable
            :data="tableData"
            :column-props="column"
            height="500px"
            class="mx-auto w-[90%] rounded-md"
          >
            <template #checked="{ row }">
              <Checkbox
                v-model:checked="row.checked"
                class="size-[18px] align-middle"
              />
            </template>

            <template #value="{ row }">
              <Select
                v-if="row.valueList"
                v-model="row.value"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="v in row.valueList"
                      :key="v"
                      :value="v"
                    >
                      {{ v }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Input
                v-else-if="typeof row.value === 'string'"
                v-model="row.value"
              />
            </template>
          </JTable>
        </CarouselItem>

        <CarouselItem>
          <div
            ref="logRef"
            class="mx-auto flex h-[500px] w-4/5 flex-none flex-col gap-y-2 overflow-y-scroll break-words rounded-md border border-gray-300 bg-[#282828] p-2 [&::-webkit-scrollbar]:hidden"
          >
            <span
              v-for="({ type, data }, i) in messages"
              :key="i"
              :class="type === 'stderr' ? 'text-orange-400' : type === 'error' || type === 'close' ? 'text-red-500' : 'text-[#f6f6f7]'"
            >
              {{ data }}
            </span>
          </div>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import type { ColumnProps } from '@renderer/components/JTable/JTable.vue'
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-icons/vue'

type TableData = {
  type: string
  arg: string
  value?: string
  valueList?: string[]
  desc: string
  checked: boolean
}

type Message = {
  type: 'stdout' | 'stderr' | 'close' | 'error'
  data: string
}

const isStartScrcpy = ref(false)
const open = ref(false)
const ips = reactive<string[]>([])
const ip = ref('')
const messages = ref<Message[]>([])

const logRef = shallowRef<HTMLDivElement | null>(null)

window.electron.ipcRenderer.invoke('getStoreIps').then(_ips => {
  console.log('%c🚀 ~ file: App.vue:74 ~ _ips:', 'color:#a8c7fa', _ips)
  ips.push(..._ips)
  _ips.length && (ip.value = _ips[0])
})

window.electron.ipcRenderer.invoke('getStoreScrcpyOptions').then((_scrcpyOptions: string[]) => {
  console.log('%c🚀 ~ file: App.vue:80 ~ _scrcpyOptions:', 'color:#a8c7fa', _scrcpyOptions)
  _scrcpyOptions.forEach(option => {
    const [arg, value] = option.split('=')
    const row = tableData.find(row => row.arg === arg)
    if (row) {
      value && (row.value = value)
      row.checked = true
    }
  })
})

window.electron.ipcRenderer.invoke('getStoreIsStartScrcpy').then((isStart: boolean) => { isStartScrcpy.value = isStart })
window.electron.ipcRenderer.on('scrcpyMessage', (_, data: Message) => {
  console.log('%c🚀 ~ file: App.vue:82 ~ window.electron.ipcRenderer.on ~ data:', 'color:#a8c7fa', data)
  if (data.type === 'stdout' && !isStartScrcpy.value) isStartScrcpy.value = true
  else if (data.type === 'close' || data.type === 'error') isStartScrcpy.value = false
  messages.value.push(data)
  nextTick(() => {
    logRef.value?.scrollTo(0, logRef.value.scrollHeight)
  })
})

const saveIps = (_ips: string[]) => {
  window.electron.ipcRenderer.send('setStoreIps', _ips.filter(Boolean))
}
const saveScrcpyOptions = (options: string[]) => {
  window.electron.ipcRenderer.send('setStoreScrcpyOptions', options.filter(Boolean))
}

const onScrcpy = (ip: string) => {
  console.log('%c🚀 ~ file: App.vue:92 ~ onScrcpy ~ ip:', 'color:#a8c7fa', ips, ip)

  if (ip && !ips.includes(ip)) {
    ips.unshift(ip)
    saveIps(ips)
  }

  const options = tableData.filter(row => row.checked).map(({ arg, value }) => arg + (value ? '=' + value : ''))
  console.log('%c🚀 ~ file: App.vue:188 ~ onScrcpy ~ options:', 'color:#a8c7fa', options)
  saveScrcpyOptions(options)
  window.electron.ipcRenderer.send('scrcpy', ip, options)
}

const onScrcpyKill = () => {
  window.electron.ipcRenderer.send('scrcpy-kill')
}

const tableData: TableData[] = reactive([
  {
    type: 'Window',
    arg: '--no-window',
    desc: '禁用窗口',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-title',
    value: '',
    desc: '窗口标题',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-borderless',
    desc: '窗口无边框',
    checked: false
  },
  {
    type: 'Window',
    arg: '--always-on-top',
    desc: '窗口置顶',
    checked: false
  },
  {
    type: 'Window',
    arg: '--fullscreen',
    desc: '窗口全屏',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-width',
    value: '',
    desc: '窗口宽度',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-height',
    value: '',
    desc: '窗口高度',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-x',
    value: '',
    desc: '窗口位置X',
    checked: false
  },
  {
    type: 'Window',
    arg: '--window-y',
    value: '',
    desc: '窗口位置Y',
    checked: false
  },
  {
    type: 'Window',
    arg: '--disable-screensaver',
    desc: '禁用"PC的"屏幕保护程序',
    checked: false
  },
  {
    type: 'Video',
    arg: '--max-size',
    value: '',
    desc: '设备分辨率（默认为设备分辨率）',
    checked: false
  },
  {
    type: 'Video',
    arg: '--video-bit-rate',
    value: '8M',
    desc: '视频比特率',
    checked: false
  },
  {
    type: 'Video',
    arg: '--max-fps',
    value: '',
    desc: '帧率',
    checked: false
  },
  {
    type: 'Video',
    arg: '--video-codec',
    value: 'h264',
    valueList: ['h264', 'h265', 'av1'],
    desc: '视频编解码器',
    checked: false
  },
  {
    type: 'Video',
    arg: '--display-buffer',
    value: '',
    desc: '视频缓冲（添加会增加延迟播放会流畅）',
    checked: false
  },
  {
    type: 'Video',
    arg: '--no-video',
    desc: '禁用视频',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--no-audio',
    desc: '禁用音频',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--audio-source',
    value: 'mic',
    desc: '捕获麦克风',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--audio-codec',
    value: 'opus',
    valueList: ['opus', 'aac', 'flac', 'raw'],
    desc: '音频编解码器',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--audio-encoder',
    value: '',
    desc: '编码器',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--audio-bit-rate',
    value: '',
    desc: '音频比特率',
    checked: false
  },
  {
    type: 'Audio',
    arg: '--audio-buffer',
    value: '50',
    desc: '音频缓冲',
    checked: false
  },
  {
    type: 'Camera',
    arg: '--video-source',
    value: 'camera',
    desc: '捕获摄像头而不是设备屏幕',
    checked: false
  },
  {
    type: 'Camera',
    arg: '--camera-facing',
    value: 'front',
    valueList: ['front', 'back', 'external'],
    desc: '选择摄像头',
    checked: false
  },
  {
    type: 'Camera',
    arg: '--camera-size',
    value: '1920x1080',
    desc: '相机尺寸',
    checked: false
  },
  {
    type: 'Camera',
    arg: '--orientation',
    value: '90',
    desc: '旋转',
    checked: false
  },
  {
    type: 'Camera',
    arg: '--camera-fps',
    value: '30',
    desc: '相机帧率',
    checked: false
  },
  {
    type: 'Control',
    arg: '--no-control',
    desc: '禁用控制（输入、点击、拖放文件）',
    checked: false
  },
  {
    type: 'Control',
    arg: '--no-video --no-audio',
    desc: '仅控制',
    checked: false
  },
  {
    type: 'Device',
    arg: '--stay-awake',
    desc: '保持设备唤醒',
    checked: false
  },
  {
    type: 'Device',
    arg: '--turn-screen-off',
    desc: '启动时关闭屏幕',
    checked: false
  },
  {
    type: 'Device',
    arg: '--show-touches',
    desc: '显示触控点',
    checked: false
  },
  {
    type: 'Device',
    arg: '--power-off-on-close',
    desc: '关闭scrcpy时关闭设备屏幕',
    checked: false
  },
  {
    type: 'Keyboard',
    arg: '--keyboard',
    value: 'sdk',
    valueList: ['sdk', 'uhid', 'aoa'],
    desc: '键盘输入模式',
    checked: false
  },
  {
    type: 'Keyboard',
    arg: '--no-key-repeat',
    desc: '禁用按键重复',
    checked: false
  },
  {
    type: 'Mouse',
    arg: '--mouse',
    value: 'sdk',
    valueList: ['sdk', 'uhid', 'aoa'],
    desc: '鼠标输入模式',
    checked: false
  },
  {
    type: 'Mouse',
    arg: '--no-mouse-hover',
    desc: '禁止鼠标移动事件转发到设备',
    checked: false
  }
])
const column: ColumnProps[] = [
  {
    prop: 'checked',
    label: 'use',
    minWidth: 70,
    align: 'center',
    sortable: true,
    sortOrders: ['descending', null]
  },
  {
    prop: 'type',
    label: 'type',
    minWidth: 70,
    align: 'center',
    filters: tableData.reduce((acc, row) => {
      row.type !== acc.at(-1)?.value && acc.push({ text: row.type, value: row.type })
      return acc
    }, [] as { text: string; value: string }[]),
    filterMethod: (value, row) => row.type === value
  },
  {
    prop: 'arg',
    label: 'arg',
    align: 'center'
  },
  {
    prop: 'value',
    label: 'value',
    align: 'center'
  },
  {
    prop: 'desc',
    label: 'description',
    minWidth: 100,
    align: 'center'
  }
]
</script>
