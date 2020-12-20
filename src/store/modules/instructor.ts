import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IInstructor} from "@/api/types";
import {createInstructor, deleteInstructor, getInstructors, updateInstructor} from "@/api/instructors";


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

    @Action({rawError: true})
    public async CreateInstructor(payload: { name: string, gender: string, teaching: string, email: string, phone: string, password: string }) {
        const instructor = {instructor: payload}
        const data: any = await createInstructor(instructor)
        const result: IInstructor = data.instructor

        return result
    }

    @Action({rawError: true})
    public async UpdateInstructor(payload: { id: number, name: string, gender: string, teaching: string, email: string, phone: string, password?: string }) {
        const instructor = {instructor: payload}
        const data: any = await updateInstructor(payload.id, instructor)
        const result: IInstructor = data.instructor

        return result
    }

    @Action({rawError: true})
    public async DeleteInstructor(payload: { id: number }) {
        const data: any = await deleteInstructor(payload.id)

        return data
    }


}

export const InstructorsModule = getModule(Instructors)
