import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {IAttendance, IInstructor} from "@/api/types";
import {getInstructors} from "@/api/instructors";
import {bulkCreateAttendance, bulkDeleteAttendance, getAttendance} from "@/api/attendance";


export interface IAttendanceState {
    selectedDate: Date
}

@Module({dynamic: true, store, name: 'attendance'})
class Attendance extends VuexModule implements IAttendanceState {

    public selectedDate: Date = new Date()

    @Mutation
    public SET_SELECTED_DATE(date: Date) {
        this.selectedDate = date
    }

    @Action({rawError: true})
    public async GetAttendance(payload: { instructor: number | null, date: string | null }) {

        const data: any = await getAttendance(payload)
        const result: IAttendance[] = data.attendances
        return result
    }

    @Action({rawError: true})
    public async BulkCreate(payload: { instructor_ids: number[], from: string, to: string}) {
        const attendances = { attendances: payload }
        const data: any = await bulkCreateAttendance(attendances)
        const result: IAttendance[] = data.attendances
        return result
    }

    @Action({rawError: true})
    public async BulkDelete(payload: { instructor_ids: number[], date: string }) {
        const attendances = { attendances: payload }
        const data: any = await bulkDeleteAttendance(attendances)
        return data
    }

    @Action
    public SetSelectedDate(date: Date) {
        this.SET_SELECTED_DATE(date)
    }

}

export const AttendanceModule = getModule(Attendance)
