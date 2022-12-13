<template>
  <el-dialog
    v-if="client"
    :title="client.name"
    :visible.sync="dialogVisible"
    :v-loading="loading"
    width="80%"
    @closed="handleClosed"
  >
    <el-row :gutter="10">
      <el-col :span="8"><strong>Email</strong>: <a :href="'mailto:' + client.email">{{ client.email }}</a>
      </el-col>
      <el-col :span="8"><strong>Telefón</strong>: {{ client.phone }}</el-col>
      <el-col :span="8" v-if="client.phone_2"><strong>Telefón 2</strong>: {{ client.phone_2 }}</el-col>
    </el-row>

    <el-row :gutter="10">
      <el-col :span="24"><strong>Zaplatené</strong>: {{ paid }} €</el-col>
      <el-col :span="24"><strong>Nezaplatené</strong>: {{ unpaid }} €</el-col>
      <el-col :span="8" v-if="unpaid > 0">
        <el-button
          size="mini"
          type="success"
          icon="el-icon-money"
          class="show-button"
          @click="handlePay()"
        >
          Zaplatiť
        </el-button>
      </el-col>
    </el-row>

    <el-table
      v-if="lessons"
      ref="lessonsTable"
      :data="lessons"
      :row-class-name="tableRowClassName"
    >
      <el-table-column
        property="date"
        label="Dátum"
        width="160"
        :formatter="dateFormatter"
      />
      <el-table-column
        property="duration"
        label="Hodín"
        :formatter="durationFormatter"
      />
      <el-table-column
        property="persons_count"
        width="100"
        label="Osôb"
      />
      <el-table-column
        property="name"
        width="140"
        label="Meno"
      />
      <el-table-column
        property="instructor"
        label="Inštruktor"
        width="200"
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
        property="note"
        label="Poznámka"
        width="200"
      />
      <el-table-column
        property="price"
        label="Cena"
        fixed="right"
      />
    </el-table>
    <lesson-pay
      :lesson="payLesson"
      @paid="handlePaid"
      @discard="handleDiscardPay"/>
  </el-dialog>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import {IClient, ILesson} from '@/api/types'
import {formatNiceDateTime} from '@/utils'
import {LessonsModule} from '@/store/modules/lessons'
import {Message} from 'element-ui'
import LessonPay from "@/components/LessonPay/index.vue";

@Component({
  name: 'ClientsLessons',
  components: {LessonPay},
})
export default class extends Vue {
  @Prop({default: Object}) private client!: IClient

  private loading = false
  private lessons: ILesson[] = []
  private dialogVisible = false

  private payLesson: ILesson | null = null

  @Watch('client')
  private onClientChange(client: IClient) {
    console.log('Client change', client)
    if (!client) {
      return
    }
    this.dialogVisible = true
    this.fetchData()
  }

  get paid() {
    let paid = 0
    this.lessons.filter((lesson: ILesson) => lesson.status !== 'unpaid').forEach((lesson) => {
      paid += lesson.price
    })
    return Math.round(paid * 100) / 100
  }

  get unpaid() {
    let unpaid = 0
    this.lessons.filter((lesson: ILesson) => lesson.status === 'unpaid').forEach((lesson) => {
      unpaid += lesson.price
    })
    return Math.round(unpaid * 100) / 100
  }

  mounted() {

  }

  private handlePay() {
    this.payLesson = this.lessons[0]
  }

  private handlePaid() {
    this.payLesson = null
    this.dialogVisible = true
    this.fetchData()
  }

  private handleDiscardPay() {
    this.payLesson = null
    this.dialogVisible = true
    this.fetchData()
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
    LessonsModule.GetLessonsByClientId({client: this.client.id}).then((values) => {
      this.loading = false
      this.lessons = values;
    })
  }

  private tableRowClassName(payload: { row: ILesson, rowIndex: number }) {
    if (payload.row.status === 'unpaid') {
      return 'warning-row';
    }
    return 'success-row';
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

::v-deep .warning-row {
  background: #F8DFE5;
}

::v-deep .success-row {
  background: #f0f9eb;
}

</style>
