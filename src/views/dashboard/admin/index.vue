<template>
  <div class="dashboard-editor-container">
    <el-row :gutter="8">
      <el-col :span="12">
        <el-date-picker
          v-model="dates"
          type="daterange"
          start-placeholder="Od"
          end-placeholder="Do"
          format="dd.MM.yyyy"
          :picker-options="pickerOptions">
        </el-date-picker>
      </el-col>
    </el-row>
    <panel-group/>
    <el-row :gutter="8">
      <el-col
        :xs="{span: 24}"
        :sm="{span: 24}"
        :md="{span: 24}"
        :lg="{span: 24}"
        :xl="{span: 24}"
        style="padding-right:8px;margin-bottom:30px;"
      >
        <bar-chart/>
      </el-col>
    </el-row>
    <el-row :gutter="8">
      <el-col :span="12">
        <el-image src="https://www.yr.no/en/content/2-12057247/meteogram.svg" alt="yr.no forecast oscadnica"/>
      </el-col>
      <el-col :span="12">
        <el-image src="https://www.yr.no/en/content/2-12212485/meteogram.svg" alt="yr.no forecast velka raca"/>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import 'echarts/theme/macarons.js' // Theme used in BarChart, LineChart, PieChart and RadarChart
import {Component, Vue} from 'vue-property-decorator'
import PanelGroup from './components/PanelGroup.vue'
import BarChart from './components/BarChart.vue'
import {values} from "lodash";
import {DashboardModule} from "@/store/modules/dashboard";

@Component({
  name: 'DashboardAdmin',
  components: {
    PanelGroup,
    BarChart
  }
})
export default class extends Vue {

  private pickerOptions = {
    shortcuts: [{
      text: 'Posledný týždeň',
      onClick(picker: any) {
        const end = new Date();
        const start = new Date();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
        picker.$emit('pick', [start, end]);
      }
    }, {
      text: 'Posledný mesiac',
      onClick(picker: any) {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        start.setDate(1)
        start.setHours(0)
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1)
        end.setDate(end.getDate() - 1)
        end.setHours(23)
        picker.$emit('pick', [start, end]);
      }
    }, {
      text: 'Tento mesiac',
      onClick(picker: any) {
        const start = new Date();
        start.setDate(1)
        start.setHours(0)
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1)
        end.setDate(end.getDate() - 1)
        end.setHours(23)
        picker.$emit('pick', [start, end]);
      }
    }]
  }

  get dates() {
    return DashboardModule.dates
  }

  set dates(dates: any) {
    DashboardModule.SetDates(dates)
  }


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
