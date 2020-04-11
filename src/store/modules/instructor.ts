import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IInstructor} from "@/api/types";
import {getInstructors} from "@/api/instructors";


export interface IInstructorsState {
    instructors: IInstructor[]
}

@Module({dynamic: true, store, name: 'instructor'})
class Instructors extends VuexModule implements IInstructorsState {

    public instructors: IInstructor[] = [];

    @Mutation
    private SET_INSTRUCTORS(instructors: []) {
        this.instructors = instructors
    }

    @Action({rawError: true})
    public async GetInstructors(payload: { name: string | null, gender: string | null, teaching: string | null, date: string | null }) {
        const data: any = await getInstructors(payload)
        const result: IInstructor[] = data.instructors
        if (!payload.name && !payload.gender && !payload.teaching && !payload.date) {
            this.context.commit('SET_INSTRUCTORS', result)
        }
        return result
    }


}

export const InstructorsModule = getModule(Instructors)
