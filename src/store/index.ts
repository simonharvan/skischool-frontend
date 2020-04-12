import Vue from 'vue'
import Vuex from 'vuex'
import {IAppState} from './modules/app'
import {IUserState} from './modules/user'
import {ILessonsState} from './modules/lessons'
import {IInstructorsState} from './modules/instructor'
import {ITagsViewState} from './modules/tags-view'
import {IErrorLogState} from './modules/error-log'
import {IPermissionState} from './modules/permission'
import {ISettingsState} from './modules/settings'
import {IClientsState} from "@/store/modules/clients";
import {IAttendanceState} from "@/store/modules/attendance";
import {IStats} from "@/api/types";

Vue.use(Vuex)

export interface IRootState {
    app: IAppState
    user: IUserState
    tagsView: ITagsViewState
    errorLog: IErrorLogState
    permission: IPermissionState
    settings: ISettingsState
    lessons: ILessonsState
    instructors: IInstructorsState
    clients: IClientsState
    attendance: IAttendanceState
    dashboard: IStats
}

// Declare empty store first, dynamically register all modules later.
export default new Vuex.Store<IRootState>({})
