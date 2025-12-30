interface GameOptions {
  ws?: WebSocket;
  playerRole?: "player1" | "player2";
}

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

    constructor(x: number, y: number, color: string) {
        this.position = { x, y };
        this.velocity = { x: 3, y: 2 };
        this.size = 10;
        this.color = color;
    }

    reset(canvasWidth: number, canvasHeight: number) {
        this.position = { x: canvasWidth / 2, y: canvasHeight / 2 };
        this.velocity.x = -this.velocity.x;
        this.velocity.y = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
    }

    update(canvasWidth: number, canvasHeight: number, left: Paddle, right: Paddle) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.y <= 0 || this.position.y >= canvasHeight - this.size) {
            this.velocity.y = -this.velocity.y;
            if (Math.abs(this.velocity.y) < 1) this.velocity.y = Math.sign(this.velocity.y || 1) * 1.5;
            this.velocity.y += (Math.random() - 0.5) * 0.5;
        }

        if (this.position.x <= left.position.x + left.width &&
            this.position.y + this.size >= left.position.y &&
            this.position.y <= left.position.y + left.height
        ) {
            const impact = (this.position.y - (left.position.y + left.height / 2)) / (left.height / 2);
            this.velocity.x = Math.abs(this.velocity.x);
            this.velocity.y = impact * 5;
        }

        if (this.position.x + this.size >= right.position.x &&
            this.position.y + this.size >= right.position.y &&
            this.position.y <= right.position.y + right.height
        ) {
            const impact = (this.position.y - (right.position.y + right.height / 2)) / (right.height / 2);
            this.velocity.x = -Math.abs(this.velocity.x);
            this.velocity.y = impact * 5;
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
    private ws?: WebSocket;
    private playerRole?: "player1" | "player2";

    constructor(canvasId: string, leftName = 'Joueur 1', rightName = 'Joueur 2', winningScore = 2, onGameOver?: OnGameOver, options?: GameOptions) {
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

        this.ws = options?.ws;
        this.playerRole = options?.playerRole;

        this.keydownHandler = (e: KeyboardEvent) => { this.keys[e.key] = true; this.sendInput(e.key, true); };
        this.keyupHandler = (e: KeyboardEvent) => { this.keys[e.key] = false; this.sendInput(e.key, false); };

        this.setupInput();
        this.loop();

        if (this.ws) {
            this.ws.addEventListener("message", (msg) => this.handleRemote(JSON.parse(msg.data)));
        }
    }

    private sendInput(key: string, isDown: boolean) {
        if (!this.ws) return;
        if (this.playerRole === "player1" && (key === "w" || key === "s")) {
            this.ws.send(JSON.stringify({ type: "input", key, down: isDown }));
        }
        if (this.playerRole === "player2" && (key === "ArrowUp" || key === "ArrowDown")) {
            this.ws.send(JSON.stringify({ type: "input", key, down: isDown }));
        }
    }

    private handleRemote(msg: any) {
        if (msg.type === "input") {
            this.moveRemotePaddle(msg.key, msg.down);
        }
        if (msg.type === "gameOver") {
            this.handleWin(msg.winner, msg.loser, msg.score);
        }
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
        if (this.ws) {
            if (this.playerRole === "player1")
            {
                if (this.keys["w"]) this.leftPaddle.moveUp();
                if (this.keys["s"]) this.leftPaddle.moveDown(this.canvas.height);
            }
            else if (this.playerRole === "player2")
            {
                if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
                if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.canvas.height);
            }
        }
        if (!this.ws) {
            if (this.keys["w"]) this.leftPaddle.moveUp();
            if (this.keys["s"]) this.leftPaddle.moveDown(this.canvas.height);
            if (this.keys["ArrowUp"]) this.rightPaddle.moveUp();
            if (this.keys["ArrowDown"]) this.rightPaddle.moveDown(this.canvas.height);
        }
        this.ball.update(this.canvas.width, this.canvas.height, this.leftPaddle, this.rightPaddle);
        this.topObstacle.checkCollision(this.ball);
        this.bottomObstacle.checkCollision(this.ball);

        if (!this.ws) { // only local check
            if (this.leftPaddle.score >= this.winningScore) this.handleWin(this.leftName, this.rightName, `${this.leftPaddle.score}:${this.rightPaddle.score}`);
            if (this.rightPaddle.score >= this.winningScore) this.handleWin(this.rightName, this.leftName, `${this.rightPaddle.score}:${this.leftPaddle.score}`);
        }
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
        else alert(`${winner} a gagné contre ${loser} — ${score}`);
    }

    moveRemotePaddle(key: string, down: boolean) {
        if (!down) return;
        if (this.playerRole === "player1") {
            if (key === "ArrowUp") this.rightPaddle.moveUp();
            if (key === "ArrowDown") this.rightPaddle.moveDown(this.canvas.height);
        }
        if (this.playerRole === "player2") {
            if (key === "w") this.leftPaddle.moveUp();
            if (key === "s") this.leftPaddle.moveDown(this.canvas.height);
        }
    }
}

;(window as any).PongGame = Game;
