import {Item} from "gantt-schedule-timeline-calendar"
// @ts-ignore
import {clickCallback} from "@/views/lessons/index.vue";

export class ItemClickActionClass {
    private data: Item;

    constructor(element: any, data: Item) {
        console.log('Create click action', element, data)
        this.data = data;
        this.onClick = this.onClick.bind(this);
        element.addEventListener('click', this.onClick);
    }

    update(element: any, data: Item) {
        this.data = data;
    }

    destroy(element: any, data: Item) {
        element.removeEventListener('click', this.onClick);
    }

    onClick(event: Event) {
        clickCallback(this.data, event)
    }
}
