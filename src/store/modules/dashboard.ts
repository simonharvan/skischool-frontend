import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'
import {getMe, login, logout} from '@/api/users'
import {getToken, removeToken, setToken} from '@/utils/cookies'
import router, {resetRouter} from '@/router'
import {PermissionModule} from './permission'
import {TagsViewModule} from './tags-view'
import store from '@/store'
import {getInstructorsStats, getStats} from "@/api/stats";
import {IInstructor, IInstructorsStats, IStats} from "@/api/types";
import any = jasmine.any;
import {formatDateTimeToBackend, formatDateToBackend} from "@/utils";

export interface IDashboardState {
}

@Module({dynamic: true, store, name: 'dashboard'})
class Dashboard extends VuexModule implements IDashboardState {

  public dates: Date[] = []
  public stats: IStats | null = null
  public instructorStats: IInstructorsStats[] | null = null

  constructor(args: any) {
    super(args);
    let monthAgo = new Date()
    let now = new Date()
    monthAgo.setTime(monthAgo.getTime() - 3600 * 1000 * 24 * 30);
    this.dates.push(monthAgo, now)
  }

  @Mutation
  private SET_STATS_DATE(dates: Date[]) {
    dates[1].setHours(23)
    dates[1].setMinutes(59)
    this.dates = dates
  }

  @Mutation
  private SET_STATS(stats: IStats) {
    this.stats = stats
  }

  @Mutation
  private SET_INSTRUCTOR_STATS(stats: IInstructorsStats[]) {
    this.instructorStats = stats
  }

  @Action({rawError: true})
  public async SetDates(dates: Date[]) {
    this.context.commit('SET_STATS_DATE', dates)

    await this.GetStats()
    await this.GetInstructorsStats()
  }

  @Action({rawError: true})
  public async GetStats() {
    const data: any = await getStats({
      from: formatDateTimeToBackend(this.dates[0]),
      to: formatDateTimeToBackend(this.dates[1])
    })

    this.context.commit('SET_STATS', data.stats)

    return data.stats
  }

  @Action({rawError: true})
  public async GetInstructorsStats() {
    const data: any = await getInstructorsStats({
      from: formatDateTimeToBackend(this.dates[0]),
      to: formatDateTimeToBackend(this.dates[1])
    })
    this.context.commit('SET_INSTRUCTOR_STATS', data.stats)
    return data.stats
  }
}

export const DashboardModule = getModule(Dashboard)
