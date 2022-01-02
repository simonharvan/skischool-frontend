<template>
  <div class="lessons-container">
    <el-row class="controls">

      <el-button-group>
        <el-button
          type="primary"
          icon="el-icon-arrow-left"
          @click.native="handleYesterday"
        >
          {{ $t('lessons.yesterday') }}
        </el-button>
        <el-button
          type="primary"
          @click.native="handleToday"
        >
          {{ $t('lessons.today') }}
        </el-button>
        <el-button
          type="primary"
          @click.native="handleTommorow"
        >
          {{ $t('lessons.tomorrow') }} <i class="el-icon-arrow-right"/>
        </el-button>
      </el-button-group>

      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="Pick a day"
        format="d.M.yyyy">
      </el-date-picker>


      <el-button
        type="success"
        icon="el-icon-plus"
        @click.native="handleNewLesson">
        Nová hodina
      </el-button>

      <el-button
        icon="el-icon-refresh"
        @click.native="handleRefresh"/>

    </el-row>
    <gantt-scheduler
      ref="scheduler"
      :config="config"
      @state="handleOnState"
    />
    <lesson-edit
      :lesson="editLesson"
      :changeValue="changeValue"
      @saved="handleSaved"
      @pay="handlePreparePay"
      @deleted="handleDeleted"/>
    <lesson-pay
      :lesson="payLesson"
      @paid="handlePaid"
      @discard="handleDiscardPay"/>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator'
import GanttScheduler from 'vue-gantt-schedule-timeline-calendar'
import {LessonsModule} from '@/store/modules/lessons'
import {IInstructor, ILesson} from '@/api/types'
import {InstructorsModule} from '@/store/modules/instructor'
import {ResizingItemClass} from '@/views/lessons/helpers/ResizingItemClass'
import {AddItemStyleClass} from '@/views/lessons/helpers/AddItemStyleClass'
import {formatDateTimeToBackend, formatDateTimeToBackendWithOffset, formatDateToBackend} from '@/utils'
import {Message} from 'element-ui'
import {ItemClickActionClass, setListener} from '@/views/lessons/helpers/ItemClickActionClass'
import {plugins} from '@/views/lessons/helpers/Plugins'
//@ts-ignore
import LessonEdit from '@/components/LessonEdit/index'
//@ts-ignore
import LessonPay from '@/components/LessonPay/index'
import {AppModule} from "@/store/modules/app";

import _ from 'lodash'

@Component({
  name: 'Lessons',
  components: {
    GanttScheduler,
    LessonEdit,
    LessonPay
  }
})

export default class extends Vue {
  private currentRole = 'admin-dashboard'
  private subs: any[] = []
  private state: any | undefined;

  private lessons: ILesson[] = [];
  private instructors: IInstructor[] = [];

  private editLesson: ILesson = {} as ILesson
  private changeValue: boolean = false

  private payLesson: ILesson | null = null

  private timeoutID: any
  private updatedJustNow: boolean = false;

  private handleOnState(state: any) {
    this.state = state
    console.log('handleOnState()', state)
    this.subs.push(
      state.subscribe('config.chart.items.:id', _.debounce(this.handleGanttEvent, 300))
    )
    setListener(_.debounce(this.handleGanttEvent, 600))
  }

  get language() {
    return AppModule.language
  }

  get selectedDate() {
    return LessonsModule.selectedDate
  }

  set selectedDate(date: Date) {
    date.setHours(8)
    console.log('select date', date)
    LessonsModule.SetSelectedDate(date)
  }

  get startOfSelectedDate() {
    const result = new Date(this.selectedDate.getTime())
    result.setHours(8)
    result.setMinutes(30)
    result.setSeconds(0)
    return result
  }

  get endOfSelectedDate() {
    const result = new Date(this.selectedDate.getTime())
    result.setHours(16)
    result.setMinutes(0)
    result.setSeconds(0)
    return result
  }

  get config() {
    let result: any = {
      height: 650,
      utcMode: false,
      plugins: plugins,
      list: {
        toggle: {
          display: false
        },
        columns: {
          data: {
            label: {
              id: 'label',
              data: 'label',
              width: 200,
              header: {
                content: this.$t('lessons.instructor')
              }
            }
          }
        },
        rows: {}
      },
      chart: {
        items: {}
      },
      actions: {
        'chart-timeline-items-row-item': [ResizingItemClass, AddItemStyleClass, ItemClickActionClass]
      },
      locale: {
        name: this.language,
        weekdays: this.$t('lessons.weekdays'),
        weekdaysShort: this.$t('lessons.weekdaysShort'),
        weekdaysMin: this.$t('lessons.weekdaysMin'),
        months: this.$t('lessons.months'),
        monthsShort: this.$t('lessons.monthsShort'),
        weekStart: 1,
      }
    }
    this.instructors.forEach((instructor: IInstructor) => {
      result.list.rows[instructor.id] = {
        id: instructor.id,
        label: instructor.name
      }
    })

    if (this.lessons.length > 0) {
      this.lessons.forEach((lesson: ILesson) => {
        if (lesson.instructor && lesson.client) {
          let name = lesson.name
          if (lesson.client.phone) {
            name += ' (' + lesson.client.phone + ')'
          }

          result.chart.items[lesson.id] = {
            id: lesson.id,
            rowId: lesson.instructor.id,
            label: name,
            data: lesson,
            time: {
              start: new Date(lesson.from).getTime(),
              end: new Date(lesson.to).getTime()
            }
          }
        }
      })
    } else {
      // GSTC timeline is not working withou items
      result.chart.items['0'] = {
        id: 0,
        rowId: 0,
        label: '1',
        time: {
          start: this.startOfSelectedDate.getTime(),
          end: this.startOfSelectedDate.getTime()
        }
      }
    }


    result.chart.time = {
      from: this.startOfSelectedDate.getTime(),
      to: this.endOfSelectedDate.getTime(),
      zoom: 15.2,
      period: 'hour'
    }
    console.log('Config', result)
    return result
  }

  mounted() {
    this.fetchData()
  }

  beforeDestroy() {
    this.subs.forEach(unsub => unsub())
  }

  private handleYesterday() {
    const date = new Date(this.selectedDate)
    date.setDate(this.selectedDate.getDate() - 1)
    LessonsModule.SetSelectedDate(date)
  }

  private handleTommorow() {
    const date = new Date(this.selectedDate)
    date.setDate(this.selectedDate.getDate() + 1)
    LessonsModule.SetSelectedDate(date)
  }

  private handleToday() {
    const date = new Date()
    LessonsModule.SetSelectedDate(date)
  }

  private handleRefresh() {
    this.fetchData()
  }

  private handleNewLesson() {
    if (!this.state) {
      return
    }
    const selected: string[] = this.state.get('config.plugin.selection').selected['chart-timeline-grid-row-blocks']

    const date = new Date()
    date.setHours(date.getHours() + 1)
    if (date.getMinutes() <= 15) {
      date.setMinutes(0)
    } else if (date.getMinutes() > 15 && date.getMinutes() < 45) {
      date.setMinutes(30)
    } else {
      date.setHours(date.getHours() + 3)
      date.setMinutes(0)
    }
    date.setSeconds(0)
    console.log(date)
    let from = formatDateTimeToBackend(date)
    date.setHours(date.getHours() + 1)
    let to = formatDateTimeToBackend(date)
    let rowId = -1
    if (selected.length > 0) {
      const lastIndex = selected.length - 1
      const startIndexOfDate = selected[0].indexOf(':') + 1
      const fromDate = new Date(selected[0].substr(startIndexOfDate))
      const toDate = new Date(selected[lastIndex].substr(startIndexOfDate))
      fromDate.setHours(fromDate.getHours())
      toDate.setHours(toDate.getHours() + 1)

      from = formatDateTimeToBackendWithOffset(fromDate)
      to = formatDateTimeToBackendWithOffset(toDate)
      rowId = Number.parseInt(selected[0].substr(0, selected[0].indexOf(':')))
    }

    this.editLesson = {
      id: -1,
      name: '',
      type: 'ski',
      price: 20,
      from: from,
      to: to,
      persons_count: 1,
      instructor: {
        id: rowId
      }
    } as ILesson
    this.changeValue = !this.changeValue
    console.log(this.editLesson)
  }

  private handlePreparePay(data: ILesson) {
    console.log('Lesson prepare pay', data)
    this.payLesson = data
  }

  private handlePaid(paid: ILesson[]) {
    this.lessons.forEach((lesson) => {
      if (paid.some(pay => pay.id === lesson.id)) {
        lesson.status = 'paid'
      }
    })

    if (this.state) {
      this.state.update('config.chart.items', this.config.chart.items)
    }
  }

  private handleGanttEvent(data: any, event: any, update: boolean = true) {
    console.log('Handle gantt event', data.item, event, update)
    if (update && !event.path.update.endsWith('items')) {
      this.updateLesson(data, event)
      this.updatedJustNow = true
      setTimeout(() => {
        this.updatedJustNow = false
      }, 500)
    } else if (!update && data.item !== null && !this.updatedJustNow) {
      console.log('Update')
      this.editLesson = data.item.data
      this.changeValue = !this.changeValue
    }
    // else if (event.path.update.endsWith('items')) {
    //     console.log('New lesson')
    //     setTimeout(() => {
    //         console.log('New lesson ins')
    //         this.handleNewLesson()
    //     }, 300)
    // }
  }

  private handleSaved() {
    this.fetchData()
  }

  private handleDeleted(id: number) {
    let index = this.lessons.findIndex((lesson) => lesson.id === id)
    console.log('delete', this.lessons, id, index)
    this.lessons.splice(index, 1)
    if (this.state) {
      this.state.update('config.chart.items', this.config.chart.items)
    }
  }

  private handleDiscardPay() {
    this.payLesson = null
  }

  @Watch('selectedDate')
  private onSelectedDate() {
    this.fetchData()
  }

  private fetchData() {
    this.fetchLessons()
    this.fetchInstructors()
  }

  private fetchLessons() {
    const date = formatDateToBackend(this.selectedDate)
    LessonsModule.GetLessons({date: date, name: null}).then((values) => {
      this.lessons = values
    })
  }

  private fetchInstructors() {
    InstructorsModule.GetInstructors({
      name: null,
      gender: null,
      teaching: null,
      date: formatDateToBackend(this.selectedDate)
    }).then((values) => {
      this.instructors = values
      if (this.state) {
        this.state.update('config.list.rows', this.config.list.rows)
      }
    })
  }

  private async updateLesson(value: any, eventInfo: any) {
    if (eventInfo.path.update === undefined) {
      return
    }

    if (!eventInfo.path.update.endsWith('time') && !eventInfo.path.update.endsWith('rowId')) {
      return
    }

    const lesson = this.lessons.find((lesson: ILesson) => {
      if (lesson.id == value.id) {
        return lesson
      }
    })

    if (!lesson || !value || !lesson.instructor) {
      return
    }

    if (new Date(lesson.from).getTime() === value.time.start &&
      new Date(lesson.to).getTime() === value.time.end &&
      lesson.instructor.id === value.rowId) {
      return
    }

    lesson.from = formatDateTimeToBackendWithOffset(new Date(value.time.start))
    lesson.to = formatDateTimeToBackendWithOffset(new Date(value.time.end))

    const payload = {
      id: lesson.id,
      from: lesson.from,
      to: lesson.to,
      price: lesson.price,
      name: lesson.name,
      type: lesson.type,
      note: lesson.note,
      persons_count: lesson.persons_count,
      instructor_id: value.rowId
    }

    console.log('UPDATE LESSON', payload)
    LessonsModule.UpdateLesson(payload).then((value: ILesson) => {
      Message({
        message: this.$t('messages.successUpdate').toString(),
        type: 'success',
        duration: 2 * 1000
      })
    })
  }
}


</script>
<style lang="scss" scoped>
.lessons-container {
  padding: 32px;

  .controls {
    margin-bottom: 20px;

    & > * {
      margin-right: 10px;
    }
  }

  ::v-deep .gantt-schedule-timeline-calendar__list-column-header,
  ::v-deep .gantt-schedule-timeline-calendar__chart-calendar {
    background: #FFF;
  }

  ::v-deep .gantt-schedule-timeline-calendar__chart-timeline-items-row-item {
    &.paid {
      -webkit-box-shadow: 0 0 5px 0 rgba(50, 50, 50, 1);
      -moz-box-shadow: 0 0 5px rgba(50, 50, 50, 1);
      box-shadow: 0 0 5px rgba(50, 50, 50, 1);
      border: 1px solid rgba(50, 50, 50, 1);
      background: #94C23E !important;
    }

    &.colored.green {
      background: #17A46A;
    }

    &.colored.yellow {
      background: #FED330;
      color: #000000;
    }

    &.colored.red {
      background: #C30934;
    }

    &.colored.blue {
      background: #158ABE;
    }

    &.colored.purple {
      background: #595DF1;
    }

    &.colored.burgundy {
      background: #64073D;
    }

    &.colored.greenish {
      background: #158C8F;
    }

    &.colored.light-green {
      background: #94C23E;
    }
  }
}
</style>
