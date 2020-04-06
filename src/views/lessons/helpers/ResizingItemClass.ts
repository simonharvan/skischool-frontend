export class ResizingItemClass {
    update(element: any, data: any) {
        const hasClass = element.classList.contains('resizing');
        if (data.item.isResizing && !hasClass) {
            element.classList.add('resizing');
        } else if (!data.item.isResizing && hasClass) {
            element.classList.remove('resizing');
        }
    }
}