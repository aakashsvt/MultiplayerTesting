export default class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = {
            x: null,
            y: null
        };

        this.handleMouseMove = this.handleMouseMove.bind(this);

        this.canvas.addEventListener("mousemove", this.handleMouseMove);
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();

        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    getMousePosition() {
        return this.mouse;
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    }
}
