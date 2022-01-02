<template>
  <div
    :class="className"
    :style="{height: height, width: width}"
  />
</template>

<script lang="ts">
// @ts-ignore
import echarts, {EChartOption} from 'echarts'
import {Component, Prop} from 'vue-property-decorator'
import {mixins} from 'vue-class-component'
import ResizeMixin from '@/components/Charts/mixins/resize'
import {DashboardModule} from '@/store/modules/dashboard'
import {IInstructorsStats} from '@/api/types'

const animationDuration = 6000

@Component({
  name: 'BarChart'
})
export default class extends mixins(ResizeMixin) {
  @Prop({default: 'chart'}) private className!: string
  @Prop({default: '100%'}) private width!: string
  @Prop({default: '300px'}) private height!: string

  get instructorsStats() {
    return DashboardModule.instructorStats ? DashboardModule.instructorStats : []
  }

  mounted() {
    this.fetchData()
  }

  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  }

  private initChart() {
    this.chart = echarts.init(this.$el as HTMLDivElement, 'macarons')
    this.chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        top: 10,
        left: '2%',
        right: '2%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [{
        type: 'category',
        data: this.instructorsStats.map((stat) => stat.name),
        axisTick: {
          alignWithLabel: true
        }
      }],
      yAxis: [{
        type: 'value',
        axisTick: {
          show: false
        }
      }],
      series: [{
        name: this.$t('dashboard.minutes'),
        type: 'bar',
        stack: 'minutes',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.duration),
        animationDuration
      }, {
        name: this.$t('dashboard.persons_1'),
        type: 'bar',
        stack: 'per_person',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.duration_by_persons.persons_1),
        animationDuration
      }, {
        name: this.$t('dashboard.persons_2'),
        type: 'bar',
        stack: 'per_person',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.duration_by_persons.persons_2),
        animationDuration
      }, {
        name: this.$t('dashboard.persons_3'),
        type: 'bar',
        stack: 'per_person',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.duration_by_persons.persons_3),
        animationDuration
      }, {
        name: this.$t('dashboard.persons_4'),
        type: 'bar',
        stack: 'per_person',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.duration_by_persons.persons_4),
        animationDuration
      }, {
        name: this.$t('dashboard.total'),
        type: 'bar',
        stack: 'price',
        // barWidth: '60%',
        data: this.instructorsStats.map((stat) => stat.total),
        animationDuration
      }]
    } as EChartOption<EChartOption.SeriesBar>)
  }

  private fetchData() {
    DashboardModule.GetInstructorsStats().then(() => {
      this.initChart()
    })
  }
}
</script>
