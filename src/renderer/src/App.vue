<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1e1e20]">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-[200px] justify-between"
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
      <Button
        variant="secondary"
        @click="onScrcpy(ip)"
      >
        Scrcpy Start
      </Button>

      <Button
        variant="destructive"
        @click="onScrcpyKill"
      >
        Scrcpy Kill
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-icons/vue'
import { cn } from '@renderer/utils/lib/utils'

const open = ref(false)
const ips = reactive<string[]>([])
const ip = ref('')

onMounted(() => {
  try {
    const _ips = localStorage.getItem('ips')
    console.log('%c🚀 ~ file: App.vue:102 ~ onMounted ~ _ips:', 'color:#a8c7fa', _ips)
    if (!_ips) return

    const parsedIps = JSON.parse(_ips) as string[]
    parsedIps.some(v => typeof v !== 'string')
      ? localStorage.removeItem('ips')
      : ips.push(...JSON.parse(_ips))
  } catch (err) {
    console.error('🚀 ~ file: App.vue:107 ~ onMounted ~ err:', err)
  }
})

const saveIps = () => {
  const _ips = ips.filter(Boolean)
  localStorage.setItem('ips', JSON.stringify(_ips))
  window.electron.ipcRenderer.send('setStoreIps', _ips)
}

const onScrcpy = (ip: string) => {
  console.log('%c🚀 ~ file: App.vue:92 ~ onScrcpy ~ ip:', 'color:#a8c7fa', ips, ip)
  if (ip && !ips.includes(ip)) {
    ips.push(ip)
    saveIps()
  }
  window.electron.ipcRenderer.send('scrcpy', ip)
}

const onScrcpyKill = () => {
  window.electron.ipcRenderer.send('scrcpy-kill')
}
</script>
