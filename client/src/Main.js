import Game from "./game/Game.js";

let instance = null;

export default class Main {
    constructor(canvas, ctx) {
        if (instance) {
            return instance;
        }
        instance = this;
        window.main = this;
        this.canvas = canvas;
        this.ctx = ctx;

        this.sizes = {
            width: 0,
            height: 0,
            scale: 1
        };

        const now = Date.now();
        this.time = {
            start: now,
            current: now,
            elapsed: 0,
            delta: 0
        };

        this.state = "run";
        this.game = new Game(this.ctx);

        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);

        this.addEventListeners();
        this.resize();

        requestAnimationFrame(this.loop);
    }

    addEventListeners() {
        window.addEventListener("resize", this.resize);
    }

    removeEventListeners() {
        window.removeEventListener("resize", this.resize);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.sizes.width = width;
        this.sizes.height = height;
        this.sizes.scale = dpr;

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    loop() {
        const now = Date.now();

        this.time.delta = (now - this.time.current) / 1000;
        this.time.current = now;
        this.time.elapsed = (now - this.time.start) / 1000;

        const dt = Math.min(this.time.delta, 0.1);

        if (this.state === "run") {
            this.update(dt);
        }

        this.render();
        requestAnimationFrame(this.loop);
    }

    update(dt) {
        if (!this.game) {
            return;
        }

        this.game.update(dt);
    }

    render() {
        if (!this.game) {
            return;
        }

        this.game.render();
    }

    destroy() {
        this.removeEventListeners();
    }
}
