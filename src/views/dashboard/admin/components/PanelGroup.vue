<template>
  <el-row
    :gutter="40"
    class="panel-group"
  >
    <el-col
      :xs="12"
      :sm="12"
      :lg="7"
      class="card-panel-col"
    >
      <div
        class="card-panel"
        @click="handleSetLineChartData('newClients')"
      >
        <div class="card-panel-icon-wrapper icon-people">
          <svg-icon
            name="peoples"
            class="card-panel-icon"
          />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.newClients') }}
          </div>
          <count-to
            :start-val="0"
            :end-val="stats.clients"
            :duration="2600"
            class="card-panel-num"
          />
        </div>
      </div>
    </el-col>
    <el-col
      :xs="12"
      :sm="12"
      :lg="7"
      class="card-panel-col"
    >
      <div
        class="card-panel"
        @click="handleSetLineChartData('duration')"
      >
        <div class="card-panel-icon-wrapper icon-message">
          <i class="el-icon el-icon-time card-panel-icon"/>
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.duration') }}
          </div>
          <p class="card-panel-num">
            {{ duration }}
          </p>
        </div>
      </div>
    </el-col>
    <el-col
      :xs="12"
      :sm="12"
      :lg="9"
      class="card-panel-col"
    >
      <div
        class="card-panel"
        @click="handleSetLineChartData('purchases')"
      >
        <div class="card-panel-icon-wrapper icon-money">
          <i class="el-icon el-icon-money card-panel-icon"/>
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.unpaid') }}
          </div>
          <p class="card-panel-num">
            {{ unpaid }} €
          </p>
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.paidThisMonth') }}
          </div>
          <p class="card-panel-num">
            {{ paid }} €
          </p>
        </div>
      </div>
    </el-col>
    <el-col
      :xs="12"
      :sm="12"
      :lg="8"
      class="card-panel-col"
    >
      <div
        class="card-panel"
        @click="handleSetLineChartData('shoppings')"
      >
        <div class="card-panel-icon-wrapper icon-shopping">
          <i class="el-icon el-icon-medal-1 card-panel-icon"/>
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.bestInstructorDuration') }}
          </div>
          <p class="card-panel-num">
            {{ bestInstructorDurations }}
          </p>
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $t('dashboard.bestInstructor') }}
          </div>
          <p class="card-panel-num">
            {{ stats.best_instructor }}
          </p>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import CountTo from 'vue-count-to'
import {DashboardModule} from '@/store/modules/dashboard'
import {IStats} from '@/api/types'
import {formatTimeInMinToNiceTime} from "@/utils";

@Component({
  name: 'PanelGroup',
  components: {
    CountTo
  }
})
export default class extends Vue {
  get paid() {
    return Math.round(this.stats.paid * 100) / 100
  }

  get unpaid() {
    return Math.round(this.stats.unpaid * 100) / 100
  }

  get duration() {
    return formatTimeInMinToNiceTime(this.stats.duration)
  }

  get stats() {
    return DashboardModule.stats ? DashboardModule.stats : {} as IStats
  }

  get bestInstructorDurations() {
    return formatTimeInMinToNiceTime(this.stats.best_instructor_duration)
  }

  private handleSetLineChartData(type: string) {
    this.$emit('handlePanelClick', type)
  }

  mounted() {
    DashboardModule.GetStats()
  }
}
</script>

<style lang="scss" scoped>
.panel-group {
  margin-top: 18px;

  .card-panel-col {
    margin-bottom: 32px;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-people {
        background: #40c9c6;
      }

      .icon-message {
        background: #36a3f7;
      }

      .icon-money {
        background: #f4516c;
      }

      .icon-shopping {
        background: #34bfa3
      }
    }

    .icon-people {
      color: #40c9c6;
    }

    .icon-message {
      color: #36a3f7;
    }

    .icon-money {
      color: #f4516c;
    }

    .icon-shopping {
      color: #34bfa3
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

@media (max-width: 550px) {
  .card-panel-description {
    display: none;
  }

  .card-panel-icon-wrapper {
    float: none !important;
    width: 100%;
    height: 100%;
    margin: 0 !important;

    .svg-icon {
      display: block;
      margin: 14px auto !important;
      float: none !important;
    }
  }
}
</style>
