<template>
  <div class="instructors-container">
    <el-row>
      <!--            <el-col :span="12">-->
      <!--                <el-button-->
      <!--                        type="success"-->
      <!--                        icon="el-icon-plus"-->
      <!--                        @click.native="handleNewClient"-->
      <!--                >-->
      <!--                    Nový klient-->
      <!--                </el-button>-->
      <!--            </el-col>-->
      <el-col :span="12">
        <el-input
          v-model="search"
          clearable
          :placeholder="$t('clients.search')"
          @input="handleSearch"
        />
      </el-col>
    </el-row>
    <el-table
      ref="attendanceTable"
      v-loading="loading"
      :data="clients"
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
      />

      <el-table-column
        prop="phone_2"
        label="Telefon 2"
        width="200"
      />
      <el-table-column
        label="Operácie"
        width="200"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            class="show-button"
            @click="handleShow(scope.row)"
          >
            Zobraziť
          </el-button>
          <el-button
            size="mini"
            class="edit-button"
            @click="handleEdit(scope.row)"
          >
            Upraviť
          </el-button>
          <!--                    <el-popconfirm-->
          <!--                            confirm-button-text="Áno"-->
          <!--                            cancel-button-text="Nie"-->
          <!--                            icon="el-icon-info"-->
          <!--                            icon-color="red"-->
          <!--                            title="Ste si istý, že ho chcete vymazať?"-->
          <!--                            @onConfirm="handleDelete(scope.row)"-->
          <!--                    >-->
          <!--                        <el-button-->
          <!--                                slot="reference"-->
          <!--                                size="mini"-->
          <!--                                type="danger"-->
          <!--                        >-->
          <!--                            Vymazať-->
          <!--                        </el-button>-->
          <!--                    </el-popconfirm>-->
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @current-change="handleCurrentChange"
      :current-page.sync="page"
      :page-size="pageSize"
      layout="total, pager, prev, next, jumper"
      :hide-on-single-page="true"
      :total="total"/>
    <clients-lessons
      :client="showClient"
      @discard="handleDiscardShow"/>
    <client-edit
      :client="editClient"
      :change-value="changeValue"
      @saved="handleSaved"/>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'

import {IClient, IInstructor} from '@/api/types'
import {Message} from 'element-ui'
import {ClientsModule} from "@/store/modules/clients";
import * as _ from "lodash";
import ClientsLessons from "@/components/ClientsLessons/index.vue";
// @ts-ignore
import ClientEdit from '@/components/ClientEdit/index'

@Component({
  name: 'Clients',
  components: {ClientsLessons, ClientEdit}
})
export default class extends Vue {

  private search: string | null = null

  private clients: IClient[] = [];

  private loading = false

  private pageSize = 25
  private page = 1
  private total = 0

  private showClient: IClient | null = null
  private editClient: IClient | null = null
  private changeValue = true

  mounted() {
    this.fetchClients()
  }

  private handleSearch = _.debounce((value) => {
    if (value === '') {
      value = null
    }
    console.log('Search', value)
    this.fetchClients(value)
  }, 500)

  private fetchClients(name: string | null = null) {
    this.loading = true
    ClientsModule.GetClients({
      name: name,
      limit: this.pageSize,
      offset: this.pageSize * (this.page - 1)
    }).then((result: { total: number, clients: IClient[] }) => {
      this.loading = false
      this.clients = result.clients
      this.total = result.total
    })
  }

  private handleDiscardShow() {
    this.showClient = null
  }

  private handleCurrentChange() {
    this.fetchClients(this.search)
  }

  private handleShow(client: IClient) {
    this.showClient = client
  }

  private handleEdit(client: IClient) {
    this.changeValue = !this.changeValue
    this.editClient = JSON.parse(JSON.stringify(client))
  }

  private handleSaved() {
    this.fetchClients()
    this.editClient = {} as IClient
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
