export const FIELD_SIZE = 600

export const createEnemies = () => {
    const enemies = []
    for (let row = 0; row < 11; row++) {
        const cols = row >= 7 ? 8 : 10
        const offsetX = (600 - (cols - 1) * 45 - 30) / 2
        for (let col = 0; col < cols; col++) enemies.push({
            x: offsetX + col * 45, y: 60 + row * 35, width: 30, height: 20,
            alive: true, type: row < 2 ? 'small' : 'large', points: row < 2 ? 10 : 20
        })
    }
    return enemies
}

export const createPlayer = (x = 280, y = 550, width = 40, height = 20) => ({
    x, y, width, height, speed: 300, invincible: false, invincibleUntil: 0
})

export const createBullet = (x, y, speed = 500, width = 4, height = 12) => ({
    x: x + 18, y, width, height, speed, active: true
})

export const createEnemyBullet = (x, y, speed = 150) => ({
    x: x + 13, y: y + 20, width: 4, height: 8, speed, active: true
})

export function createSpaceGame(level = 1, status = 'ready') {
    return {
        player: createPlayer(), enemies: createEnemies(), bullets: [], enemyBullets: [],
        enemyDirection: 1, enemySpeed: Math.min(30 + level * 8, 120), enemyDropDistance: 25,
        leftPressed: false, rightPressed: false, spacePressed: false,
        lastBulletTime: -250, lastEnemyShot: 0, time: 0,
        score: 0, lives: 3, level, status
    }
}

export const isSpaceControlTarget = target => Boolean(target?.closest?.(
    'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
))

export function clearSpaceKeys(state) {
    state.leftPressed = false
    state.rightPressed = false
    state.spacePressed = false
}

const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

export const updateBullets = (bullets, dt) => bullets.filter(bullet => {
    bullet.y -= bullet.speed * dt
    return bullet.y > -bullet.height
})

export function updateEnemyBullets(bullets, dt, canvasHeight, player, time) {
    let hit = false
    const remaining = bullets.filter(bullet => {
        bullet.y += bullet.speed * dt
        if (!player.invincible && intersects(bullet, player)) {
            // Set this immediately, before processing another bullet in this frame.
            player.invincible = true
            player.invincibleUntil = time + 2000
            hit = true
            return false
        }
        return bullet.y < canvasHeight + bullet.height
    })
    return { bullets: remaining, hit }
}

export function updateEnemies(enemies, direction, speed, dropDistance, dt, canvasWidth, playerY) {
    let invaded = false
    const shouldDrop = enemies.some(enemy => enemy.alive && (enemy.x + direction * speed * dt <= 10 || enemy.x + direction * speed * dt + enemy.width >= canvasWidth - 10))
    if (shouldDrop) direction *= -1
    enemies.forEach(enemy => {
        if (!enemy.alive) return
        if (shouldDrop) {
            enemy.y += dropDistance
            if (enemy.y + enemy.height >= playerY - 10) invaded = true
        } else enemy.x += direction * speed * dt
    })
    return { enemies, direction, invaded }
}

export function checkBulletEnemyCollisions(bullets, enemies) {
    let points = 0
    const remaining = bullets.filter(bullet => {
        const enemy = enemies.find(enemy => enemy.alive && intersects(bullet, enemy))
        if (!enemy) return true
        enemy.alive = false
        points += enemy.points
        return false
    })
    return { bullets: remaining, enemies, points }
}

// The simulation owns the existing 600 × 600 collision plane. Rendering never
// feeds projected coordinates back into movement, aiming or collision tests.
export function stepSpaceGame(state, elapsed, random = Math.random) {
    if (state.status !== 'playing') return state
    const dt = Math.max(0, Math.min(elapsed, 1 / 30))
    state.time += dt * 1000
    const player = state.player
    if (state.leftPressed) player.x = Math.max(0, player.x - player.speed * 2 * dt)
    if (state.rightPressed) player.x = Math.min(FIELD_SIZE - player.width, player.x + player.speed * 2 * dt)
    if (state.spacePressed && state.time - state.lastBulletTime > 250) {
        state.bullets.push(createBullet(player.x, player.y))
        state.lastBulletTime = state.time
    }
    state.bullets = updateBullets(state.bullets, dt)

    const interval = Math.max((800 - state.level * 50) / 1.2 / 1.5, 300 / 1.2 / 1.5)
    if (state.time - state.lastEnemyShot > interval) {
        const alive = state.enemies.filter(enemy => enemy.alive)
        const front = alive.filter(enemy => !alive.some(other => other.x === enemy.x && other.y > enemy.y))
        if (front.length) {
            const shooter = front[Math.floor(random() * front.length)]
            state.enemyBullets.push(createEnemyBullet(shooter.x, shooter.y, 150 + state.level * 15))
            state.lastEnemyShot = state.time
        }
    }
    if (player.invincible && state.time > player.invincibleUntil) player.invincible = false
    const incoming = updateEnemyBullets(state.enemyBullets, dt, FIELD_SIZE, player, state.time)
    state.enemyBullets = incoming.bullets
    if (incoming.hit) state.lives -= 1
    if (state.lives <= 0) { state.status = 'lost'; clearSpaceKeys(state); return state }

    const movement = updateEnemies(state.enemies, state.enemyDirection, state.enemySpeed, state.enemyDropDistance, dt, FIELD_SIZE, player.y - 10)
    state.enemyDirection = movement.direction
    if (movement.invaded) { state.status = 'lost'; clearSpaceKeys(state); return state }
    const collisions = checkBulletEnemyCollisions(state.bullets, state.enemies)
    state.bullets = collisions.bullets
    state.score += collisions.points
    if (state.enemies.every(enemy => !enemy.alive)) { state.status = 'won'; clearSpaceKeys(state) }
    return state
}
