<template>
  <div class="lessons-container">
    <el-button-group class="date-control">
      <el-button
        type="primary"
        icon="el-icon-arrow-left"
        @click.native="handleYesterday"
      >
        Yesterday
      </el-button>
      <el-button
        type="primary"
        @click.native="handleToday"
      >
        Today
      </el-button>
      <el-button
        type="primary"
        @click.native="handleTommorow"
      >
        Tommorow <i class="el-icon-arrow-right" />
      </el-button>
    </el-button-group>
    <gantt-scheduler
      :config="config"
      @state="handleOnState"
    />
  </div>
</template>

<script lang="ts">
import GSTC from 'gantt-schedule-timeline-calendar'

import { Component, Vue, Watch } from 'vue-property-decorator'
import GanttScheduler from 'vue-gantt-schedule-timeline-calendar'
import { LessonsModule } from '@/store/modules/lessons'
import { IInstructor, ILesson } from '@/api/types'
import { InstructorsModule } from '@/store/modules/instructor'
import { ResizingItemClass } from '@/views/lessons/helpers/ResizingItemClass'
import { AddItemStyleClass } from '@/views/lessons/helpers/AddItemStyleClass'
import { formatDateToBackend } from '@/utils'
import { Message } from 'element-ui'
import { ItemClickActionClass } from '@/views/lessons/helpers/ItemClickActionClass'
import { plugins } from '@/views/lessons/helpers/Plugins'

    @Component({
      name: 'Lessons',
      components: {
        GanttScheduler
      }
    })

export default class extends Vue {
        private currentRole = 'admin-dashboard'
        private subs: any[] = []
        private state: any;

        private lessons: ILesson[] = [];
        private instructors: IInstructor[] = [];

        private colors = [
          'green', 'yellow', 'red', 'blue',
          'purple', 'burgundy', 'greenish', 'light-green'
        ]
        private itemTimeout: NodeJS.Timeout | undefined;

        private handleOnState(state: any) {
          this.state = state
          console.log('handleOnState()', state)
          this.subs.push(
            state.subscribe('config.chart.items.:id',
              (value: any, eventInfo: any) => {
                if (this.itemTimeout) {
                  clearTimeout(this.itemTimeout)
                }
                this.itemTimeout = setTimeout(() => {
                  this.updateLesson(value, eventInfo)
                }, 500)
              }
            )
          )
        }

        get selectedDate() {
          return LessonsModule.selectedDate
        }

        get startOfSelectedDate() {
          const result = new Date(this.selectedDate.getTime())
          result.setHours(8)
          result.setMinutes(0)
          result.setSeconds(0)
          return result
        }

        get endOfSelectedDate() {
          const result = new Date(this.selectedDate.getTime())
          result.setHours(17)
          result.setMinutes(0)
          result.setSeconds(0)
          return result
        }

        get config() {
          let result: any = {
            height: 300,
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
                      content: 'Name'
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
            }
          }
          this.instructors.forEach((instructor: IInstructor) => {
            result.list.rows[instructor.id] = {
              id: instructor.id,
              label: instructor.name
            }
          })

          this.lessons.forEach((lesson: ILesson) => {
            result.chart.items[lesson.id] = {
              id: lesson.id,
              rowId: lesson.instructor.id,
              label: lesson.name + ' (' + lesson.client.phone + ')',
              color: this.colors[lesson.instructor.id % 8],
              data: lesson,
              time: {
                start: new Date(lesson.from).getTime(),
                end: new Date(lesson.to).getTime()
              }
            }
          })
          result.chart.time = {
            from: this.startOfSelectedDate.getTime(),
            to: this.endOfSelectedDate.getTime(),
            zoom: 15.2,
            period: 'hour',
            dates: {},
            maxWidth: {}
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
          const date = new Date()
          date.setDate(this.selectedDate.getDate() - 1)
          LessonsModule.SetSelectedDate(date)
        }

        private handleTommorow() {
          const date = new Date()
          date.setDate(this.selectedDate.getDate() + 1)
          LessonsModule.SetSelectedDate(date)
        }

        private handleToday() {
          const date = new Date()
          LessonsModule.SetSelectedDate(date)
        }

        @Watch('selectedDate')
        private onSelectedDate() {
          this.fetchLessons()
        }

        private async fetchData() {
          this.fetchLessons()
          this.instructors = await InstructorsModule.GetInstructors({ name: null, gender: null, teaching: null })
        }

        private async fetchLessons() {
          const date = this.selectedDate.toISOString().substr(0, 10)
          this.lessons = await LessonsModule.GetLessons({ date: date, name: null })
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

          if (!lesson || !value) {
            return
          }

          if (new Date(lesson.from).getTime() === value.time.start &&
                new Date(lesson.to).getTime() === value.time.end &&
                lesson.instructor.id === value.rowId) {
            return
          }

          const from = formatDateToBackend(new Date(value.time.start))
          const to = formatDateToBackend(new Date(value.time.end))
          console.log(value, from, to)
          const payload = {
            id: lesson.id,
            from: from,
            to: to,
            price: lesson.price,
            name: lesson.name,
            type: lesson.type,
            instructor_id: value.rowId
          }

          console.log('UPDATE LESSON', payload, from, to)
          LessonsModule.UpdateLesson(payload).then((value: ILesson) => {
            Message({
              message: this.$t('messages.successUpdate').toString(),
              type: 'success',
              duration: 2 * 1000
            })
          })
        }
}

export function clickCallback(data: any, event: any) {
  alert(`Item ${data.item.id} clicked!`)
}

</script>
<style lang="scss" scoped>
    .lessons-container {
        padding: 32px;

        .date-control {
            margin-bottom: 20px;
        }

        ::v-deep .gantt-schedule-timeline-calendar__list-column-header,
        ::v-deep .gantt-schedule-timeline-calendar__chart-calendar {
            background: #FFF;
        }

        ::v-deep .gantt-schedule-timeline-calendar__chart-timeline-items-row-item {
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
