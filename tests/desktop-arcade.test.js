import test from 'node:test'
import assert from 'node:assert/strict'
import { createPacmanGame, DIFFICULTIES, isPacmanControlTarget, movePacman, movePacmanGhosts, pacmanGhostDelay } from '../src/components/games/PacMan/PacMan.logic.js'
import { projectMazePoint } from '../src/components/games/PacMan/PacMan.render.js'
import { checkBulletEnemyCollisions, clearSpaceKeys, createBullet, createEnemies, createSpaceGame, isSpaceControlTarget, stepSpaceGame, updateEnemies, updateEnemyBullets } from '../src/components/games/SpaceInvaders/SpaceInvaders.logic.js'
import { projectInvaderPoint } from '../src/components/games/SpaceInvaders/SpaceInvaders.render.js'

test('Pac-Man difficulties create valid scaled starts and retain their actual ghost speeds', () => {
    for (const [difficulty, config] of Object.entries(DIFFICULTIES)) {
        const game = createPacmanGame(difficulty, 'playing')
        assert.equal(game.maze.length, Math.round(15 * config.scale))
        assert.equal(game.ghosts.length, config.ghosts)
        assert.notEqual(game.maze[game.pacman.y][game.pacman.x], 'W')
        game.ghosts.forEach(ghost => assert.notEqual(game.maze[ghost.y][ghost.x], 'W'))
        assert.equal(pacmanGhostDelay(game), config.baseSpeed)
        assert.equal(pacmanGhostDelay({ ...game, powerTimer: 5000 }), config.powerSpeed)
        const restarted = createPacmanGame(game.difficulty, 'playing')
        assert.equal(restarted.maze.length, game.maze.length)
        assert.equal(restarted.score, 0)
    }
})

test('Pac-Man movement respects walls, scores pellets once, and leaves the previous state untouched', () => {
    const game = createPacmanGame('Beginner', 'playing')
    const blocked = movePacman(game, -1, 0)
    assert.deepEqual(blocked.pacman, game.pacman)
    assert.equal(blocked.score, 0)
    const next = movePacman(game, 1, 0)
    assert.deepEqual(next.pacman, { x: 2, y: 13 })
    assert.equal(next.score, 10)
    assert.equal(next.maze[13][2], 'E')
    assert.equal(game.maze[13][2], 'P')
    const returned = movePacman(movePacman(next, -1, 0), 1, 0)
    assert.equal(returned.score, 20)
})

test('Pac-Man power pickup resolves a simultaneous ghost collision as a capture', () => {
    const game = createPacmanGame('Beginner', 'playing')
    game.ghosts = [{ ...game.ghosts[0], x: 1, y: 12 }]
    const next = movePacman(game, 0, -1)
    assert.equal(next.score, 250)
    assert.equal(next.powerTimer, 5000)
    assert.equal(next.status, 'playing')
    assert.notDeepEqual(next.ghosts[0], game.ghosts[0])
})

test('Pac-Man loses on an unpowered collision and wins only after collecting the last pellet', () => {
    const game = createPacmanGame('Beginner', 'playing')
    game.ghosts = [{ ...game.ghosts[0], x: 2, y: 13 }]
    assert.equal(movePacman(game, 1, 0).status, 'gameOver')
    game.ghosts = []
    game.maze = game.maze.map(row => row.map(cell => cell === 'P' || cell === 'O' ? 'E' : cell))
    game.maze[13][2] = 'P'
    const win = movePacman(game, 1, 0)
    assert.equal(win.status, 'won')
    assert.equal(win.score, 10)
    assert.equal(movePacman(win, 1, 0), win)
})

test('Pac-Man ghost tunnels use the scaled maze width rather than hard-coded column 14', () => {
    const game = createPacmanGame('Advanced', 'playing')
    game.maze = Array.from({ length: 3 }, (_, y) => Array(30).fill(y === 1 ? 'P' : 'W'))
    game.pacman = { x: 2, y: 1 }
    game.lastDirection = { dx: 0, dy: 0 }
    game.ghosts = [{ x: 29, y: 1, color: 'red', direction: { dx: 1, dy: 0 }, home: { x: 15, y: 1 } }]
    const next = movePacmanGhosts(game, () => 0.9)
    assert.equal(next.ghosts[0].x, 0)
    assert.equal(next.ghosts[0].y, 1)
    assert.equal(game.ghosts[0].x, 29)
})

test('keyboard guards recognize controls and editable content without capturing the playfield', () => {
    for (const guard of [isPacmanControlTarget, isSpaceControlTarget]) {
        for (const name of ['input', 'textarea', 'select', 'button', 'a', '[role="textbox"]']) {
            assert.equal(guard({ closest: selector => selector.split(', ').includes(name) ? {} : null }), true)
        }
        assert.equal(guard({ closest: selector => selector.includes('[contenteditable]') ? {} : null }), true)
        assert.equal(guard({ closest: () => null }), false)
        assert.equal(guard(null), false)
    }
})

test('Space Invaders retains its formation, ship coordinates and bullet origin', () => {
    const enemies = createEnemies()
    assert.equal(enemies.length, 102)
    assert.equal(enemies.filter(enemy => enemy.type === 'small').length, 20)
    assert.equal(enemies.reduce((sum, enemy) => sum + enemy.points, 0), 1840)
    const game = createSpaceGame()
    assert.deepEqual([game.player.x, game.player.y, game.player.width, game.player.height], [280, 550, 40, 20])
    const bullet = createBullet(game.player.x, game.player.y)
    assert.deepEqual([bullet.x, bullet.y, bullet.width, bullet.height], [298, 550, 4, 12])
})

test('Space Invaders restart explicitly resets level, speed, timers, score, lives and held keys', () => {
    const previous = createSpaceGame(8, 'playing')
    previous.leftPressed = previous.spacePressed = true
    previous.score = 500
    previous.lives = 1
    const next = createSpaceGame(1, 'playing')
    assert.equal(next.level, 1)
    assert.equal(next.enemySpeed, 38)
    assert.equal(next.score, 0)
    assert.equal(next.lives, 3)
    assert.equal(next.leftPressed, false)
    assert.equal(next.spacePressed, false)
    assert.equal(next.time, 0)
    assert.equal(next.bullets.length, 0)
})

test('Space Invaders keeps frame movement bounded and stops the simulation while paused', () => {
    const game = createSpaceGame(1, 'playing')
    game.leftPressed = true
    stepSpaceGame(game, 2)
    assert.equal(game.player.x, 260)
    game.player.x = 1
    stepSpaceGame(game, 1 / 30)
    assert.equal(game.player.x, 0)
    game.status = 'paused'
    const time = game.time
    stepSpaceGame(game, 1)
    assert.equal(game.time, time)
    clearSpaceKeys(game)
    assert.equal(game.leftPressed, false)
})

test('Space Invaders fires at the existing cooldown and its bullets travel upward', () => {
    const game = createSpaceGame(1, 'playing')
    game.enemies = [{ x: 50, y: 60, width: 30, height: 20, alive: true, points: 20 }]
    game.spacePressed = true
    stepSpaceGame(game, 1 / 60)
    assert.equal(game.bullets.length, 1)
    assert.ok(game.bullets[0].y < 550)
    for (let i = 0; i < 5; i++) stepSpaceGame(game, 1 / 60)
    assert.equal(game.bullets.length, 1)
    for (let i = 0; i < 12; i++) stepSpaceGame(game, 1 / 60)
    assert.equal(game.bullets.length, 2)
})

test('Space Invaders applies one life loss for simultaneous hits, with two seconds of immunity', () => {
    const game = createSpaceGame(1, 'playing')
    const bullet = { x: 290, y: 549, width: 4, height: 8, speed: 100 }
    const result = updateEnemyBullets([{ ...bullet }, { ...bullet }], 0.01, 600, game.player, 1000)
    assert.equal(result.hit, true)
    assert.equal(result.bullets.length, 1)
    assert.equal(game.player.invincibleUntil, 3000)
    game.enemyBullets = [{ ...bullet }, { ...bullet }]
    game.player.invincible = false
    stepSpaceGame(game, 0.01)
    assert.equal(game.lives, 2)
})

test('a single shot removes one invader and final-hit points are included in the winning score', () => {
    const enemies = [{ x: 10, y: 10, width: 30, height: 20, alive: true, points: 20 }, { x: 10, y: 10, width: 30, height: 20, alive: true, points: 20 }]
    const hit = checkBulletEnemyCollisions([{ x: 20, y: 15, width: 4, height: 12 }], enemies)
    assert.equal(hit.points, 20)
    assert.equal(hit.enemies.filter(enemy => enemy.alive).length, 1)
    const game = createSpaceGame(1, 'playing')
    game.enemies = [{ x: 100, y: 100, width: 30, height: 20, alive: true, points: 20 }]
    game.bullets = [{ x: 110, y: 106, width: 4, height: 12, speed: 500 }]
    game.score = 1800
    stepSpaceGame(game, 0.01)
    assert.equal(game.status, 'won')
    assert.equal(game.score, 1820)
})

test('the formation reverses at its boundary and descending to the defence line loses the game', () => {
    const enemies = [{ x: 560, y: 490, width: 30, height: 20, alive: true }]
    const result = updateEnemies(enemies, 1, 38, 25, 1 / 30, 600, 540)
    assert.equal(result.direction, -1)
    assert.equal(result.enemies[0].y, 515)
    assert.equal(result.invaded, true)
    const game = createSpaceGame(1, 'playing')
    game.enemies = [{ x: 560, y: 500, width: 30, height: 20, alive: true }]
    stepSpaceGame(game, 1 / 30)
    assert.equal(game.status, 'lost')
})

test('projection is identity at the collision plane and depth has a bounded screen offset', () => {
    assert.deepEqual(projectMazePoint(20, 30, 0), [20, 30])
    assert.deepEqual(projectInvaderPoint(280, 550, 0), [280, 550])
    const projected = projectInvaderPoint(280, 550, 4)
    assert.ok(Math.abs(projected[0] - 280) < 2)
    assert.ok(Math.abs(projected[1] - 550) < 3)
    const maze = projectMazePoint(20, 30, 10)
    assert.ok(maze[0] > 20 && maze[1] < 30)
})
