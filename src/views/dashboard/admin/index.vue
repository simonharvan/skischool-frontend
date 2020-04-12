<template>
  <div class="dashboard-editor-container">
    <panel-group @handleSetLineChartData="handleSetLineChartData" />
    <el-row :gutter="8">
      <el-col
        :xs="{span: 24}"
        :sm="{span: 24}"
        :md="{span: 24}"
        :lg="{span: 24}"
        :xl="{span: 24}"
        style="padding-right:8px;margin-bottom:30px;"
      >
        <bar-chart />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import 'echarts/theme/macarons.js' // Theme used in BarChart, LineChart, PieChart and RadarChart
import { Component, Vue } from 'vue-property-decorator'
import PanelGroup from './components/PanelGroup.vue'
import BarChart from './components/BarChart.vue'

@Component({
  name: 'DashboardAdmin',
  components: {
    PanelGroup,
    BarChart
  }
})
export default class extends Vue {

}
</script>

<style lang="scss" scoped>
  .dashboard-editor-container {
    padding: 32px;
    background-color: rgb(240, 242, 245);
    position: relative;

    .github-corner {
      position: absolute;
      top: 0px;
      border: 0;
      right: 0;
    }

    .chart-wrapper {
      background: #fff;
      padding: 16px 16px 0;
      margin-bottom: 32px;
    }
  }

  @media (max-width: 1024px) {
    .chart-wrapper {
      padding: 8px;
    }
  }
</style>
