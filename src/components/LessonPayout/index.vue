<template>
  <el-dialog
    v-if="payout"
    :title="payout.instructor.name"
    :visible.sync="dialogVisible"
    width="80%"
    @closed="handleClosed"
    append-to-body
  >
    <el-table
      v-if="payout.lessons"
      ref="payoutTable"
      :data="payout.lessons"
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
        width="160"
        :formatter="durationFormatter"
      />
      <el-table-column
        property="name"
        label="Name"
      />
      <el-table-column
        property="type"
        label="SKI/SNB"
        width="160"
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
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import {ILesson, IPayout} from '@/api/types'
import {formatNiceDateTime} from '@/utils'
import {Message} from 'element-ui'
import {PayoutModule} from '@/store/modules/payout'

@Component({
  name: 'LessonPayout'
})
export default class extends Vue {
  @Prop({default: Object}) private payout!: IPayout

  private dialogVisible = false
  private price: number = 20
  private selected: ILesson[] = []

  private HOUR_IN_MS = 60 * 60 * 1000

  @Watch('payout')
  private onLessonChange(payout: IPayout) {
    console.log('Payout', payout)
    if (!payout) {
      return
    }
    this.dialogVisible = true
    this.price = payout.stats.earned_approx
    setTimeout(() => {
      (this.$refs.payoutTable as any).toggleAllSelection()
      this.selected = payout.lessons
    }, 200)
  }

  private handleSelectionChange(val: []) {
    console.log("Select", val)
    this.selected = val
    let total = 0
    this.selected.forEach((value) => {
      total += this.priceFormatter(value, null)
    })
    this.price = total
  }

  private handlePay() {
    PayoutModule.Payout({
      lesson_ids: this.selected.map(sel => sel.id),
      amount: this.price,
      instructor_id: this.payout.instructor.id
    }).then(() => {
      Message({
        message: this.$t('messages.successUpdate').toString(),
        type: 'success',
        duration: 2 * 1000
      })
      this.$emit('paid')
      this.dialogVisible = false
    })
  }

  private handleClosed() {
    this.$emit('discard')
  }

  private dateFormatter(row: any, column: any) {
    return formatNiceDateTime(new Date(row.from))
  }

  private priceFormatter(row: any, column: any) {
    const hours = new Date(new Date(row.to).getTime() - new Date(row.from).getTime()).getTime() / this.HOUR_IN_MS
    return hours * 10
  }

  private durationFormatter(row: any, column: any) {
    const hours = new Date(new Date(row.to).getTime() - new Date(row.from).getTime()).getUTCHours()

    let minutes: any = new Date(new Date(row.to).getTime() - new Date(row.from).getTime()).getMinutes()
    if (minutes > 15 && minutes < 45) {
      minutes = '30'
    } else {
      minutes = '00'
    }

    return hours + ':' + minutes
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
