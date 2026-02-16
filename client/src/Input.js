export default class Input {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
    }

    handleKeyDown(event) {
        if (event.key === "ArrowUp") this.keys.up = true;
        if (event.key === "ArrowDown") this.keys.down = true;
        if (event.key === "ArrowLeft") this.keys.left = true;
        if (event.key === "ArrowRight") this.keys.right = true;
    }

    handleKeyUp(event) {
        if (event.key === "ArrowUp") this.keys.up = false;
        if (event.key === "ArrowDown") this.keys.down = false;
        if (event.key === "ArrowLeft") this.keys.left = false;
        if (event.key === "ArrowRight") this.keys.right = false;
    }

    isUpPressed() {
        return this.keys.up;
    }

    isDownPressed() {
        return this.keys.down;
    }

    isLeftPressed() {
        return this.keys.left;
    }

    isRightPressed() {
        return this.keys.right;
    }

    destroy() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
    }
}
