<template>
  <el-drawer
    ref="instructorsDrawer"
    :title="$t('instructor.title')"
    :visible.sync="drawer"
    direction="rtl"
    size="40%"
    custom-class="lesson-drawer"
    :before-close="handleClose"
  >
    <el-form :model="instructor">
      <el-row :gutter="20">
        <el-col>
          <el-input
            ref="name"
            v-model="instructor.name"
            :placeholder="$t('instructor.name')"
            name="name"
            type="text"
          />
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-select
            ref="type"
            v-model="instructor.gender"
            :placeholder="$t('instructor.gender')"
            name="type"
          >
            <el-option
              key="female"
              value="female"
              :label="$t('instructor.female')"
            />
            <el-option
              key="male"
              value="male"
              :label="$t('instructor.male')"
            />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-select
            ref="type"
            v-model="instructor.teaching"
            :placeholder="$t('instructor.teaching')"
            name="type"
          >
            <el-option
              key="ski"
              value="ski"
              :label="$t('instructor.ski')"
            />

            <el-option
              key="snb"
              value="snb"
              :label="$t('instructor.snb')"
            />

            <el-option
              key="both"
              value="both"
              :label="$t('instructor.both')"
            />
          </el-select>
        </el-col>
      </el-row>
      <el-row
        :gutter="20"
      >
        <el-col :span="24">
          <el-input
            v-model="instructor.email"
            clearable
            :placeholder="$t('instructor.email')"
          />
        </el-col>
      </el-row>
      <el-row
        :gutter="20"
      >
        <el-col :span="24">
          <el-input
            v-model="instructor.phone"
            clearable
            :placeholder="$t('instructor.phone')"
          />
        </el-col>
      </el-row>

      <el-divider />

      <el-row
        :gutter="20"
      >
        <el-col :span="24">
          <el-input
            v-model="password"
            clearable
            name="password"
            show-password
            minlength="6"
            :placeholder="$t('instructor.password')"
          />
        </el-col>
        <el-col :span="24">
          <small>Heslo do aplikácie - Ak nechcete menit heslo, tak ho nezadavajte.</small>
        </el-col>
      </el-row>

      <el-row
        :gutter="20"
        class="bottom"
      >
        <el-col :span="10">
          <el-button @click="closeForm">
            {{ $t('cancel') }}
          </el-button>
        </el-col>

        <el-col :span="10">
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
import { SettingsModule } from '@/store/modules/settings'

    @Component({
      name: 'InstructorEdit'
    })
export default class extends Vue {
        @Prop({ default: Object }) private instructor!: IInstructor
        @Prop({ default: Boolean }) private changeValue!: boolean

        private drawer = false
        private loading = false
        private password = ''

        private onInstructorChange(instructor: IInstructor) {
          this.drawer = true
        }

        @Watch('changeValue')
        private onChangeValue() {
          this.onInstructorChange(this.instructor)
        }

        mounted() {

        }

        private closeForm() {
          (this.$refs.instructorsDrawer as any).closeDrawer()
        }

        private handleClose(done: any) {
          this.password = ''
          done()
        }

        private handleSubmit() {
          this.loading = true
          let payload: any = {
            name: this.instructor.name,
            gender: this.instructor.gender,
            teaching: this.instructor.teaching,
            email: this.instructor.email,
            phone: this.instructor.phone
          }

          if (this.password !== '') {
            payload.password = this.password
          }

          if (this.instructor.id >= 0) {
            payload.id = this.instructor.id
            InstructorsModule.UpdateInstructor(payload).then(() => {
              this.loading = false
              Message({
                message: this.$t('messages.successUpdate').toString(),
                type: 'success',
                duration: 2 * 1000
              })
              this.$emit('saved')
              this.closeForm()
            }).catch(() => {
              this.loading = false
              Message({
                message: this.$t('messages.genericError').toString(),
                type: 'error',
                duration: 2 * 1000
              })
            })

            return
          }

          InstructorsModule.CreateInstructor(payload).then(() => {
            this.loading = false
            Message({
              message: this.$t('messages.successCreate').toString(),
              type: 'success',
              duration: 2 * 1000
            })
            this.$emit('saved')
            this.closeForm()
          }).catch(() => {
            this.loading = false
            Message({
              message: this.$t('messages.genericError').toString(),
              type: 'error',
              duration: 2 * 1000
            })
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

        .pay-bottom {
            position: fixed;
            bottom: 60px;
            width: calc(40% - 20px);

            .el-button {
                width: 100%;
            }
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

                    &.el-button--medium {
                        padding: 10px;
                    }
                }
            }
        }
    }
</style>
