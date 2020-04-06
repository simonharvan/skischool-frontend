import {Action, getModule, Module, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IInstructor} from "@/api/types";
import {getInstructors} from "@/api/instructors";

export interface IInstructorsState {

}

@Module({dynamic: true, store, name: 'instructor'})
class Instructors extends VuexModule implements IInstructorsState {


    @Action({rawError: true})
    public async GetInstructors(payload: { name: string | null, gender: string | null, teaching: string | null }) {
        const data: any = await getInstructors(payload)
        const result: IInstructor[] = data.instructors
        return result
    }
}

export const InstructorsModule = getModule(Instructors)
