<template>
  <el-dialog
    v-if="lesson"
    :title="lesson.client.name"
    :visible.sync="dialogVisible"
    :v-loading="loading"
    width="80%"
    @closed="handleClosed"
    append-to-body
  >
    <el-table
      v-if="lessons"
      ref="lessonsTable"
      :data="lessons"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="80"
        fixed="left"
      />
      <el-table-column
        property="date"
        label="Date"
        width="160"
        :formatter="dateFormatter"
      />
      <el-table-column
        property="duration"
        label="Duration"
        :formatter="durationFormatter"
      />
      <el-table-column
        v-if="lessons"
        property="name"
        width="140"
        label="Name"
      />
      <el-table-column
        property="instructor"
        label="Instructor"
        width="140"
        :formatter="instructorFormatter"
      />
      <el-table-column
        property="type"
        label="SKI/SNB"
      >
        <template slot-scope="scope">
          <el-tag
            :type="scope.row.type === 'ski' ? 'primary' : 'warning'"
            disable-transitions
          >
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        property="price"
        label="Price"
        fixed="right"
      />
    </el-table>
    <el-form>
      <el-row
        :gutter="20"
      >
        <el-col
          :span="6"
          :offset="12"
        >
          <el-form-item :label="$t('lessons.totalPrice')">
            <el-input-number
              v-model="price"
              @change="handlePriceChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-button
            type="success"
            icon="el-icon-money"
            @click.native="handlePay"
          >
            {{ $t('lessons.pay') }}
          </el-button>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ILesson } from '@/api/types'
import { formatNiceDateTime } from '@/utils'
import { LessonsModule } from '@/store/modules/lessons'
import { Message } from 'element-ui'

    @Component({
      name: 'LessonPay'
    })
export default class extends Vue {
        @Prop({ default: Object }) private lesson!: ILesson

        private loading = false
        private lessons: ILesson[] = []
        private dialogVisible = false
        private price: number = 20
        private selected: ILesson[] = []

        @Watch('lesson')
        private onLessonChange(lesson: ILesson) {
          console.log('Pay Lesson', lesson)
          if (!lesson) {
            return
          }
          this.dialogVisible = true
          this.fetchData()
        }

        mounted() {

        }

        private handleSelectionChange(val: []) {
          console.log('Selected', val)
          this.selected = val
          let total = 0
          this.lessons.forEach((value) => {
            if (this.selected.some(selected => selected.id === value.id)) {
              total += value.price
            }
          })
          this.price = total
        }

        private handlePriceChange() {
          const partPrice = this.price / this.selected.length
          this.lessons.forEach((value) => {
            if (this.selected.some(selected => selected.id === value.id)) {
              value.price = Math.round(partPrice * 100) / 100
            }
          })
        }

        private handlePay() {
          LessonsModule.Pay({ ids: this.selected.map(sel => sel.id), price: this.price }).then(() => {
            Message({
              message: this.$t('messages.successUpdate').toString(),
              type: 'success',
              duration: 2 * 1000
            })
            this.$emit('paid', this.selected)
            this.dialogVisible = false
          })
        }

        private handleClosed() {
          this.$emit('discard')
        }

        private instructorFormatter(row: any, column: any) {
          return row.instructor.name
        }

        private dateFormatter(row: any, column: any) {
          return formatNiceDateTime(new Date(row.from))
        }

        private durationFormatter(row: any, column: any) {
          const hours = new Date(new Date(row.to).getTime() - new Date(row.from).getTime()).getUTCHours()
          console.log('Formatter', row.to, row.from, hours)

          let minutes: any = new Date(new Date(row.to).getTime() - new Date(row.from).getTime()).getMinutes()
          if (minutes > 15 && minutes < 45) {
            minutes = '30'
          } else {
            minutes = '00'
          }

          return hours + ':' + minutes
        }

        private fetchData() {
          this.loading = true
          LessonsModule.PreparePay({ id: this.lesson.id }).then((values) => {
            console.log('PreparePAy', values)
            this.loading = false
            this.lessons = values;
            (this.$refs.lessonsTable as any).toggleAllSelection()
            let total = 0
            this.lessons.forEach((value) => {
              if (this.selected.some(selected => selected.id === value.id)) {
                total += value.price
              }
            })
            this.price = total
          })
        }
}
</script>

<style lang="scss" scoped>
    .el-row {
        padding-top: 5px;
        padding-bottom: 5px;

        .el-button, .el-input-number--medium {
            width: 100%;
        }
        .el-button {
            margin-top: 36px;
        }
    }
</style>
