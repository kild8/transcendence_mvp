// Physics-related helpers and constants for the game
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
const WINNING_SCORE = 2;
const TICK_RATE = 60;

function resetRoomBall(room) {
  room.ball.position = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
  // reset to baseline initialVelocity if available
  if (room.ball.initialVelocity) {
    room.ball.velocity = {
      x: Math.abs(room.ball.initialVelocity.x) * (Math.random() > 0.5 ? 1 : -1),
      y: Math.abs(room.ball.initialVelocity.y) * (Math.random() > 0.5 ? 1 : -1)
    };
  } else {
    room.ball.velocity = { x: 3 * (Math.random() > 0.5 ? 1 : -1), y: 2 * (Math.random() > 0.5 ? 1 : -1) };
    room.ball.initialVelocity = { x: Math.abs(room.ball.velocity.x), y: Math.abs(room.ball.velocity.y) };
  }
}

// Increase ball speed magnitude by `amount`, preserving direction.
function increaseBallSpeed(ball, amount) {
  const vx = ball.velocity?.x || 0;
  const vy = ball.velocity?.y || 0;
  const speed = Math.hypot(vx, vy);
  if (speed === 0) {
    ball.velocity = { x: amount * (Math.random() > 0.5 ? 1 : -1), y: 0 };
    return;
  }
  const newSpeed = speed + amount;
  const scale = newSpeed / speed;
  ball.velocity.x = vx * scale;
  ball.velocity.y = vy * scale;
}

// Advance physics by one tick for the given room.
// Returns: { winnerRole: 'player1'|'player2'|null }
function step(room) {
  // paddles movement based on lastInputs
  ['player1', 'player2'].forEach(role => {
    const input = room.lastInputs?.[role];
    const paddle = room.paddles?.[role];
    if (!paddle) return;
    if (input === 'ArrowUp') paddle.position.y = Math.max(paddle.position.y - paddle.speed, 0);
    if (input === 'ArrowDown') paddle.position.y = Math.min(paddle.position.y + paddle.speed, CANVAS_HEIGHT - paddle.height);
  });

  // move ball
  const ball = room.ball;
  ball.position.x += ball.velocity.x;
  ball.position.y += ball.velocity.y;

  // wall bounces
  if (ball.position.y <= 0) {
    ball.position.y = 0;
    ball.velocity.y = Math.abs(ball.velocity.y) + (Math.random() - 0.5) * 0.5;
    increaseBallSpeed(ball, 0.5);
  }
  if (ball.position.y >= CANVAS_HEIGHT - ball.size) {
    ball.position.y = CANVAS_HEIGHT - ball.size;
    ball.velocity.y = -Math.abs(ball.velocity.y) + (Math.random() - 0.5) * 0.5;
    increaseBallSpeed(ball, 0.5);
  }

  // paddle bounces
  ['player1', 'player2'].forEach(role => {
    const p = room.paddles[role];
    if (
      ball.position.x <= p.position.x + p.width &&
      ball.position.x + ball.size >= p.position.x &&
      ball.position.y + ball.size >= p.position.y &&
      ball.position.y <= p.position.y + p.height
    ) {
      const mid = p.position.y + p.height / 2;
      const impact = (ball.position.y - mid) / (p.height / 2);
      if (role === 'player1') {
        ball.velocity.x = Math.abs(ball.velocity.x);
      } else {
        ball.velocity.x = -Math.abs(ball.velocity.x);
      }
      ball.velocity.y = impact * 5;
      increaseBallSpeed(ball, 0.5);
    }
  });

  // obstacle collisions (triangles centered top/bottom)
  if (room.obstacles) {
    const top = room.obstacles.top;
    const bottom = room.obstacles.bottom;
    const bx = ball.position.x + ball.size / 2;
    const by = ball.position.y + ball.size / 2;
    const checkObstacle = (obs) => {
      const topY = obs.position.y;
      const bottomY = obs.position.y + obs.size;
      const leftX = obs.position.x - obs.size / 2;
      const rightX = obs.position.x + obs.size / 2;
      if (bx >= leftX && bx <= rightX && by >= topY && by <= bottomY) {
        ball.velocity.y = -ball.velocity.y;
        ball.position.y += Math.sign(ball.velocity.y) * 2;
        increaseBallSpeed(ball, 0.5);
      }
    };
    checkObstacle(top);
    checkObstacle(bottom);
  }

  // scoring
  if (ball.position.x > CANVAS_WIDTH) {
    room.paddles.player1.score++;
    if (room.paddles.player1.score >= WINNING_SCORE) return { winnerRole: 'player1' };
    resetRoomBall(room);
    return { winnerRole: null };
  }
  if (ball.position.x < 0) {
    room.paddles.player2.score++;
    if (room.paddles.player2.score >= WINNING_SCORE) return { winnerRole: 'player2' };
    resetRoomBall(room);
    return { winnerRole: null };
  }

  return { winnerRole: null };
}

module.exports = { CANVAS_WIDTH, CANVAS_HEIGHT, WINNING_SCORE, TICK_RATE, resetRoomBall, increaseBallSpeed, step };
