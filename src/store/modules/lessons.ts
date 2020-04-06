import {Action, getModule, Module, Mutation, VuexModule} from 'vuex-module-decorators'

import store from '@/store'
import {getLessons, updateLesson} from "@/api/lessons";
import {ILesson} from "@/api/types";

export interface ILessonsState {
    selectedDate: Date
}

@Module({namespaced: true, dynamic: true, store, name: 'lessons'})
class Lessons extends VuexModule implements ILessonsState {

    public selectedDate: Date = new Date()

    @Mutation
    public SET_SELECTED_DATE(date: Date) {
        this.selectedDate = date
    }

    @Action({rawError: true})
    public async GetLessons(payload: { date: string | null, name: string | null }) {
        const data: any = await getLessons(payload)
        const result: ILesson[] = data.lessons
        return result
    }

    @Action({rawError: true})
    public async UpdateLesson(payload: { id: number, from: string, to: string, price: number, name: string, type: string, instructor_id: number }) {
        console.log('UPDATING LESSON', payload)
        const lesson = { lesson: payload }
        const data: any = await updateLesson(payload.id, lesson)
        const result: ILesson = data.lesson
        return result
    }

    @Action
    public SetSelectedDate(date: Date) {
        this.SET_SELECTED_DATE(date)
    }
}

export const LessonsModule = getModule(Lessons)
