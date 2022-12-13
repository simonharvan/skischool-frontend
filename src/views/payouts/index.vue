<template>
  <div class="instructors-container">
    <el-row class="controls">
      <el-button-group>
        <el-button
          type="primary"
          icon="el-icon-arrow-left"
          @click.native="handlePrevious"
        >
          {{ $t('payouts.previous') }}
        </el-button>
        <el-button
          type="primary"
          @click.native="handleThis"
        >
          {{ $t('payouts.this') }}
        </el-button>
        <el-button
          type="primary"
          @click.native="handleNext"
        >
          {{ $t('payouts.next') }} <i class="el-icon-arrow-right"/>
        </el-button>
      </el-button-group>
      <el-date-picker
        v-model="dates"
        type="daterange"
        start-placeholder="Od"
        end-placeholder="Do"
        format="dd.MM.yyyy"
        @change="handleDateChange">
      </el-date-picker>

      <el-switch
        v-model="includePaid"
        active-text="Aj s vyplatenými"
        inactive-text="Bez vyplatených"
        @change="handleChangeIncludePaid">
      </el-switch>
    </el-row>
    <el-table
      ref="payoutTable"
      v-loading="loading"
      :data="payouts"
    >
      <el-table-column
        prop="instructor.name"
        label="Meno"
        width="250"
      />
      <el-table-column
        prop="instructor.email"
        label="Email"
      />
      <el-table-column
        prop="stats.total"
        label="Hodin odrobených"
        width="200"
        :formatter="formatTime"
      />
      <el-table-column
        prop="stats.earned_approx"
        label="Priblížne zarobené"
        width="200"
      />

      <el-table-column
        label="Operácie"
        width="300"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            class="edit-button"
            @click="handlePrint(scope.row)"
          >
            Vytlačiť
          </el-button>
          <el-button
            size="mini"
            type="success"
            class="edit-button"
            @click="handleShowPayout(scope.row)"
          >
            Vyplatiť
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <lesson-payout
      :payout="payPayout"
      @paid="handlePaid"
      @discard="handleDiscardPay"/>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {IPayout} from '@/api/types'
import {PayoutModule} from '@/store/modules/payout'
import {formatTimeInMinToNiceTime} from "@/utils";
// @ts-ignore
import LessonPayout from '@/components/LessonPayout/index'

@Component({
  name: 'Payouts',
  components: {
    LessonPayout
  }
})
export default class extends Vue {

  private loading = false

  private payPayout: IPayout | null = null

  get payouts() {
    return PayoutModule.payouts.filter((payout: IPayout) => {
      return payout.stats.total > 0
    })
  }

  get dates() {
    return PayoutModule.dates
  }

  set dates(dates: any) {
    PayoutModule.SetDates(dates)
  }

  get includePaid() {
    return PayoutModule.includePaid
  }

  mounted() {
    this.handleThis()
    this.fetchData()
  }

  private fetchData() {
    this.loading = true
    PayoutModule.GetPayouts().then(() => {
      this.loading = false
    })
  }

  private handleChangeIncludePaid() {
    PayoutModule.ToggleIncludePaid()
  }

  private handlePrevious() {
    let date = new Date(this.dates[0])
    date.setMonth(date.getMonth() - 1)

    let toDate = new Date(date)
    toDate.setMonth(date.getMonth() + 1)
    toDate.setDate(toDate.getDate() - 1)
    PayoutModule.SetDates([date, toDate])
    this.fetchData()
  }

  private handleThis() {
    let date = new Date()
    let toDate = new Date(date)
    toDate.setMonth(date.getMonth() + 1)
    toDate.setDate(toDate.getDate() - 1)
    PayoutModule.SetDates([date, toDate])
    this.fetchData()
  }

  private handleNext() {
    let date = new Date(this.dates[0])
    date.setMonth(date.getMonth() + 1)

    let toDate = new Date(date)
    toDate.setMonth(date.getMonth() + 1)
    toDate.setDate(toDate.getDate() - 1)
    PayoutModule.SetDates([date, toDate])
    this.fetchData()
  }

  private handleDateChange(date: Date) {
    this.fetchData()
  }

  private handlePrint(data: IPayout) {
    this.$router.push({
      name: 'payout-download', query: {
        id: data.instructor.id
      } as any
    })
  }

  private handleShowPayout(data: IPayout) {
    this.payPayout = data
  }

  private handleDiscardPay() {
    this.payPayout = null
  }

  private handlePaid() {
    this.payPayout = null
    PayoutModule.GetPayouts()
  }

  formatTime(row: any, _column: any) {
    return formatTimeInMinToNiceTime(row.stats.total)
  }
}
</script>
<style lang="scss" scoped>
.instructors-container {
  padding: 32px;

  .controls {
    margin-bottom: 20px;

    & > * {
      margin-right: 10px;
    }
  }

  .edit-button {
    margin-right: 12px;
  }

  .save {
    margin-top: 20px;
  }

}
</style>
