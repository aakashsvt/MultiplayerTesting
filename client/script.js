import Main from "./src/Main.js";

let mainInstance = null;

function startGame() {
    if (mainInstance) {
        return;
    }

    const canvas = document.getElementById("canvas");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    canvas.classList.add("canvas-visible");
    mainInstance = new Main(canvas, ctx);
}

document.addEventListener("DOMContentLoaded", () => {
    const landing = document.getElementById("landing");
    const startButton = document.getElementById("startButton");

    if (!startButton) {
        startGame();
        return;
    }

    startButton.addEventListener("click", () => {
        if (landing) {
            landing.classList.add("landing-hidden");
        }

        startGame();
    });
});
