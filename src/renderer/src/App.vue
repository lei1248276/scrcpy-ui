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
                  :class="cn(
                    'ml-auto h-4 w-4',
                    ip === v ? 'opacity-100' : 'opacity-0',
                  )"
                />
                <Cross2Icon
                  class="ml-auto size-4 cursor-pointer"
                  @click.stop="ips.splice(i, 1); saveIps(); ip === v && (ip = '')"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <div class="flex items-center gap-x-2">
      <Button @click="onScrcpy(ip)">
        Scrcpy Start
      </Button>

      <Button
        variant="destructive"
        @click="onScrcpyKill"
      >
        Scrcpy Kill
      </Button>
    </div>

    <div
      ref="logRef"
      class="flex h-[50vh] w-2/3 flex-none flex-col gap-y-2 overflow-y-scroll break-words"
    >
      <span
        v-for="({ type, data }, i) in messages"
        :key="i"
        :class="type === 'stderr' ? 'text-orange-400' : type === 'error' || type === 'close' ? 'text-red-500' : ''"
      >
        {{ data }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-icons/vue'
import { cn } from '@renderer/utils/lib/utils'

type Message = {
  type: 'stdout' | 'stderr' | 'close' | 'error'
  data: string
}

const open = ref(false)
const ips = reactive<string[]>([])
const ip = ref('')
const messages = ref<Message[]>([])

const logRef = shallowRef<HTMLDivElement | null>(null)

window.electron.ipcRenderer.invoke('getStoreIps').then(_ips => {
  console.log('%c🚀 ~ file: App.vue:74 ~ onMounted ~ _ips:', 'color:#a8c7fa', _ips)
  ips.push(..._ips)
})

window.electron.ipcRenderer.on('scrcpyMessage', (_, data) => {
  console.log('%c🚀 ~ file: App.vue:82 ~ window.electron.ipcRenderer.on ~ data:', 'color:#a8c7fa', data)
  messages.value.push(data)
  nextTick(() => {
    logRef.value?.scrollTo(0, logRef.value.scrollHeight)
  })
})

const saveIps = () => {
  window.electron.ipcRenderer.send('setStoreIps', ips.filter(Boolean))
}

const onScrcpy = (ip: string) => {
  console.log('%c🚀 ~ file: App.vue:92 ~ onScrcpy ~ ip:', 'color:#a8c7fa', ips, ip)
  if (ip && !ips.includes(ip)) {
    ips.unshift(ip)
    saveIps()
  }
  window.electron.ipcRenderer.send('scrcpy', ip)
}

const onScrcpyKill = () => {
  window.electron.ipcRenderer.send('scrcpy-kill')
}
</script>
