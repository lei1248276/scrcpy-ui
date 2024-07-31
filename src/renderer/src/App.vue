<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1e1e20]">
    <Input
      type="text"
      placeholder="添加ip地址"
      class="w-[200px]"
      @keyup.enter="onScrcpy(ip = $event.target.value)"
    />

    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-[200px] justify-between"
        >
          {{ ip
            ? ips.find((v) => v.value === ip)?.label
            : "选择ip地址..." }}
          <CaretSortIcon class="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput
            class="h-9"
            placeholder="搜索ip地址..."
          />
          <CommandEmpty>没有ip地址....</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="(v, i) in ips"
                :key="v.value"
                :value="v.value"
                @select="(ev) => {
                  if (typeof ev.detail.value === 'string') {
                    ip = ev.detail.value
                  }
                  open = false
                }"
              >
                {{ v.label }}
                <CheckIcon
                  :class="cn(
                    'ml-auto h-4 w-4',
                    ip === v.value ? 'opacity-100' : 'opacity-0',
                  )"
                />
                <Cross2Icon
                  class="ml-auto size-4 cursor-pointer"
                  @click.stop="ips.splice(i, 1); saveIps()"
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <Button
      variant="secondary"
      @click="onScrcpy(ip)"
    >
      Scrcpy TCP Start
    </Button>
    <Button
      variant="secondary"
      @click="onScrcpy('')"
    >
      Scrcpy USB Start
    </Button>
    <Button
      variant="destructive"
      @click="onScrcpyKill"
    >
      Scrcpy Kill
    </Button>
  </div>
</template>

<script setup lang="ts">
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-icons/vue'
import { cn } from '@renderer/utils/lib/utils'

type IP = {
  label: string
  value: string
}
const ips = reactive<IP[]>([])

const open = ref(false)
const ip = ref('')

onMounted(() => {
  try {
    const _ips = localStorage.getItem('ips')
    console.log('%c🚀 ~ file: App.vue:102 ~ onMounted ~ _ips:', 'color:#a8c7fa', _ips, ip.value)
    if (_ips) {
      ips.push(...JSON.parse(_ips))
    }
  } catch (err) {
    console.error('🚀 ~ file: App.vue:107 ~ onMounted ~ err:', err)
  }
})

const saveIps = () => {
  localStorage.setItem('ips', JSON.stringify(ips))
  window.electron.ipcRenderer.send('setStoreIps', ips.map((v) => v.value).filter(Boolean))
}

const onScrcpy = (ip: string) => {
  console.log('%c🚀 ~ file: App.vue:92 ~ onScrcpy ~ ip:', 'color:#a8c7fa', ips, ip)
  if (ips.findIndex((v) => v.value === ip) === -1) {
    const res = { label: ip, value: ip }
    ips.push(res)
    saveIps()
  }
  window.electron.ipcRenderer.send('scrcpy', ip)
}

const onScrcpyKill = () => {
  window.electron.ipcRenderer.send('scrcpy-kill')
}
</script>
