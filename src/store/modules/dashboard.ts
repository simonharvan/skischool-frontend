import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { getMe, login, logout } from '@/api/users'
import { getToken, removeToken, setToken } from '@/utils/cookies'
import router, { resetRouter } from '@/router'
import { PermissionModule } from './permission'
import { TagsViewModule } from './tags-view'
import store from '@/store'
import {getInstructorsStats, getStats} from "@/api/stats";
import {IInstructorsStats, IStats} from "@/api/types";

export interface IDashboardState {
}

@Module({ dynamic: true, store, name: 'dashboard' })
class Dashboard extends VuexModule implements IDashboardState {

  @Action
  public async GetStats() {

    const data: any = await getStats()

    const stats: IStats = data.stats
    return stats
  }

  @Action
  public async GetInstructorsStats() {
    const data: any = await getInstructorsStats()

    const stats: IInstructorsStats[] = data.stats
    return stats
  }
}

export const DashboardModule = getModule(Dashboard)
