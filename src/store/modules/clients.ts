import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IClient, IInstructor} from "@/api/types";
import {getInstructors} from "@/api/instructors";
import {getClients} from "@/api/clients";


export interface IClientsState {

}

@Module({dynamic: true, store, name: 'clients'})
class Clients extends VuexModule implements IClientsState {

    @Action({rawError: true})
    public async GetClients(payload: { name: string | null, limit: number | null, offset: number | null }) {
        const data: any = await getClients(payload)
        const result = {
            total: data.clientsCount,
            clients: data.clients
        }

        return result
    }

}

export const ClientsModule = getModule(Clients)
