<template>
  <div class="j-table">
    <ElTable
      ref="tableRef"
      v-bind="{...$props, ...$attrs, columnProps: '', total: '', page: '', limit: '', showPagination: '', paginationClassName: ''}"
    >
      <template
        v-for="column in props.columnProps"
        :key="column.label"
      >
        <!-- * 添加slot来改写某一列的内容 -->
        <ElTableColumn
          v-if="$slots[column['prop']!]"
          v-bind="column"
        >
          <template #default="slot: { row: any, column: any, $index: number}">
            <slot
              :name="column.prop!"
              v-bind="slot"
            >
              {{ slot.row[column['prop']!] }}
            </slot>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-else
          v-bind="column"
        />
      </template>

      <slot />
    </ElTable>

    <slot
      v-if="props.showPagination"
      name="pagination"
    >
      <ElPagination
        v-model:current-page="pager.currentPage"
        v-model:page-size="pager.pageSize"
        :total="total"
        :pager-count="5"
        layout="total, prev, pager, next"
        class="justify-end"
        :class="[paginationClassName]"
        @size-change="emit('pagination', { page: pager.currentPage, limit: $event })"
        @current-change="emit('pagination', { page: $event, limit: pager.pageSize })"
      />
    </slot>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import type { TableInstance, TableColumnInstance, TableProps as ElTableProps } from 'element-plus'

export type ColumnProps = TableColumnInstance['$props']
export type JTableInstance = { tableRef: TableInstance }

type TableProps = ElTableProps<T> & {
  data: T[]
  columnProps: ColumnProps[]
  total?: number
  page?: number
  limit?: number
  showPagination?: boolean
  paginationClassName?: string
}

defineOptions({
  name: 'JTable'
})

defineSlots<{
  // eslint-disable-next-line
  [P in (keyof T | 'default' | 'pagination')]:
    | ((arg: {[key: string]: any, row: T, column: ColumnProps, $index: number}) => void)
    | {}
}>()

const props = withDefaults(defineProps<TableProps>(), {
  total: 0,
  page: 1,
  limit: 10,
  showPagination: false,
  paginationClassName: '',
  stripe: false,
  border: false,
  highlightCurrentRow: true,
  showHeader: true,
  fit: true,
  size: 'large'
})

const emit = defineEmits<{
  (e: Parameters<TableInstance['$emit']>[0], ...arg: any[]): void
  (e: 'update:page', val: number): void
  (e: 'update:limit', val: number): void
  (e: 'pagination', options: { page: number, limit: number}): void
}>()

const pager = reactive({
  currentPage: computed({
    get() { return props.page },
    set(val) { emit('update:page', val) }
  }),
  pageSize: computed({
    get() { return props.limit },
    set(val) { emit('update:limit', val) }
  })
})

const tableRef = shallowRef<TableInstance>()
defineExpose({ tableRef })
</script>
