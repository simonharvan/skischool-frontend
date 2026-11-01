<script setup lang="ts">
/**
 * Generic one-day timeline: rows (e.g. instructors) × time. Items can be dragged to another time
 * or row, resized from both edges, clicked, and empty cells can be drag-selected.
 * All times are minutes since midnight; the parent owns the data and applies changes.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  CELL_MINUTES,
  cellIndex,
  deltaPxToMinutes,
  hasCollision,
  isClick,
  minutesToFraction,
  moveRange,
  pxToMinutes,
  resizeRange,
  selectionToRange,
  type Range,
} from './geometry'

export interface TimelineRow {
  id: number
  label: string
}

export interface TimelineEntry {
  id: number
  rowId: number
  start: number
  end: number
  label: string
  cls?: string[]
  title?: string
}

export interface TimelineSelection extends Range {
  rowId: number
}

export interface TimelineChange {
  id: number
  rowId: number
  start: number
  end: number
}

const props = withDefaults(
  defineProps<{
    rows: TimelineRow[]
    items: TimelineEntry[]
    dayStart?: number
    dayEnd?: number
    selection?: TimelineSelection | null
    rowHeader?: string
    labelWidth?: number
    minTrackWidth?: number
  }>(),
  { dayStart: 8 * 60 + 30, dayEnd: 16 * 60, selection: null, rowHeader: '', labelWidth: 200, minTrackWidth: 760 },
)

const emit = defineEmits<{
  'update:selection': [value: TimelineSelection | null]
  change: [change: TimelineChange]
  'item-click': [id: number]
  create: [selection: TimelineSelection]
}>()

type DragKind = 'move' | 'resize-start' | 'resize-end'
interface DragState {
  kind: DragKind
  id: number
  origin: TimelineEntry
  downX: number
  downY: number
  trackLeft: number
  trackWidth: number
  moved: boolean
  rowId: number
  start: number
  end: number
  valid: boolean
}
interface SelectState {
  rowId: number
  anchor: number
  trackLeft: number
  trackWidth: number
  downX: number
  downY: number
}

const drag = ref<DragState | null>(null)
const select = ref<SelectState | null>(null)
const trackRefs = new Map<number, HTMLElement>()

const setTrack = (rowId: number, el: unknown) => {
  if (el instanceof HTMLElement) trackRefs.set(rowId, el)
  else trackRefs.delete(rowId)
}

const total = computed(() => props.dayEnd - props.dayStart)
const pct = (minutes: number) => `${minutesToFraction(minutes, props.dayStart, props.dayEnd) * 100}%`

/** Items as displayed – the dragged one follows the pointer. */
const displayed = computed<(TimelineEntry & { dragging: boolean; invalid: boolean })[]>(() =>
  props.items.map((item) => {
    const d = drag.value
    if (d && d.id === item.id && d.moved) {
      return { ...item, rowId: d.rowId, start: d.start, end: d.end, dragging: true, invalid: !d.valid }
    }
    return { ...item, dragging: false, invalid: false }
  }),
)

const itemsByRow = computed(() => {
  const map = new Map<number, typeof displayed.value>()
  for (const row of props.rows) map.set(row.id, [])
  for (const item of displayed.value) map.get(item.rowId)?.push(item)
  return map
})

const hourMarks = computed(() => {
  const marks: { minutes: number; label: string }[] = [{ minutes: props.dayStart, label: fmt(props.dayStart) }]
  for (let m = Math.ceil(props.dayStart / 60) * 60; m <= props.dayEnd; m += 60) {
    if (m !== props.dayStart) marks.push({ minutes: m, label: fmt(m) })
  }
  return marks
})
const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

const cells = computed(() => Math.round(total.value / CELL_MINUTES))
const gridStyle = computed(() => ({
  backgroundImage:
    'repeating-linear-gradient(to right, #ebeef5 0, #ebeef5 1px, transparent 1px, transparent calc(100% / ' +
    cells.value +
    '))',
}))

const toItems = (rowId: number, ignore?: number): Range[] =>
  props.items.filter((i) => i.rowId === rowId && i.id !== ignore)

function rowAtY(clientY: number, fallback: number): number {
  let nearest = fallback
  let best = Infinity
  for (const row of props.rows) {
    const el = trackRefs.get(row.id)
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (clientY >= r.top && clientY <= r.bottom) return row.id
    const dist = Math.min(Math.abs(clientY - r.top), Math.abs(clientY - r.bottom))
    if (dist < best) {
      best = dist
      nearest = row.id
    }
  }
  return nearest
}

function listen() {
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onCancel)
}
onBeforeUnmount(unlisten)

function onItemDown(e: PointerEvent, item: TimelineEntry, kind: DragKind) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  e.stopPropagation()
  const track = trackRefs.get(item.rowId)
  if (!track) return
  const r = track.getBoundingClientRect()
  drag.value = {
    kind,
    id: item.id,
    origin: item,
    downX: e.clientX,
    downY: e.clientY,
    trackLeft: r.left,
    trackWidth: r.width,
    moved: false,
    rowId: item.rowId,
    start: item.start,
    end: item.end,
    valid: true,
  }
  listen()
}

function onTrackDown(e: PointerEvent, rowId: number) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  const track = trackRefs.get(rowId)
  if (!track) return
  const r = track.getBoundingClientRect()
  const minutes = pxToMinutes(e.clientX - r.left, r.width, props.dayStart, props.dayEnd)
  const anchor = cellIndex(minutes, props.dayStart)
  const range = selectionToRange(anchor, anchor, toItems(rowId), props.dayStart, props.dayEnd)
  if (!range) return
  select.value = { rowId, anchor, trackLeft: r.left, trackWidth: r.width, downX: e.clientX, downY: e.clientY }
  emit('update:selection', { rowId, ...range })
  listen()
}

function onMove(e: PointerEvent) {
  const d = drag.value
  if (d) {
    if (!d.moved && isClick({ x: d.downX, y: d.downY }, { x: e.clientX, y: e.clientY })) return
    d.moved = true
    const delta = deltaPxToMinutes(e.clientX - d.downX, d.trackWidth, props.dayStart, props.dayEnd)
    let range: Range
    let rowId = d.origin.rowId
    if (d.kind === 'move') {
      range = moveRange(d.origin, delta, props.dayStart, props.dayEnd)
      rowId = rowAtY(e.clientY, d.rowId)
    } else {
      range = resizeRange(d.origin, d.kind === 'resize-start' ? 'start' : 'end', delta, props.dayStart, props.dayEnd)
    }
    d.rowId = rowId
    d.start = range.start
    d.end = range.end
    d.valid = !hasCollision(props.items, { rowId, ...range }, d.id)
    return
  }
  const s = select.value
  if (s) {
    const minutes = pxToMinutes(e.clientX - s.trackLeft, s.trackWidth, props.dayStart, props.dayEnd)
    const current = Math.min(Math.max(cellIndex(minutes, props.dayStart), 0), cells.value - 1)
    const range = selectionToRange(s.anchor, current, toItems(s.rowId), props.dayStart, props.dayEnd)
    if (range) emit('update:selection', { rowId: s.rowId, ...range })
  }
}

function onUp() {
  const d = drag.value
  drag.value = null
  select.value = null
  unlisten()
  if (!d) return
  if (!d.moved) {
    emit('item-click', d.id)
    return
  }
  const changed =
    d.rowId !== d.origin.rowId || d.start !== d.origin.start || d.end !== d.origin.end
  // an invalid (colliding) drop just snaps back
  if (changed && d.valid) emit('change', { id: d.id, rowId: d.rowId, start: d.start, end: d.end })
}

function onCancel() {
  drag.value = null
  select.value = null
  unlisten()
}

function onTrackDblClick(rowId: number) {
  const s = props.selection
  if (s && s.rowId === rowId) emit('create', s)
}

const selectionRow = (rowId: number) => (props.selection?.rowId === rowId ? props.selection : null)
</script>

<template>
  <div class="dt">
    <div class="dt-scroll">
      <div class="dt-inner" :style="{ minWidth: `${labelWidth + minTrackWidth}px` }">
        <div class="dt-row dt-head">
          <div class="dt-label" :style="{ width: `${labelWidth}px` }">{{ rowHeader }}</div>
          <div class="dt-track dt-hours">
            <span
              v-for="m in hourMarks"
              :key="m.minutes"
              class="dt-hour"
              :style="{ left: pct(m.minutes) }"
              >{{ m.label }}</span
            >
          </div>
        </div>

        <div v-for="row in rows" :key="row.id" class="dt-row">
          <div class="dt-label" :style="{ width: `${labelWidth}px` }" :title="row.label">{{ row.label }}</div>
          <div
            :ref="(el) => setTrack(row.id, el)"
            class="dt-track"
            :style="gridStyle"
            @pointerdown="onTrackDown($event, row.id)"
            @dblclick="onTrackDblClick(row.id)"
          >
            <div
              v-if="selectionRow(row.id)"
              class="dt-selection"
              :style="{
                left: pct(selectionRow(row.id)!.start),
                width: `${(selectionRow(row.id)!.end - selectionRow(row.id)!.start) / total * 100}%`,
              }"
            />
            <div
              v-for="item in itemsByRow.get(row.id)"
              :key="item.id"
              class="dt-item"
              :class="[
                ...(item.cls ?? []),
                { 'is-dragging': item.dragging, 'is-invalid': item.invalid },
              ]"
              :style="{ left: pct(item.start), width: `${(item.end - item.start) / total * 100}%` }"
              :title="item.title ?? item.label"
              @pointerdown="onItemDown($event, item, 'move')"
            >
              <span class="dt-handle dt-handle-start" @pointerdown="onItemDown($event, item, 'resize-start')" />
              <span class="dt-item-label">{{ item.label }}</span>
              <span class="dt-handle dt-handle-end" @pointerdown="onItemDown($event, item, 'resize-end')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dt {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  user-select: none;
  -webkit-user-select: none;
}
.dt-scroll {
  overflow-x: auto;
}
.dt-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}
.dt-row:last-child {
  border-bottom: none;
}
.dt-head {
  background: #fafafa;
}
.dt-label {
  position: sticky;
  left: 0;
  z-index: 3;
  flex: none;
  box-sizing: border-box;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: #fff;
  border-right: 1px solid #ebeef5;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.dt-head .dt-label {
  background: #fafafa;
  font-weight: 600;
  color: #909399;
}
.dt-track {
  position: relative;
  flex: 1;
  height: 52px;
}
.dt-hours {
  height: 32px;
}
.dt-hour {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  font-size: 12px;
  color: #909399;
}
.dt-hour:first-child {
  transform: translateX(2px);
}
.dt-selection {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(24, 144, 255, 0.18);
  border: 1px dashed #1890ff;
  box-sizing: border-box;
  pointer-events: none;
}
.dt-item {
  position: absolute;
  top: 5px;
  bottom: 5px;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  background: #158abe;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.dt-item.is-dragging {
  z-index: 2;
  opacity: 0.85;
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.dt-item.is-invalid {
  outline: 2px solid #f56c6c;
  opacity: 0.6;
}
.dt-item-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
}
.dt-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: ew-resize;
  touch-action: none;
}
.dt-handle-start {
  left: 0;
}
.dt-handle-end {
  right: 0;
}
</style>
