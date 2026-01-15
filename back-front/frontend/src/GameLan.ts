interface Vector2D { x: number; y: number; }
interface PaddleState { position: Vector2D; width: number; height: number; score: number; }
interface BallState { position: Vector2D; velocity: Vector2D; size: number; }

interface GameState {
    ball: BallState;
    paddles: { player1: PaddleState; player2: PaddleState };
    scores: { player1: number; player2: number }
}

export class PongGameLan {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private playerRole: "player1" | "player2";
    private ws: WebSocket;
    private countdown: number | null = 10;
    private countdownStartTime: number = performance.now();

    onGameOver?: () => void;

    private ball: BallState = { position: {x:0,y:0}, velocity:{x:0,y:0}, size:10 };
    private paddles: { player1: PaddleState; player2: PaddleState } = {
        player1: { position: {x:20,y:200}, width:10, height:100, score:0 },
        player2: { position: {x:770,y:200}, width:10, height:100, score:0 }
    };

    constructor(canvasId: string, playerRole: "player1" | "player2", ws: WebSocket) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        this.playerRole = playerRole;
        this.ws = ws;

        document.addEventListener("keydown", e => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                this.sendInput(e.key, true);
            }
        });
        document.addEventListener("keyup", e => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                this.sendInput(e.key, false);
            }
        });
    }

    private sendInput(key: string, down: boolean) {
        if (key !== "ArrowUp" && key !== "ArrowDown") return;
        this.ws.send(JSON.stringify({ type: down ? "input" : "input-up", key }));
    }

    public update(state: GameState) {

        if (this.countdown !== null)
        {
            const elapsed = (performance.now() - this.countdownStartTime) / 1000;
            const remaining = 10 - Math.floor(elapsed);
            this.countdown = remaining > 0 ? remaining : null;
        }
        this.ball = state.ball;
        this.paddles = state.paddles;
        this.draw();
    }

    private draw() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawPaddle(this.paddles.player1);
        this.drawPaddle(this.paddles.player2);

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.ball.position.x, this.ball.position.y, this.ball.size, this.ball.size);

        this.ctx.font = "20px monospace";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`${this.paddles.player1.score}`, 20, 30);
        this.ctx.textAlign = "right";
        this.ctx.fillText(`${this.paddles.player2.score}`, this.canvas.width - 20, 30);
        
        

        if (this.countdown !== null) {
            this.ctx.fillStyle = "rgba(0,0,0,0.6)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "white";
            this.ctx.font = "80px monospace";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";

            this.ctx.fillText(
                this.countdown === 1 ? "GO" : String(this.countdown - 1),
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    
    }

    private drawPaddle(p: PaddleState) {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(p.position.x, p.position.y, p.width, p.height);
    }




}
