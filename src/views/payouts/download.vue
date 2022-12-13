<template>
  <div
    v-loading.fullscreen.lock="fullscreenLoading"
    class="main-article"
    element-loading-text="Načítavam PDF"
  >
    <div class="no-print">
      <el-button type="primary" @click.native="handleBack">Späť</el-button>
      <el-button type="info" @click.native="handlePrint">Tlačiť</el-button>
      <el-button type="success" @click.native="handlePayout">Vyplatiť</el-button>
    </div>
    <div class="article__heading">
      <div class="article__heading__title">
        {{ payout.instructor.name }}
      </div>
      <strong>
        {{ from }} - {{ to }}
      </strong>
      <el-divider/>
      <el-row :gutter="8">
        <el-col :span="24"><strong>Odrobené dokopy:</strong></el-col>
        <el-col :span="4">{{ total }}</el-col>
      </el-row>
      <el-divider/>
      <el-row :gutter="8">
        <el-col :span="24"><strong>Odrobené podľa počtu osôb:</strong></el-col>
        <el-col :span="4">1 osoba: {{ person1 }}</el-col>
        <el-col :span="4">2 osoby: {{ person2 }}</el-col>
        <el-col :span="4">3 osoby: {{ person3 }}</el-col>
        <el-col :span="4">4+ osob: {{ person4 }}</el-col>
      </el-row>
    </div>

    <el-table
      ref="payoutTable"
      :stripe="true"
      :data="payout.lessons"
    >
      <el-table-column
        prop="id"
        label="ID"
        width="100"
      />
      <el-table-column
        prop="name"
        label="Meno"
      />
      <el-table-column
        prop="from"
        label="Od"
        width="150"
        :formatter="formatDate"
      />
      <el-table-column
        prop="to"
        label="Do"
        width="150"
        :formatter="formatDate"
      />
      <el-table-column
        prop="type"
        label="SKI/SNB"
        width="100"
      />
      <el-table-column
        prop="persons_count"
        label="Počet"
        width="100"
      />
    </el-table>
    <lesson-payout
      :payout="payPayout"
      @paid="handlePaid"
      @discard="handleDiscardPay"/>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {PayoutModule} from "@/store/modules/payout";
import {IPayout} from "@/api/types";
//@ts-ignore
import LessonPayout from '@/components/LessonPayout/index'
import {formatNiceDate, formatNiceDateTime, formatTimeInMinToNiceTime} from "@/utils";

@Component({
  name: 'PayoutPDF',
  components: {
    LessonPayout
  }
})
export default class extends Vue {
  private fullscreenLoading = false

  private payPayout: IPayout | null = null

  get from() {
    return formatNiceDate(PayoutModule.dates[0])
  }

  get to() {
    return formatNiceDate(PayoutModule.dates[1])
  }

  get payout() {
    let id = Number.parseInt(this.$route.query.id as string)
    return PayoutModule.payouts.find((payout: IPayout) => payout.instructor.id === id)
  }

  get total() {
    if (this.payout) {
      return formatTimeInMinToNiceTime(this.payout.stats.total)
    }
    return ""
  }

  get person1() {
    if (this.payout) {
      return formatTimeInMinToNiceTime(this.payout.stats.total_by_person.persons_1)
    }
    return ""
  }

  get person2() {
    if (this.payout) {
      return formatTimeInMinToNiceTime(this.payout.stats.total_by_person.persons_2)
    }
    return ""
  }

  get person3() {
    if (this.payout) {
      return formatTimeInMinToNiceTime(this.payout.stats.total_by_person.persons_3)
    }
    return ""
  }

  get person4() {
    if (this.payout) {
      return formatTimeInMinToNiceTime(this.payout.stats.total_by_person.persons_4)
    }
    return ""
  }

  formatDate(row: any, _column: any) {
    return formatNiceDateTime(new Date(row[_column.property]))
  }

  private handleBack() {
    this.$router.back()
  }

  private handlePrint() {
    window.print()
  }

  private handlePayout() {
    if (this.payout) {
      this.payPayout = this.payout
    }
  }

  private handleDiscardPay() {
    this.payPayout = null
  }

  private handlePaid() {
    this.payPayout = null
    PayoutModule.GetPayouts()
  }
}
</script>

<style lang="scss" scoped>
@media print {
  .no-print, .no-print * {
    display: none !important;
  }
}

.main-article {
  padding: 20px;
  margin: 0 auto;
  display: block;
  width: 740px;
  background: #fff;
}

.article__heading {
  position: relative;
  padding: 0 0 20px;
  overflow: hidden;
}

.article__heading__title {
  display: block;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 32px;
  line-height: 48px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
}

.node-article-content {
  margin: 20px 0 0;
  @include clearfix;
  font-size: 16px;
  color: #333;
  letter-spacing: 0.5px;
  line-height: 28px;
  margin-bottom: 30px;
  font-family: medium-content-serif-font, Georgia, Cambria, "Times New Roman", Times, serif;

  & > :last-child {
    margin-bottom: 0;
  }

  b,
  strong {
    font-weight: inherit;
    font-weight: bolder;
  }

  img {
    max-width: 100%;
    display: block;
    margin: 0 auto;
  }

  p {
    font-weight: 400;
    font-style: normal;
    font-size: 21px;
    line-height: 1.58;
    letter-spacing: -.003em;
  }

  ul {
    margin-bottom: 30px;
  }

  li {
    --x-height-multiplier: 0.375;
    --baseline-multiplier: 0.17;

    letter-spacing: .01rem;
    font-weight: 400;
    font-style: normal;
    font-size: 21px;
    line-height: 1.58;
    letter-spacing: -.003em;
    margin-left: 30px;
    margin-bottom: 14px;
  }

  a {
    text-decoration: none;
    background-repeat: repeat-x;
    background-image: linear-gradient(to right, rgba(0, 0, 0, .84) 100%, rgba(0, 0, 0, 0) 0);
    background-size: 1px 1px;
    background-position: 0 calc(1em + 1px);
    padding: 0 6px;
  }

  code {
    background: rgba(0, 0, 0, .05);
    padding: 3px 4px;
    margin: 0 2px;
    font-size: 16px;
    display: inline-block;
  }

  img {
    border: 0;
  }

  /* 解决 IE6-7 图片缩放锯齿问题 */
  img {
    -ms-interpolation-mode: bicubic;
  }

  blockquote {
    --x-height-multiplier: 0.375;
    --baseline-multiplier: 0.17;
    font-family: medium-content-serif-font, Georgia, Cambria, "Times New Roman", Times, serif;
    letter-spacing: .01rem;
    font-weight: 400;
    font-style: italic;
    font-size: 21px;
    line-height: 1.58;
    letter-spacing: -.003em;
    border-left: 3px solid rgba(0, 0, 0, .84);
    padding-left: 20px;
    margin-left: -23px;
    padding-bottom: 2px;
  }

  a {
    text-decoration: none;
  }

  h2,
  h3,
  h4 {
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -.015em;
    margin: 53px 0 0;
  }

  h4 {
    font-size: 26px;
  }
}
</style>
