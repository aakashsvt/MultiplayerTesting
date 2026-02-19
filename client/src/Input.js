export default class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = {
            x: null,
            y: null
        };
        this.splitRequested = false;

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        window.addEventListener("keydown", this.handleKeyDown);
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();

        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    handleKeyDown(event) {
        if (event.code === "Space") {
            this.splitRequested = true;
        }
    }

    getMousePosition() {
        return this.mouse;
    }

    consumeSplitRequest() {
        if (!this.splitRequested) {
            return false;
        }

        this.splitRequested = false;
        return true;
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        window.removeEventListener("keydown", this.handleKeyDown);
    }
}
