// Space Invaders Game Logic

export const createEnemies = () => {
    const enemies = []
    const totalRows = 11
    const startX = 40
    const startY = 60
    const stepX = 45
    const stepY = 35

    for (let r = 0; r < totalRows; r++) {
        let cols, offsetX
        if (r >= totalRows - 4) {
            cols = 8
            offsetX = (600 - (cols - 1) * stepX - 30) / 2
        } else {
            cols = 10
            offsetX = (600 - (cols - 1) * stepX - 30) / 2
        }
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: offsetX + c * stepX,
                y: startY + r * stepY,
                width: 30,
                height: 20,
                alive: true,
                type: r < 2 ? 'small' : 'large',
                points: r < 2 ? 10 : 20
            })
        }
    }
    return enemies
}

export const createStars = (count = 100, width = 600, height = 600) => {
    const stars = []
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.5,
            speed: 20 + Math.random() * 30,
            opacity: Math.random() * 0.8 + 0.2
        })
    }
    return stars
}

export const createPlayer = (x = 280, y = 550, width = 40, height = 20) => ({
    x, y, width, height,
    speed: 300,
    invincible: false,
    invincibleUntil: 0
})

export const createBullet = (x, y, speed = 500, width = 4, height = 12) => ({
    x: x + 18,
    y,
    width,
    height,
    speed,
    active: true
})

export const createEnemyBullet = (x, y, speed = 150) => ({
    x: x + 13,
    y: y + 20,
    width: 4,
    height: 8,
    speed,
    active: true
})

export const updateBullets = (bullets, dt, canvasHeight) => {
    return bullets.filter(bullet => {
        bullet.y -= bullet.speed * dt
        return bullet.y > -bullet.height
    })
}

export const updateEnemyBullets = (bullets, dt, canvasHeight, player, setLives, setGameOver, setScore, setHighScore, score, time) => {
    const state = { player, setLives, setGameOver, setScore, setHighScore, score, time }
    return bullets.filter(bullet => {
        bullet.y += bullet.speed * dt
        if (!state.player.invincible &&
            bullet.x < state.player.x + state.player.width &&
            bullet.x + bullet.width > state.player.x &&
            bullet.y < state.player.y + state.player.height &&
            bullet.y + bullet.height > state.player.y) {
            state.setLives(prevLives => {
                const newLives = prevLives - 1
                if (newLives > 0) {
                    state.player.invincible = true
                    state.player.invincibleUntil = state.time + 2000
                } else {
                    state.setGameOver(true)
                    state.setHighScore(prev => Math.max(prev, state.score))
                }
                return newLives
            })
            return false
        }
        return bullet.y < canvasHeight + bullet.height
    })
}

export const updateEnemies = (enemies, direction, speed, dropDistance, dt, canvasWidth, playerY, setGameOver, setScore, setHighScore, score) => {
    let shouldDropDown = false
    const aliveEnemies = enemies.filter(e => e.alive)
    aliveEnemies.forEach(enemy => {
        const newX = enemy.x + direction * speed * dt
        if (newX <= 10 || newX + enemy.width >= canvasWidth - 10) {
            shouldDropDown = true
        }
    })
    if (shouldDropDown) {
        direction *= -1
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += dropDistance
                if (enemy.y + enemy.height >= playerY - 10) {
                    setGameOver(true)
                    setHighScore(prev => Math.max(prev, score))
                }
            }
        })
    } else {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.x += direction * speed * dt
            }
        })
    }
    return { enemies, direction }
}

export const checkBulletEnemyCollisions = (bullets, enemies, setScore) => {
    const newBullets = bullets.filter(bullet => {
        let bulletExists = true
        enemies.forEach(enemy => {
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.alive = false
                bulletExists = false
                setScore(prevScore => prevScore + enemy.points)
            }
        })
        return bulletExists
    })
    return { bullets: newBullets, enemies }
}