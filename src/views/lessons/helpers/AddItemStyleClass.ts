import GSTC, {Item} from "gantt-schedule-timeline-calendar"

export class AddItemStyleClass {
    private data: Item;
    private element: any;

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
    }

    private updateClass() {
        const hasClass = this.element.classList.contains('colored');
        if ((this.data as any).item.color && !hasClass) {
            this.element.classList.add('colored');
            this.element.classList.add((this.data as any).item.color);
        } else if (!(this.data as any).item.color && hasClass) {
            this.element.classList.remove('colored');
        }
    }
}