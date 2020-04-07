import {Item} from "gantt-schedule-timeline-calendar"


let listener: any;

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
        if (listener) {
            listener(this.data, event)
        }
    }


}

export const setListener = function(listr: any) {
    listener = listr
}
