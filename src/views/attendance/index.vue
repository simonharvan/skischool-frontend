<template>
  <div class="attendance-container">
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
          {{ $t('lessons.tomorrow') }} <i class="el-icon-arrow-right" />
        </el-button>
      </el-button-group>

      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="Pick a day"
        format="d.M.yyyy"
      />
    </el-row>
    <el-table
      ref="attendanceTable"
      v-loading="loading"
      :data="instructors"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        property="instructor"
        label="Instructor"
        width="140"
        :formatter="instructorFormatter"
      />
      <el-table-column
        type="selection"
        width="80"
      />
    </el-table>
    <el-row
      :gutter="20"
    >
      <el-col :span="6">
        <el-button
          type="success"
          class="save"
          @click.native="handleSave"
        >
          {{ $t('save') }}
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { InstructorsModule } from '@/store/modules/instructor'
import { AttendanceModule } from '@/store/modules/attendance'
import { IAttendance, IInstructor } from '@/api/types'
import { formatDateTimeToBackendWithOffset, formatDateToBackend } from '@/utils'
import { Message } from 'element-ui'

    @Component({
      name: 'Attendance',
      components: {}
    })
export default class extends Vue {
        private attendance: IAttendance[] = []
        private selected: IInstructor[] = []
        private loading: boolean = false

        get instructors() {
          return InstructorsModule.instructors.filter((inst) => {
            return inst.email !== 'docasny@instruktor.sk'
          })
        }

        get selectedDate() {
          return AttendanceModule.selectedDate
        }

        set selectedDate(date: Date) {
          date.setHours(8)
          AttendanceModule.SetSelectedDate(date)
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

        private handleYesterday() {
          const date = new Date()
          date.setDate(this.selectedDate.getDate() - 1)
          console.log('Yesterdat', date)
          AttendanceModule.SetSelectedDate(date)
        }

        private handleTommorow() {
          const date = new Date()
          date.setDate(this.selectedDate.getDate() + 1)
          console.log('Tommorow', date)
          AttendanceModule.SetSelectedDate(date)
        }

        private handleToday() {
          const date = new Date()
          console.log('Today', date)
          AttendanceModule.SetSelectedDate(date)
        }

        mounted() {
          this.fetchData()
        }

        private handleSelectionChange(selected: IInstructor[]) {
          console.log('attendance', selected)
          this.selected = selected
        }

        private instructorFormatter(row: any, column: any) {
          return row.name
        }

        @Watch('selectedDate')
        private fetchData() {
          this.loading = true
          AttendanceModule.GetAttendance({
            instructor: null,
            date: formatDateToBackend(this.selectedDate)
          }).then((values) => {
            this.attendance = values;

            (this.$refs.attendanceTable as any).clearSelection()

            this.instructors.forEach((inst) => {
              // @ts-ignore
              if (this.attendance.some((att) => inst.id === att.instructor.id)) {
                (this.$refs.attendanceTable as any).toggleRowSelection(inst, true)
              }
            })
            this.loading = false
          })
        }

        private async handleSave() {
          const createAtt = this.instructors.filter((inst) => {
            // @ts-ignore
            return this.selected.some((sel) => inst.id === sel.id)
          }).map((inst) => inst.id)

          const deleteAtt = this.instructors.filter((inst) => {
            // @ts-ignore
            return this.selected.map(sel => sel.id).indexOf(inst.id) === -1
          }).map((inst) => inst.id)

          if (createAtt.length > 0) {
            await AttendanceModule.BulkCreate({
              instructor_ids: createAtt,
              from: formatDateTimeToBackendWithOffset(this.startOfSelectedDate),
              to: formatDateTimeToBackendWithOffset(this.endOfSelectedDate)
            })
          }
          if (deleteAtt.length > 0) {
            await AttendanceModule.BulkDelete({
              instructor_ids: deleteAtt,
              date: formatDateToBackend(this.selectedDate)
            })
          }

          Message({
            message: this.$t('messages.successUpdate').toString(),
            type: 'success',
            duration: 2 * 1000
          })
        }
}
</script>
<style lang="scss" scoped>
    .attendance-container {
        padding: 32px;

        .controls {
            margin-bottom: 20px;

            & > * {
                margin-right: 10px;
            }
        }

        .save {
            margin-top: 20px;
        }

    }
</style>
