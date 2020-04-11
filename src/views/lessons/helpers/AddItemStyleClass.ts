import {Item} from "gantt-schedule-timeline-calendar"

export class AddItemStyleClass {
    private data: Item;
    private element: any;
    private colors = [
        'green', 'yellow', 'red', 'blue',
        'purple', 'burgundy', 'greenish', 'light-green'
    ]

    constructor(element: any, data: Item) {
        this.data = data;
        this.element = element;
        this.updateClass();
    }

    update(element: any, data: Item) {
        this.data = data;
        this.element = element;
        this.updateClass();
    }

    destroy(element: any, data: Item) {
        element.classList.remove('colored');
        element.classList.remove(this.colors[(this.data as any).item.data.type === 'ski' ? 3 : 5])
    }

    private updateClass() {
        this.element.classList.remove(this.colors[3])
        this.element.classList.remove(this.colors[5])

        this.element.classList.add('colored')
        this.element.classList.add(this.colors[(this.data as any).item.data.type === 'ski' ? 3 : 5])

        if ((this.data as any).item.data.status === 'paid') {
            this.element.classList.add('paid')
        } else {
            this.element.classList.remove('paid');
        }
    }
}