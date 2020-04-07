<template>
    <div class="lessons-container">
        <el-row class="controls">
            <el-col :span="10">
                <el-button-group>
                    <el-button
                            type="primary"
                            icon="el-icon-arrow-left"
                            @click.native="handleYesterday"
                    >
                        {{ $t('lessons.yesterday') }}
                    </el-button>
                    <el-button
                            type="primary"
                            @click.native="handleToday"
                    >
                        {{ $t('lessons.today') }}
                    </el-button>
                    <el-button
                            type="primary"
                            @click.native="handleTommorow"
                    >
                        {{ $t('lessons.tomorrow') }} <i class="el-icon-arrow-right"/>
                    </el-button>
                </el-button-group>
            </el-col>
            <el-col :span="2">
                <el-button
                        type="success"
                        icon="el-icon-plus"
                        @click.native="handleNewLesson"/>
            </el-col>
        </el-row>
        <gantt-scheduler
                ref="scheduler"
                :config="config"
                @state="handleOnState"
        />
        <lesson-edit :lesson="editLesson" @saved="handleSaved"/>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator'
    import GanttScheduler from 'vue-gantt-schedule-timeline-calendar'
    import {LessonsModule} from '@/store/modules/lessons'
    import {IInstructor, ILesson} from '@/api/types'
    import {InstructorsModule} from '@/store/modules/instructor'
    import {ResizingItemClass} from '@/views/lessons/helpers/ResizingItemClass'
    import {AddItemStyleClass} from '@/views/lessons/helpers/AddItemStyleClass'
    import {formatDateTimeToBackend, formatDateTimeToBackendWithOffset, formatDateToBackend} from '@/utils'
    import {Message} from 'element-ui'
    import {ItemClickActionClass, setListener} from '@/views/lessons/helpers/ItemClickActionClass'
    import {plugins} from '@/views/lessons/helpers/Plugins'
    import LessonEdit from '@/components/LessonEdit/index'

    @Component({
        name: 'Lessons',
        components: {
            GanttScheduler,
            LessonEdit
        }
    })

    export default class extends Vue {
        private currentRole = 'admin-dashboard'
        private subs: any[] = []
        private state: any;

        private lessons: ILesson[] = [];
        private instructors: IInstructor[] = [];

        private colors = [
            'green', 'yellow', 'red', 'blue',
            'purple', 'burgundy', 'greenish', 'light-green'
        ]
        private itemTimeout: NodeJS.Timeout | undefined;

        private editLesson: ILesson = {} as ILesson

        private handleOnState(state: any) {
            this.state = state
            console.log('handleOnState()', state)
            this.subs.push(
                state.subscribe('config.chart.items.:id',
                    (value: any, eventInfo: any) => {
                        if (this.itemTimeout) {
                            clearTimeout(this.itemTimeout)
                        }
                        this.itemTimeout = setTimeout(() => {
                            this.updateLesson(value, eventInfo)
                        }, 500)
                    }
                )
            )
            setListener(this.handleClickLesson)
        }

        get selectedDate() {
            return LessonsModule.selectedDate
        }

        get startOfSelectedDate() {
            const result = new Date(this.selectedDate.getTime())
            result.setHours(8)
            result.setMinutes(0)
            result.setSeconds(0)
            return result
        }

        get endOfSelectedDate() {
            const result = new Date(this.selectedDate.getTime())
            result.setHours(17)
            result.setMinutes(0)
            result.setSeconds(0)
            return result
        }

        get config() {
            let result: any = {
                height: 300,
                plugins: plugins,
                list: {
                    toggle: {
                        display: false
                    },
                    columns: {
                        data: {
                            label: {
                                id: 'label',
                                data: 'label',
                                width: 200,
                                header: {
                                    content: 'Name'
                                }
                            }
                        }
                    },
                    rows: {}
                },
                chart: {
                    items: {}
                },
                actions: {
                    'chart-timeline-items-row-item': [ResizingItemClass, AddItemStyleClass, ItemClickActionClass]
                }
            }
            this.instructors.forEach((instructor: IInstructor) => {
                result.list.rows[instructor.id] = {
                    id: instructor.id,
                    label: instructor.name
                }
            })

            this.lessons.forEach((lesson: ILesson) => {
                if (lesson.instructor && lesson.client) {
                    result.chart.items[lesson.id] = {
                        id: lesson.id,
                        rowId: lesson.instructor.id,
                        label: lesson.name + ' (' + lesson.client.phone + ')',
                        color: this.colors[lesson.instructor.id % 8],
                        data: lesson,
                        time: {
                            start: new Date(lesson.from).getTime(),
                            end: new Date(lesson.to).getTime()
                        }
                    }
                }
            })
            result.chart.time = {
                from: this.startOfSelectedDate.getTime(),
                to: this.endOfSelectedDate.getTime(),
                zoom: 15.2,
                period: 'hour',
                dates: {},
                maxWidth: {}
            }
            console.log('Config', result)
            return result
        }

        mounted() {
            this.fetchData()
        }

        beforeDestroy() {
            this.subs.forEach(unsub => unsub())
        }

        private handleYesterday() {
            const date = new Date()
            date.setDate(this.selectedDate.getDate() - 1)
            LessonsModule.SetSelectedDate(date)
        }

        private handleTommorow() {
            const date = new Date()
            date.setDate(this.selectedDate.getDate() + 1)
            LessonsModule.SetSelectedDate(date)
        }

        private handleToday() {
            const date = new Date()
            LessonsModule.SetSelectedDate(date)
        }

        private handleNewLesson() {
            const selected: string[] = this.state.get('config.plugin.selection').selected['chart-timeline-grid-row-blocks']

            const date = new Date()
            console.log(date)

            let from = formatDateTimeToBackend(date)
            date.setHours(date.getHours() + 1)
            let to = formatDateTimeToBackend(date)
            let rowId = -1
            if (selected.length > 0) {
                const lastIndex = selected.length - 1
                const startIndexOfDate = selected[0].indexOf(':') + 1
                const fromDate = new Date(selected[0].substr(startIndexOfDate))
                const toDate = new Date(selected[lastIndex].substr(startIndexOfDate))
                fromDate.setHours(fromDate.getHours())
                toDate.setHours(toDate.getHours() + 1)

                from = formatDateTimeToBackendWithOffset(fromDate)
                to = formatDateTimeToBackendWithOffset(toDate)
                rowId = Number.parseInt(selected[0].substr(0, selected[0].indexOf(':')))

            }
            this.editLesson = {
                id: -1,
                name: '',
                type: 'ski',
                price: 20,
                from: from,
                to: to,
                instructor: {
                    id: rowId
                }
            } as ILesson
            console.log(this.editLesson)
        }

        private handleClickLesson(data: any, event: Event) {
            console.log('Click lesson', data)
            this.editLesson = data.item.data
        }

        private handleSaved() {
            this.fetchLessons()
        }

        @Watch('selectedDate')
        private onSelectedDate() {
            this.fetchLessons()
        }

        private async fetchData() {
            this.fetchLessons()
            this.instructors = await InstructorsModule.GetInstructors({name: null, gender: null, teaching: null})
        }

        private async fetchLessons() {
            const date = formatDateToBackend(this.selectedDate)
            this.lessons = await LessonsModule.GetLessons({date: date, name: null})
        }

        private async updateLesson(value: any, eventInfo: any) {
            if (eventInfo.path.update === undefined) {
                return
            }

            if (!eventInfo.path.update.endsWith('time') && !eventInfo.path.update.endsWith('rowId')) {
                return
            }

            const lesson = this.lessons.find((lesson: ILesson) => {
                if (lesson.id == value.id) {
                    return lesson
                }
            })

            if (!lesson || !value || !lesson.instructor) {
                return
            }

            if (new Date(lesson.from).getTime() === value.time.start &&
                new Date(lesson.to).getTime() === value.time.end &&
                lesson.instructor.id === value.rowId) {
                return
            }

            const from = formatDateTimeToBackendWithOffset(new Date(value.time.start))
            const to = formatDateTimeToBackendWithOffset(new Date(value.time.end))
            console.log(value, from, to)
            const payload = {
                id: lesson.id,
                from: from,
                to: to,
                price: lesson.price,
                name: lesson.name,
                type: lesson.type,
                instructor_id: value.rowId
            }

            console.log('UPDATE LESSON', payload, from, to)
            LessonsModule.UpdateLesson(payload).then((value: ILesson) => {
                Message({
                    message: this.$t('messages.successUpdate').toString(),
                    type: 'success',
                    duration: 2 * 1000
                })
            })
        }
    }



</script>
<style lang="scss" scoped>
    .lessons-container {
        padding: 32px;

        .controls {
            margin-bottom: 20px;
        }

        ::v-deep .gantt-schedule-timeline-calendar__list-column-header,
        ::v-deep .gantt-schedule-timeline-calendar__chart-calendar {
            background: #FFF;
        }

        ::v-deep .gantt-schedule-timeline-calendar__chart-timeline-items-row-item {
            &.colored.green {
                background: #17A46A;
            }

            &.colored.yellow {
                background: #FED330;
                color: #000000;
            }

            &.colored.red {
                background: #C30934;
            }

            &.colored.blue {
                background: #158ABE;
            }

            &.colored.purple {
                background: #595DF1;
            }

            &.colored.burgundy {
                background: #64073D;
            }

            &.colored.greenish {
                background: #158C8F;
            }

            &.colored.light-green {
                background: #94C23E;
            }
        }
    }
</style>
