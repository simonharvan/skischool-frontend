<template>
  <el-drawer
    ref="lessonDrawer"
    :title="$t('lessons.title')"
    :visible.sync="drawer"
    direction="rtl"
    size="40%"
    custom-class="lesson-drawer"
    :before-close="handleClose"
  >
    <el-form :model="lesson">
      <el-row :gutter="20">
        <el-col>
          <el-input
            ref="name"
            v-model="lesson.name"
            :placeholder="$t('lessons.name')"
            name="name"
            type="text"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-select
            ref="type"
            v-model="lesson.type"
            :placeholder="$t('lessons.type')"
            name="type"
            filterable
          >
            <el-option
              key="ski"
              value="ski"
              :label="$t('lessons.ski')"
            />

            <el-option
              key="snb"
              value="snb"
              :label="$t('lessons.snb')"
            />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input-number
            v-model="lesson.price"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-time-select
            v-model="startTime"
            :placeholder="$t('lessons.startTime')"
            :picker-options="{
              start: '08:30',
              step: '00:30',
              end: '15:30'
            }"
          />
        </el-col>
        <el-col :span="12">
          <el-time-select
            v-model="endTime"
            :placeholder="$t('lessons.endTime')"
            :picker-options="{
              start: '08:30',
              step: '00:30',
              end: '16:00',
              minTime: startTime
            }"
          />
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('lessons.instructor')">
            <el-select
              v-model="instructor.id"
              filterable
              reserve-keyword
              :placeholder="$t('lessons.search')"
            >
              <el-option
                v-for="item in instructors"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('lessons.client')">
            <el-select
              v-model="client.id"
              filterable
              remote
              reserve-keyword
              clearable
              allow-create
              :placeholder="$t('lessons.search')"
              :remote-method="handleSearchClients"
              :loading="loadingClients"
              @change="handleChangedClient"
            >
              <el-option
                v-for="item in clients"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <span style="float: left">{{ item.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ item.phone }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-input
            v-model="client.email"
            clearable
            :placeholder="$t('lessons.email')"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-input
            v-model="client.phone"
            clearable
            :placeholder="$t('lessons.phone')"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-input
            v-model="client.phone_2"
            clearable
            :placeholder="$t('lessons.phone2')"
          />
        </el-col>
      </el-row>

      <el-row
        :gutter="20"
        class="bottom"
      >
        <el-col :span="12">
          <el-button @click="closeForm">
            Cancel
          </el-button>
        </el-col>
        <el-col :span="12">
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ loading ?
              $t('lessons.submitting')
              : $t('lessons.submit') }}
          </el-button>
        </el-col>
      </el-row>
    </el-form>
  </el-drawer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { IClient, IInstructor, ILesson } from '@/api/types'
import { formatDateTimeToBackendWithOffset, formatTimeToBackend } from '@/utils'
import { InstructorsModule } from '@/store/modules/instructor'
import { ClientsModule } from '@/store/modules/clients'
import { LessonsModule } from '@/store/modules/lessons'
import { Message } from 'element-ui'

    @Component({
      name: 'LessonEdit'
    })
export default class extends Vue {
        @Prop({ default: Object }) private lesson!: ILesson

        private drawer = false
        private loading = false
        private loadingClients = false
        private instructor = {} as IInstructor
        private clients: IClient[] = []
        private client = {} as IClient

        get instructors() {
          return InstructorsModule.instructors
        }

        get startTime() {
          console.log(this.lesson)
          return formatTimeToBackend(new Date(this.lesson.from))
        }

        get endTime() {
          return formatTimeToBackend(new Date(this.lesson.to))
        }

        set startTime(value: string) {
          console.log(this.lesson)
          const date = new Date(this.lesson.from)
          date.setHours(Number.parseInt(value.substr(0, 2)))
          date.setMinutes(Number.parseInt(value.substr(3, 2)))
          this.lesson.from = formatDateTimeToBackendWithOffset(date)
        }

        set endTime(value: string) {
          const date = new Date(this.lesson.to)
          date.setHours(Number.parseInt(value.substr(0, 2)))
          date.setMinutes(Number.parseInt(value.substr(3, 2)))
          this.lesson.to = formatDateTimeToBackendWithOffset(date)
        }

        @Watch('lesson')
        private onLessonChange(value: ILesson) {
          this.drawer = true

          let some = this.instructors.find((instructor: IInstructor) => {
            if (value.instructor && instructor.id === value.instructor.id) {
              return instructor
            }
          })
          if (some) {
            this.instructor = some
          }
        }

        mounted() {

        }

        private handleSearchClients(query: string) {
          this.loadingClients = true
          ClientsModule.GetClients({ name: query }).then((value: IClient[]) => {
            this.clients = value
            this.loadingClients = false
          })
        }

        private handleChangedClient(value: any) {
          let some = this.clients.find((client) => client.id === value)
          if (some) {
            this.client = some
          } else {
            this.client.name = value
          }
        }

        private closeForm() {
          (this.$refs.lessonDrawer as any).closeDrawer()
        }

        private handleClose(done: any) {
          this.client = {} as IClient
          this.instructor = {} as IInstructor
          done()
        }

        private handleSubmit() {
          this.loading = true
          let payload: any = {
            from: this.lesson.from,
            to: this.lesson.to,
            price: this.lesson.price,
            name: this.lesson.name,
            type: this.lesson.type,
            instructor_id: this.instructor.id
          }

          if (typeof this.client.id === 'number') {
            payload.client = {} as any
            payload.client.id = this.client.id
          } else {
            payload.client = {} as any
            payload.client.name = this.client.name
            payload.client.email = this.client.email
            payload.client.phone = this.client.phone
            payload.client.phone_2 = this.client.phone_2
          }
          LessonsModule.CreateLesson(payload).then(() => {
            this.loading = false
            Message({
              message: this.$t('messages.successCreate').toString(),
              type: 'success',
              duration: 2 * 1000
            })
          }).catch(() => {
            this.loading = false
            this.closeForm()
          })
        }
}
</script>
<style lang="scss">

</style>
<style lang="scss" scoped>
    ::v-deep .el-drawer__body {
        padding: 20px;
    }

    ::v-deep .el-drawer__header > :first-child {
        outline: 0;
    }

    ::v-deep .el-form-item {
        margin-bottom: 0;
    }

    .lesson-drawer {
        .el-date-editor.el-input, .el-select, .el-input-number--medium {
            width: 100%;
        }

        .el-row {
            padding-top: 5px;
            padding-bottom: 5px;
        }

        .bottom {
            position: fixed;
            bottom: 0;
            display: flex;
            width: calc(40% - 20px);
            padding-bottom: 20px;

            .el-col {
                flex-grow: 1;

                .el-button {
                    width: 100%;
                }
            }
        }
    }
</style>
