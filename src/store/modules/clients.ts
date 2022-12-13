import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IClient, IInstructor} from "@/api/types";
import {getInstructors, updateInstructor} from "@/api/instructors";
import {getClients, updateClient} from "@/api/clients";


export interface IClientsState {

}

@Module({dynamic: true, store, name: 'clients'})
class Clients extends VuexModule implements IClientsState {

    @Action({rawError: true})
    public async GetClients(payload: { query: string | null, limit: number | null, offset: number | null }) {
        const data: any = await getClients(payload)
        const result = {
            total: data.clientsCount,
            clients: data.clients
        }

        return result
    }

  @Action({rawError: true})
  public async UpdateClient(payload: { id: number, name: string, email?: string, phone?: string, phone_2?: string}) {
    const client = {client: payload}
    const data: any = await updateClient(payload.id, client)
    const result: IClient = data.client

    return result
  }

}

export const ClientsModule = getModule(Clients)
