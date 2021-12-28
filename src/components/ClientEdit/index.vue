<template>
  <el-drawer
    ref="clientDrawer"
    :title="$t('client.title')"
    :visible.sync="drawer"
    direction="rtl"
    size="40%"
    custom-class="lesson-drawer"
    :before-close="handleClose"
  >
    <el-form :model="client">
      <el-row :gutter="20">
        <el-col>
          <el-input
            ref="name"
            v-model="client.name"
            :placeholder="$t('instructor.name')"
            name="name"
            type="text"
          />
        </el-col>
      </el-row>
      <el-row
        :gutter="20"
      >
        <el-col :span="24">
          <el-input
            v-model="client.email"
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
            v-model="client.phone"
            clearable
            :placeholder="$t('instructor.phone')"
          />
        </el-col>
      </el-row>
      <el-row
        :gutter="20"
      >
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
import {unset} from "lodash";

    @Component({
      name: 'ClientEdit'
    })
export default class extends Vue {
        @Prop({ default: Object }) private client!: IClient
        @Prop({ default: Boolean }) private changeValue!: boolean

        private drawer = false
        private loading = false

        private onClientChange(client: IClient) {
          this.drawer = true
        }

        @Watch('changeValue')
        private onChangeValue() {
          this.onClientChange(this.client)
        }

        mounted() {

        }

        private closeForm() {
          (this.$refs.clientDrawer as any).closeDrawer()
        }

        private handleClose(done: any) {
          done()
        }

        private handleSubmit() {
          this.loading = true
          let payload: any = {
            name: this.client.name,
            email: this.client.email,
            phone: this.client.phone,
            phone_2: this.client.phone_2
          }

          if (this.client.id >= 0) {
            payload.id = this.client.id
            ClientsModule.UpdateClient(payload).then(() => {
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

          // InstructorsModule.CreateInstructor(payload).then(() => {
          //   this.loading = false
          //   Message({
          //     message: this.$t('messages.successCreate').toString(),
          //     type: 'success',
          //     duration: 2 * 1000
          //   })
          //   this.$emit('saved')
          //   this.closeForm()
          // }).catch(() => {
          //   this.loading = false
          //   Message({
          //     message: this.$t('messages.genericError').toString(),
          //     type: 'error',
          //     duration: 2 * 1000
          //   })
          // })
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
