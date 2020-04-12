<template>
  <div
    :class="className"
    :style="{height: height, width: width}"
  />
</template>

<script lang="ts">
import echarts, { EChartOption } from 'echarts'
import { Component, Prop } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import ResizeMixin from '@/components/Charts/mixins/resize'
import { DashboardModule } from '@/store/modules/dashboard'
import { IInstructorsStats } from '@/api/types'

const animationDuration = 6000

    @Component({
      name: 'BarChart'
    })
export default class extends mixins(ResizeMixin) {
        @Prop({ default: 'chart' }) private className!: string
        @Prop({ default: '100%' }) private width!: string
        @Prop({ default: '300px' }) private height!: string
        private instructorsStats: IInstructorsStats[] = [];

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
          DashboardModule.GetInstructorsStats().then((stats) => {
            this.instructorsStats = stats
            this.initChart()
          })
        }
}
</script>
