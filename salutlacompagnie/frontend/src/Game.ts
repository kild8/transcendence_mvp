import { t } from "./lang/langIndex.js";
import { state } from "./state.js";

interface Vector2D {
    x: number;
    y: number;
}

class Paddle {
    position: Vector2D;
    width: number;
    height: number;
    speed: number;
    color: string;
    score: number;

    constructor(x: number, y: number, width: number, height: number, color: string) {
        this.position = {x, y};
        this.width = width;
        this.height = height;
        this.speed = 6;
        this.color = color;
        this.score = 0;
    }

    moveUp() { this.position.y = Math.max(this.position.y - this.speed, 0); }
    moveDown(canvasHeight: number) { this.position.y = Math.min(this.position.y + this.speed, canvasHeight - this.height); }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

class Ball {
    position: Vector2D;
    velocity: Vector2D;
    size: number;
    color: string;
    initialVelocity: Vector2D;

    constructor(x: number, y: number, color: string) {
        this.position = { x, y };
        this.velocity = { x: 3, y: 2 };
    this.initialVelocity = { x: 3, y: 2 };
        this.size = 10;
        this.color = color;
    }

    // Increase total velocity magnitude by `amount`, preserving direction.
    increaseSpeed(amount: number) {
        const vx = this.velocity.x || 0;
        const vy = this.velocity.y || 0;
        const speed = Math.hypot(vx, vy);
        if (speed === 0) {
            // give a small nudge in x direction when stationary
            this.velocity.x = amount;
            this.velocity.y = 0;
            return;
        }
        const newSpeed = speed + amount;
        const scale = newSpeed / speed;
        this.velocity.x = vx * scale;
        this.velocity.y = vy * scale;
    }

    reset(canvasWidth: number, canvasHeight: number) {
        this.position = { x: canvasWidth / 2, y: canvasHeight / 2 };
    // reset velocity to baseline initial velocity with randomized direction
    this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * Math.abs(this.initialVelocity.x);
    this.velocity.y = (Math.random() > 0.5 ? 1 : -1) * Math.abs(this.initialVelocity.y);
    }

    update(canvasWidth: number, canvasHeight: number, left: Paddle, right: Paddle) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

       	if (this.position.y <= 0) {
			this.position.y = 0;
            this.velocity.y = Math.abs(this.velocity.y) + (Math.random() - 0.5) * 0.5;
            this.increaseSpeed(0.5);
		}

		if (this.position.y >= canvasHeight - this.size) {
			this.position.y = canvasHeight - this.size;
            this.velocity.y = -Math.abs(this.velocity.y) + (Math.random() - 0.5) * 0.5;
            this.increaseSpeed(0.5);
		}

        if (this.position.x <= left.position.x + left.width &&
            this.position.y + this.size >= left.position.y &&
            this.position.y <= left.position.y + left.height
        ) {
            const impact = (this.position.y - (left.position.y + left.height / 2)) / (left.height / 2);
            this.velocity.x = Math.abs(this.velocity.x);
            this.velocity.y = impact * 5;
            this.increaseSpeed(0.5);
        }

        if (this.position.x + this.size >= right.position.x &&
            this.position.y + this.size >= right.position.y &&
            this.position.y <= right.position.y + right.height
        ) {
            const impact = (this.position.y - (right.position.y + right.height / 2)) / (right.height / 2);
            this.velocity.x = -Math.abs(this.velocity.x);
            this.velocity.y = impact * 5;
            this.increaseSpeed(0.5);
        }

        if (this.position.x > canvasWidth) { left.score++; this.reset(canvasWidth, canvasHeight); }
        if (this.position.x < 0) { right.score++; this.reset(canvasWidth, canvasHeight); }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
    }
}

class Obstacle {
    position: Vector2D;
    size: number;
    pointingUp: boolean;

    constructor(x: number, y: number, size: number, pointingUp: boolean) {
        this.position = { x, y };
        this.size = size;
        this.pointingUp = pointingUp;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        if (this.pointingUp) {
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.position.x - this.size / 2, this.position.y + this.size);
            ctx.lineTo(this.position.x + this.size / 2, this.position.y + this.size);
        } else {
            ctx.moveTo(this.position.x, this.position.y + this.size);
            ctx.lineTo(this.position.x - this.size / 2, this.position.y);
            ctx.lineTo(this.position.x + this.size / 2, this.position.y);
        }
        ctx.closePath();
        ctx.fill();
    }

    checkCollision(ball: Ball) {
        const bx = ball.position.x + ball.size / 2;
        const by = ball.position.y + ball.size / 2;

        const topY = this.position.y;
        const bottomY = this.position.y + this.size;
        const leftX = this.position.x - this.size / 2;
        const rightX = this.position.x + this.size / 2;

        if (bx >= leftX && bx <= rightX && by >= topY && by <= bottomY) {
            ball.velocity.y = -ball.velocity.y;
            ball.position.y += Math.sign(ball.velocity.y) * 2;
                // Ball has increaseSpeed method — call it directly
                if (typeof (ball as Ball).increaseSpeed === 'function') (ball as Ball).increaseSpeed.call(ball, 0.5);
        }
    }
}

type OnGameOver = (winner: string, loser: string, score: string) => void;

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private ball: Ball;
    private topObstacle: Obstacle;
    private bottomObstacle: Obstacle;
    private keys: Record<string, boolean> = {};
    private running: boolean = true;
    private rafId: number | null = null;
    private keydownHandler: (e: KeyboardEvent) => void;
    private keyupHandler: (e: KeyboardEvent) => void;
    private leftName: string;
    private rightName: string;
    private winningScore: number;
    private onGameOver?: OnGameOver;
    private countdown: number | null = 4;
    private countdownStartTime: number = performance.now();

    constructor(canvasId: string, leftName = t(state.lang, "Game.PLAYER1"), rightName = t(state.lang, "Game.PLAYER2"), winningScore = 2, onGameOver?: OnGameOver) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        this.leftPaddle = new Paddle(20, this.canvas.height / 2 - 50, 10, 100, "white");
        this.rightPaddle = new Paddle(this.canvas.width - 30, this.canvas.height / 2 - 50, 10, 100, "white");
        this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2, "white");
        this.topObstacle = new Obstacle(this.canvas.width / 2, 0, 20, false);
        this.bottomObstacle = new Obstacle(this.canvas.width / 2, this.canvas.height - 20, 20, true);
        this.leftName = leftName; this.rightName = rightName;
        this.winningScore = winningScore;
        this.onGameOver = onGameOver;

        this.keydownHandler = (e: KeyboardEvent) => {
            if (["w","s","ArrowUp","ArrowDown"].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        };
        this.keyupHandler = (e: KeyboardEvent) => {
            if (["w","s","ArrowUp","ArrowDown"].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = false;
            }
        };
        
        this.setupInput();
        this.loop();
    }

  
    setupInput() {
        document.addEventListener("keydown", this.keydownHandler);
        document.addEventListener("keyup", this.keyupHandler);
    }

    teardownInput() {
        document.removeEventListener("keydown", this.keydownHandler);
        document.removeEventListener("keyup", this.keyupHandler);
    }

    update() {
        if (this.countdown !== null)
        {
            const elapsed = (performance.now() - this.countdownStartTime) / 1000;
            const remaining = 4 - Math.floor(elapsed);
            this.countdown = remaining > 0 ? remaining : null;
            return;
        }
        if (this.keys["w"]) this.leftPaddle.moveUp();
        if (this.keys["s"]) this.leftPaddle.moveDown(this.canvas.height);
        if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
        if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.canvas.height);

        this.ball.update(this.canvas.width, this.canvas.height, this.leftPaddle, this.rightPaddle);
        this.topObstacle.checkCollision(this.ball);
        this.bottomObstacle.checkCollision(this.ball);

        if (this.leftPaddle.score >= this.winningScore) this.handleWin(this.leftName, this.rightName, `${this.leftPaddle.score}:${this.rightPaddle.score}`);
        if (this.rightPaddle.score >= this.winningScore) this.handleWin(this.rightName, this.leftName, `${this.rightPaddle.score}:${this.leftPaddle.score}`);
    }

    draw() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.leftPaddle.draw(this.ctx);
        this.rightPaddle.draw(this.ctx);
        this.ball.draw(this.ctx);
        this.topObstacle.draw(this.ctx);
        this.bottomObstacle.draw(this.ctx);

        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.font = "20px monospace";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`${this.leftName}  ${this.leftPaddle.score}`, 20, 30);
        this.ctx.textAlign = "right";
        this.ctx.fillText(`${this.rightPaddle.score}  ${this.rightName}`, this.canvas.width - 20, 30);
        
        
        if (this.countdown !== null) {
            this.ctx.fillStyle = "rgba(0,0,0,0.6)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "white";
            this.ctx.font = "80px monospace";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";

            this.ctx.fillText(
                this.countdown === 1 ? t(state.lang, "Game.GO") : String(this.countdown - 1),
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    
    }

    loop = () => {
        if (!this.running) return;
        this.update();
        this.draw();
        this.rafId = requestAnimationFrame(this.loop);
    };

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.teardownInput();
    }

    private handleWin(winner: string, loser: string, score: string) {
        this.stop();
        if (this.onGameOver) setTimeout(() => this.onGameOver!(winner, loser, score), 50);
        else alert(t(state.lang, "Game.WIN_ALERT", { winner, loser, score }));
    }
}

declare global {
    interface Window { PongGame?: typeof Game }
}

window.PongGame = Game;
