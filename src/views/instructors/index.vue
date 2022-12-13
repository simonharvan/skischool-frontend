<template>
  <div class="instructors-container">
    <el-row class="controls">
      <el-button
        type="success"
        icon="el-icon-plus"
        @click.native="handleNewInstructor"
      >
        Nový inštruktor
      </el-button>
    </el-row>
    <el-table
      ref="attendanceTable"
      v-loading="loading"
      :data="instructors"
    >
      <el-table-column
        prop="name"
        label="Meno"
      />
      <el-table-column
        prop="email"
        label="Email"
        width="250"
      />
      <el-table-column
        prop="phone"
        label="Telefon"
        width="200"
        :formatter="formatPhone"
      />
      <el-table-column
        prop="gender"
        label="Pohlavie"
        width="140"
      >
        <template slot-scope="scope">
          <el-tag
            :type="scope.row.gender === 'female' ? 'info' : 'warning'"
            disable-transitions
          >
            {{ $t('instructor.' + scope.row.gender) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="teaching"
        label="SKI/SNB"
        width="140"
        :filters="[{text: 'Lyž', value: 'ski'}, {text: 'Snb', value: 'snb'}]"
        :filter-method="filterTeaching"
        filter-placement="bottom-end"
      >
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.teaching === 'ski'"
            type="primary"
            disable-transitions
          >
            {{ $t('instructor.' +scope.row.teaching) }}
          </el-tag>
          <el-tag
            v-else-if="scope.row.teaching === 'snb'"
            type="success"
            disable-transitions
          >
            {{ $t('instructor.' +scope.row.teaching) }}
          </el-tag>
          <el-tag
            v-else
            type="danger"
            disable-transitions
          >
            {{ $t('instructor.' +scope.row.teaching) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Operácie"
        width="200"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            class="edit-button"
            @click="handleEdit(scope.row)"
          >
            Upraviť
          </el-button>
          <el-popconfirm
            confirm-button-text="Áno"
            cancel-button-text="Nie"
            icon="el-icon-info"
            icon-color="red"
            title="Ste si istý, že ho chcete vymazať?"
            @onConfirm="handleDelete(scope.row)"
          >
            <el-button
              slot="reference"
              size="mini"
              type="danger"
            >
              Vymazať
            </el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <instructor-edit
      :instructor="editInstructor"
      :change-value="changeValue"
      @saved="handleSaved"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { InstructorsModule } from '@/store/modules/instructor'
import { IInstructor } from '@/api/types'
import { Message } from 'element-ui'
// @ts-ignore
import InstructorEdit from '@/components/InstructorEdit/index'

@Component({
  name: 'Instructors',
  components: {
    InstructorEdit
  }
})
export default class extends Vue {
  private editInstructor: IInstructor = {} as IInstructor
  private changeValue: boolean = false

  private loading = false

  mounted() {
    this.fetchInstructors()
  }

  get instructors() {
    return InstructorsModule.instructors.filter((inst) => {
      return inst.email !== 'docasny@instruktor.sk'
    })
  }

  private fetchInstructors() {
    this.loading = true
    InstructorsModule.GetInstructors({
      name: null,
      gender: null,
      teaching: null,
      date: null
    }).finally(() => {
      this.loading = false
    })
  }

  private filterTeaching(value: string, row: any) {
    if (row.teaching === 'both') {
      return true
    }
    return row.teaching === value
  }

  formatPhone(row: any, _column: any) {
    return row.phone.substr(0, 4) + " " +
      row.phone.substr(4, 3) + " " +
      row.phone.substr(7, 3) + " " +
      row.phone.substr(10, 10)
  }

  handleNewInstructor() {
    this.editInstructor = {} as IInstructor
    this.editInstructor.id = -1
    this.changeValue = !this.changeValue
  }

  handleEdit(instructor: IInstructor) {
    this.changeValue = !this.changeValue
    this.editInstructor = JSON.parse(JSON.stringify(instructor))
  }

  handleDelete(instructor: IInstructor) {
    InstructorsModule.DeleteInstructor({ id: instructor.id }).then(() => {
      this.fetchInstructors()
      Message({
        message: this.$t('messages.successDelete').toString(),
        type: 'success',
        duration: 2 * 1000
      })
    }).catch(() => {
      Message({
        message: this.$t('messages.genericError').toString(),
        type: 'success',
        duration: 2 * 1000
      })
    })
  }

  handleSaved() {
    this.fetchInstructors()
    this.editInstructor = {} as IInstructor
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
