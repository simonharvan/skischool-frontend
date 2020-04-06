// @ts-ignore
import ItemMovement from "gantt-schedule-timeline-calendar/dist/ItemMovement.plugin.js"
// @ts-ignore
import Selection from "gantt-schedule-timeline-calendar/dist/Selection.plugin.js"

export const plugins = [
    ItemMovement({
        moveable: true,
        resizable: true,
        collisionDetection: true,
        ghostNode: false,
        // wait: 100,
        snapStart(time: number, diff: number, item: any) {
            const date = new Date(time + diff)
            if (date.getMinutes() > 15 && date.getMinutes() < 45) {
                date.setMinutes(30)
            } else if (date.getMinutes() > 45) {
                date.setMinutes(0)
                date.setHours(date.getHours() + 1)
            } else {
                date.setMinutes(0)
            }
            return date.getTime()
        },
        snapEnd(time: number, diff: number, item: any) {
            const date = new Date(time + diff)
            if (date.getMinutes() > 15 && date.getMinutes() < 45) {
                date.setMinutes(30)
            } else if (date.getMinutes() > 45) {
                date.setMinutes(0)
                date.setHours(date.getHours() + 1)
            } else {
                date.setMinutes(0)
            }
            return date.getTime()
        }
    }),
    Selection({
        items: false,
        rows: false,
        grid: true, // select only grid cells
        horizontal: true,
        vertical: false,
        canSelect(type: string, currentlySelecting: []) {
            if (type === 'chart-timeline-grid-row-block') {
                // check if there is any item that lives inside current cell
                let rowId = 1
                if (currentlySelecting.length > 0) {
                    // @ts-ignore
                    rowId = currentlySelecting[0].row.id
                }

                return currentlySelecting.filter((selected: any) => {
                    if (rowId !== selected.row.id) {
                        return false
                    }
                    for (const item of selected.row._internal.items) {
                        if (
                            (item.time.start >= selected.time.leftGlobal && item.time.start <= selected.time.rightGlobal) ||
                            (item.time.start <= selected.time.leftGlobal && item.time.end >= selected.time.rightGlobal)
                        ) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            return currentlySelecting;
        },
        selected(data: any, type: string) {
            console.log('SELECTED', data, type);
        },
    })
]

