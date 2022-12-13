import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IPayout} from "@/api/types";
import {getPayouts, sendPayout} from "@/api/payout";
import {formatDateToBackend} from "@/utils";


export interface IClientsState {

}

@Module({dynamic: true, store, name: 'payouts'})
class Payouts extends VuexModule implements IClientsState {

  public payouts: IPayout[] = []
  public dates: Date[] = []

  public includePaid: boolean = false

  constructor(args: any) {
    super(args);
    let monthAgo = new Date()
    let now = new Date()
    monthAgo.setTime(monthAgo.getTime() - 3600 * 1000 * 24 * 30);
    this.dates.push(monthAgo, now)
  }

  @Mutation
  private SET_DATES(dates: Date[]) {
    dates[0].setHours(3)
    dates[1].setHours(3)
    this.dates = dates
  }


  @Mutation
  public SET_PAYOUTS(payouts: IPayout[]) {
    this.payouts = payouts
  }

  @Mutation
  public SET_INCLUDE_PAID(paid: boolean) {
    this.includePaid = paid
  }

  @Action({rawError: true})
  public async SetDates(dates: Date[]) {
    this.context.commit('SET_DATES', dates)

    await this.GetPayouts()
  }

  @Action({rawError: true})
  public async GetPayouts() {

    let payload = {
      includePaid: this.includePaid,
      from: formatDateToBackend(this.dates[0]),
      to: formatDateToBackend(this.dates[1])
    }

    const data: any = await getPayouts(payload)
    this.context.commit('SET_PAYOUTS', data.payouts)
    return data.payouts as IPayout[]
  }

  @Action({rawError: true})
  public async Payout(payload: { lesson_ids: number[] | null, amount: number, instructor_id: number }) {
    const payout = {payout: payload}
    const data: any = await sendPayout(payout)
    return data
  }

  @Action({rawError: true})
  public async ToggleIncludePaid() {
    this.context.commit('SET_INCLUDE_PAID', !this.includePaid)
    await this.GetPayouts()
  }
}

export const PayoutModule = getModule(Payouts)
