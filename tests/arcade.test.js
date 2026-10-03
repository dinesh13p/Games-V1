import test from 'node:test'
import assert from 'node:assert/strict'
import { checkCollisions as arrowCollisions, advanceArchery, shootArrow } from '../src/components/games/ArcheryGame/ArcheryGame.logic.js'
import { checkBallCollision, createBrickGame, advanceBricks, CANVAS_WIDTH as BRICK_WIDTH, PADDLE_WIDTH } from '../src/components/games/BrickBreaker/BrickBreaker.logic.js'
import { createDoodleGame, advanceDoodle, checkPlatformCollision } from '../src/components/games/DoodleJump/DoodleJump.logic.js'
import { createFlappyGame, advanceFlappy, createPipe, PIPE_SPAWN_INTERVAL } from '../src/components/games/FlappyBird/FlappyBird.logic.js'
import { createFroggerGame, advanceFrogger, moveFrog } from '../src/components/games/FroggerGame/FroggerGame.logic.js'
import { createPongGame, advancePong, CANVAS_WIDTH as PONG_WIDTH } from '../src/components/games/PongGame/PongGame.logic.js'
import { PIECES, emptyBoard, startTetris, moveTetris, rotateTetris, dropTetris, holdTetris, advanceTetris, lockTetris, getGhostY } from '../src/components/games/Tetris/Tetris.logic.js'

test('Archery consumes a hit arrow once, without changing the input targets', () => {
    const arrows = [{ x: 500, y: 300 }]
    const targets = [{ x: 500, y: 300, type: 'normal', hit: false }, { x: 500, y: 300, type: 'bullseye', hit: false }]
    const result = arrowCollisions(arrows, targets, [])
    assert.equal(result.scoreGained, 50)
    assert.equal(result.arrows.length, 0)
    assert.deepEqual(result.targets.map(target => target.hit), [true, false])
    assert.equal(targets[0].hit, false)
    assert.equal(arrows[0].x, 500)
})

test('Archery ends when the last missed arrow exits the range', () => {
    const state = { phase: 'playing', score: 20, level: 1, wind: 0, arrowsLeft: 0,
        arrows: [{ x: 899, y: 300, vx: 12, vy: 0, gravity: 0.15 }],
        targets: [{ x: 500, y: 300, type: 'normal', hit: false }], enemies: [], particles: [] }
    const next = advanceArchery(state)
    assert.equal(next.phase, 'over')
    assert.equal(next.arrows.length, 0)
    assert.equal(state.arrows[0].x, 899)
})

test('Archery advances from the current level and awards unused arrows', () => {
    const state = { phase: 'playing', score: 100, level: 3, wind: 0, arrowsLeft: 2, arrows: [],
        targets: [{ x: 500, y: 300, type: 'normal', hit: true }], enemies: [], particles: [] }
    const next = advanceArchery(state)
    assert.equal(next.level, 4)
    assert.equal(next.arrowsLeft, 14)
    assert.equal(next.targets.length, 7)
    assert.equal(next.score, 120)
})

test('Archery caps charge and does not fire while paused or out of arrows', () => {
    const state = { phase: 'playing', arrowsLeft: 1, arrows: [], bowAngle: 0 }
    const next = shootArrow(state, 10)
    assert.equal(next.arrowsLeft, 0)
    assert.equal(next.arrows[0].vx, 18)
    assert.equal(shootArrow(next, 1), next)
    const paused = { ...state, phase: 'paused' }
    assert.equal(shootArrow(paused, 1), paused)
    assert.equal(state.arrows.length, 0)
})

test('Brick Breaker reflects both axes at a top corner', () => {
    const ball = { x: 2, y: 2, dx: -4, dy: -4 }
    const result = checkBallCollision(ball, { x: 250, y: 370 }, [])
    assert.equal(result.ball.dx, 4)
    assert.equal(result.ball.dy, 4)
    assert.equal(ball.dx, -4)
})

test('Brick Breaker loses exactly one life and resets the ball', () => {
    const state = { ...createBrickGame(), phase: 'playing' }
    state.ball = { x: 300, y: 399, dx: 0, dy: 4 }
    const next = advanceBricks(state, {})
    assert.equal(next.lives, 2)
    assert.equal(next.ball.y, 350)
    assert.equal(next.phase, 'playing')
    assert.equal(state.lives, 3)
    const final = advanceBricks({ ...state, lives: 1 }, {})
    assert.equal(final.phase, 'over')
    assert.equal(final.lives, 0)
})

test('Brick Breaker keeps held controls within the field', () => {
    const state = { ...createBrickGame(), phase: 'playing' }
    state.paddle.x = BRICK_WIDTH - PADDLE_WIDTH - 1
    assert.equal(advanceBricks(state, { right: true }).paddle.x, BRICK_WIDTH - PADDLE_WIDTH)
    state.paddle.x = 1
    assert.equal(advanceBricks(state, { left: true }).paddle.x, 0)
})

test('Doodle Jump retains fractional climb height until it earns a point', () => {
    const state = { ...createDoodleGame(), phase: 'playing', cameraY: -9, maxHeight: 0.9, score: 0 }
    state.doodler = { ...state.doodler, y: 289, velocityY: 0 }
    const next = advanceDoodle(state, {})
    assert.equal(next.score, 1)
    assert.equal(state.score, 0)
    assert.equal(state.doodler.y, 289)
})

test('Doodle Jump only lands while descending and keeps boosted platforms', () => {
    const platform = { x: 100, y: 300, width: 85, height: 15, type: 'green' }
    assert.equal(checkPlatformCollision({ x: 110, y: 240, velocityY: -2 }, platform), false)
    const state = { ...createDoodleGame(), phase: 'playing', platforms: [platform] }
    state.doodler = { ...state.doodler, x: 110, y: 238, velocityY: 2 }
    const next = advanceDoodle(state, {})
    assert.equal(next.doodler.flying, true)
    assert.equal(next.doodler.velocityY, -27)
    assert.equal(next.doodler.flyingTimer, 60)
})

test('Flappy Bird spawns pipe one first and the hundredth pipe is the finish', () => {
    const state = { ...createFlappyGame(), phase: 'playing', spawnTimer: PIPE_SPAWN_INTERVAL }
    const next = advanceFlappy(state, 0)
    assert.equal(next.pipes[0].pipeNumber, 1)
    assert.equal(next.pipeCount, 1)
    assert.equal(state.pipes.length, 0)
    assert.equal(createPipe(99, 480, 640).isGolden, true)
    assert.equal(createPipe(100, 480, 640), null)
})

test('Flappy Bird awards each pipe once and completes the final pipe', () => {
    const state = { ...createFlappyGame(), phase: 'playing', score: 99 }
    state.pipes = [{ ...createPipe(99, 480, 640), x: 0 }]
    const next = advanceFlappy(state, 0)
    assert.equal(next.score, 100)
    assert.equal(next.won, true)
    assert.equal(next.phase, 'over')
    assert.equal(advanceFlappy(next, 0.016).score, 100)
    assert.equal(state.pipes[0].passed, false)
})

test('Flappy Bird freezes physics when paused', () => {
    const state = { ...createFlappyGame(), phase: 'paused' }
    const next = advanceFlappy(state, 1)
    assert.deepEqual(next.bird, state.bird)
    assert.equal(next.spawnTimer, 0)
})

test('Frogger movement does not restart the countdown', () => {
    const state = { ...createFroggerGame(), phase: 'playing', elapsed: 9.75, timeLeft: 21, cars: [], logs: [] }
    const moved = moveFrog(state, 'up')
    assert.equal(moved.elapsed, 9.75)
    assert.equal(moved.score, 10)
    const next = advanceFrogger(moved, 0.5)
    assert.equal(next.timeLeft, 20)
    assert.equal(state.frogY, 11)
})

test('Frogger gives a fresh timer and crossing bonus after reaching home', () => {
    const state = { ...createFroggerGame(), phase: 'playing', frogY: 0, score: 110, elapsed: 10, timeLeft: 20 }
    const next = advanceFrogger(state, 0)
    assert.equal(next.completions, 1)
    assert.equal(next.score, 310)
    assert.equal(next.timeLeft, 30)
    assert.equal(next.elapsed, 0)
    assert.equal(next.frogY, 11)
})

test('Frogger time expires and paused controls leave the frog alone', () => {
    const state = { ...createFroggerGame(), phase: 'playing', elapsed: 29.9 }
    assert.equal(advanceFrogger(state, 0.2).phase, 'over')
    const paused = { ...state, phase: 'paused' }
    assert.equal(moveFrog(paused, 'up'), paused)
    assert.equal(advanceFrogger(paused, 1), paused)
})

test('Paused Archery, Brick Breaker, and Doodle Jump leave physics untouched', () => {
    const archery = { phase: 'paused' }
    const bricks = { ...createBrickGame(), phase: 'paused' }
    const doodle = { ...createDoodleGame(), phase: 'paused' }
    assert.equal(advanceArchery(archery), archery)
    assert.equal(advanceBricks(bricks, { left: true }), bricks)
    assert.equal(advanceDoodle(doodle, { right: true }), doodle)
})

test('Pong finishes on the tenth point, without waiting for a later render', () => {
    const state = { ...createPongGame(), phase: 'playing', score: { player: 9, ai: 0 },
        ballX: PONG_WIDTH + 1, ballY: 0, ballSpeedX: 5, ballSpeedY: 0, aiY: 250 }
    const next = advancePong(state, false)
    assert.equal(next.score.player, 10)
    assert.equal(next.phase, 'over')
    assert.equal(state.score.player, 9)
})

test('Pong clamps a held paddle and freezes a paused match', () => {
    const state = { ...createPongGame(), phase: 'playing', playerY: 1, upPressed: true }
    assert.equal(advancePong(state, false).playerY, 0)
    const paused = { ...state, phase: 'paused' }
    assert.deepEqual(advancePong(paused, false), paused)
})

test('Tetris blocks all piece actions during pause', () => {
    const state = { ...startTetris(), phase: 'paused' }
    assert.equal(moveTetris(state, 1), state)
    assert.equal(rotateTetris(state), state)
    assert.equal(dropTetris(state, 1000, true), state)
    assert.equal(holdTetris(state, 1000), state)
    assert.equal(advanceTetris(state, 1000, true), state)
})

test('Tetris tops out when a piece locks above the visible board', () => {
    const state = { ...startTetris(), current: { ...PIECES.O, type: 'O' }, px: 4, py: -2 }
    state.board[0][4] = '#829d99'
    state.board[0][5] = '#829d99'
    const next = dropTetris(state, 1000, true)
    assert.equal(next.phase, 'over')
    assert.equal(state.phase, 'playing')
})

test('Tetris keeps hold limited to once per piece, then unlocks it after landing', () => {
    const state = startTetris()
    const held = holdTetris(state, 100)
    assert.equal(held.holdUsed, true)
    assert.equal(held.hold.type, state.current.type)
    assert.equal(holdTetris(held, 200), held)
    const landed = dropTetris(held, 300, true)
    assert.equal(landed.holdUsed, false)
    assert.equal(state.hold, null)
})

test('Tetris keeps line scoring, level progression, and immutable board updates', () => {
    const board = emptyBoard()
    board[19] = Array(10).fill('#829d99')
    for (let x = 3; x < 7; x++) board[19][x] = 0
    const state = { ...startTetris(), board, current: { ...PIECES.I, type: 'I' }, px: 3, py: 19, lines: 9, level: 1 }
    const next = lockTetris(state, 1000)
    assert.equal(next.lines, 10)
    assert.equal(next.level, 2)
    assert.equal(next.score, 40)
    assert.equal(next.dropTimer, 730)
    assert.equal(board[19][3], 0)
    assert.equal(next.board[19].every(cell => cell === 0), true)
})

test('Tetris hard drop uses the ghost landing and two points per cell', () => {
    const state = { ...startTetris(), current: { ...PIECES.O, type: 'O' }, px: 4, py: 0 }
    const landing = getGhostY(state.board, state.current, state.px, state.py)
    const next = dropTetris(state, 1000, true)
    assert.equal(landing, 18)
    assert.equal(next.score, 36)
    assert.equal(next.board[19][4], PIECES.O.color)
})
