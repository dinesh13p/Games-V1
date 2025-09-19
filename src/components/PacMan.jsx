import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Enhanced maze with better layout
const initialMaze = [
    ["W","W","W","W","W","W","W","W","W","W","W","W","W","W","W"],
    ["W","P","P","P","P","P","P","W","P","P","P","P","P","P","W"],
    ["W","O","W","W","P","W","W","W","W","W","P","W","W","O","W"],
    ["W","P","P","P","P","P","P","P","P","P","P","P","P","P","W"],
    ["W","P","W","W","P","W","P","P","P","W","P","W","W","P","W"],
    ["W","P","P","P","P","W","P","P","P","W","P","P","P","P","W"],
    ["W","W","W","W","P","P","P","P","P","P","P","W","W","W","W"],
    ["E","E","E","W","P","W","W","E","W","W","P","W","E","E","E"],
    ["W","W","W","W","P","W","E","E","E","W","P","W","W","W","W"],
    ["W","P","P","P","P","W","P","P","P","W","P","P","P","P","W"],
    ["W","P","W","W","P","W","P","P","P","W","P","W","W","P","W"],
    ["W","P","P","P","P","P","P","P","P","P","P","P","P","P","W"],
    ["W","O","W","W","P","W","W","W","W","W","P","W","W","O","W"],
    ["W","P","P","P","P","P","P","W","P","P","P","P","P","P","W"],
    ["W","W","W","W","W","W","W","W","W","W","W","W","W","W","W"],
];

// Difficulty configuration and speed tuning per level
const PACMAN_BASE_START = { x: 1, y: 13 };
const GHOST_BASE_STARTS = [
    { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 } },
    { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 } },
    { x: 7, y: 7, color: 'cyan', direction: { dx: 0, dy: 1 } },
    { x: 7, y: 6, color: 'orange', direction: { dx: 0, dy: -1 } },
    { x: 7, y: 8, color: 'green', direction: { dx: 1, dy: 0 } },
];

const DIFFICULTIES = {
    Beginner: { scale: 1, ghosts: 2, baseSpeed: 200, powerSpeed: 350, ambushAhead: 4 },
    Intermediate: { scale: 1.5, ghosts: 3, baseSpeed: 160, powerSpeed: 280, ambushAhead: 5 },
    Advanced: { scale: 2, ghosts: 5, baseSpeed: 120, powerSpeed: 220, ambushAhead: 6 },
};

let GHOST_BASE_SPEED = 200;
let GHOST_POWER_SPEED = 350;

export default function PacMan() {
    const navigate = useNavigate();
    const handleBackToHome = () => {
        navigate('/');
    };
    const [difficulty, setDifficulty] = useState('Beginner');
    const [maze, setMaze] = useState(() => initialMaze.map(row => [...row]));
    const [pacman, setPacman] = useState({ x: 1, y: 13 });
    const [ghosts, setGhosts] = useState([
        { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 },
        { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 }
    ]);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('waiting'); // 'waiting', 'playing', 'gameOver', 'won'
    const [powerMode, setPowerMode] = useState(false);
    const [powerTimer, setPowerTimer] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage?.getItem?.('pacmanHighScore');
            return saved ? parseInt(saved) : 0;
        } catch {
            return 0;
        }
    });

    // Helper to track Pac-Man's last direction for better ambush AI
    const [lastDirection, setLastDirection] = useState({ dx: 0, dy: 0 });

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save high score to localStorage
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            try {
                localStorage?.setItem?.('pacmanHighScore', score.toString());
            } catch (error) {
                console.warn('Could not save high score:', error);
            }
        }
    }, [score, highScore]);

    // Utility: scale maze nearest-neighbor style
    const scaleMaze = useCallback((baseMaze, factor) => {
        if (factor === 1) return baseMaze.map(r => [...r]);
        const rows = baseMaze.length;
        const cols = baseMaze[0].length;
        const newRows = Math.max(1, Math.round(rows * factor));
        const newCols = Math.max(1, Math.round(cols * factor));
        const scaled = Array.from({ length: newRows }, (_, r) => (
            Array.from({ length: newCols }, (_, c) => {
                const br = Math.min(rows - 1, Math.max(0, Math.floor(r / factor)));
                const bc = Math.min(cols - 1, Math.max(0, Math.floor(c / factor)));
                return baseMaze[br][bc];
            })
        ));
        return scaled;
    }, []);

    // Utility: find nearest non-wall cell
    const findNearestOpenCell = useCallback((grid, startX, startY) => {
        const h = grid.length;
        const w = grid[0].length;
        const inBounds = (x, y) => y >= 0 && y < h && x >= 0 && x < w;
        const isOpen = (x, y) => inBounds(x, y) && grid[y][x] !== 'W';
        if (isOpen(startX, startY)) return { x: startX, y: startY };
        const queue = [{ x: startX, y: startY }];
        const seen = new Set([startX + ',' + startY]);
        const dirs = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        while (queue.length) {
            const cur = queue.shift();
            for (const d of dirs) {
                const nx = cur.x + d.dx;
                const ny = cur.y + d.dy;
                const k = nx + ',' + ny;
                if (seen.has(k)) continue;
                seen.add(k);
                if (isOpen(nx, ny)) return { x: nx, y: ny };
                if (inBounds(nx, ny)) queue.push({ x: nx, y: ny });
            }
        }
        return { x: Math.min(w - 1, Math.max(0, startX)), y: Math.min(h - 1, Math.max(0, startY)) };
    }, []);

    const createLevelState = useCallback((levelKey) => {
        const cfg = DIFFICULTIES[levelKey];
        const scaled = scaleMaze(initialMaze, cfg.scale);
        const w = scaled[0].length;
        const h = scaled.length;
        // Set speeds
        GHOST_BASE_SPEED = cfg.baseSpeed;
        GHOST_POWER_SPEED = cfg.powerSpeed;
        // Scale positions
        const px = Math.min(w - 1, Math.max(0, Math.round(PACMAN_BASE_START.x * cfg.scale)));
        const py = Math.min(h - 1, Math.max(0, Math.round(PACMAN_BASE_START.y * cfg.scale)));
        const pacStart = findNearestOpenCell(scaled, px, py);
        // Ghosts
        const ghostList = [];
        for (let i = 0; i < cfg.ghosts; i++) {
            const base = GHOST_BASE_STARTS[i % GHOST_BASE_STARTS.length];
            const gx = Math.min(w - 1, Math.max(0, Math.round(base.x * cfg.scale)));
            const gy = Math.min(h - 1, Math.max(0, Math.round(base.y * cfg.scale)));
            const gStart = findNearestOpenCell(scaled, gx, gy);
            ghostList.push({
                x: gStart.x,
                y: gStart.y,
                color: base.color,
                direction: { ...base.direction },
                mode: 'chase',
                targetX: pacStart.x,
                targetY: pacStart.y,
            });
        }
        return { scaled, pacStart, ghostList, cfg };
    }, [scaleMaze, findNearestOpenCell]);

    const startGame = useCallback(() => {
        setGameState('playing');
        setScore(0);
        setPowerMode(false);
        setPowerTimer(0);
        const { scaled, pacStart, ghostList, cfg } = createLevelState(difficulty);
        setMaze(scaled);
        setPacman({ x: pacStart.x, y: pacStart.y });
        setGhosts(ghostList);
        // update per-level AI parameters
        setLastDirection({ dx: 0, dy: 0 });
        setAmbushAhead(cfg.ambushAhead);
    }, [difficulty, createLevelState]);

    const [ambushAhead, setAmbushAhead] = useState(DIFFICULTIES['Beginner'].ambushAhead);

    const movePacman = useCallback((dx, dy) => {
        if (gameState !== 'playing') return;
        setLastDirection({ dx, dy }); // Track last movement direction
        
        const newX = pacman.x + dx;
        const newY = pacman.y + dy;
        
        // Handle tunnel effect (wrap around)
        const width = maze[0].length;
        const height = maze.length;
        let finalX = newX;
        if (newX < 0) finalX = width - 1;
        if (newX > width - 1) finalX = 0;
        
        // Check bounds for Y
        if (newY < 0 || newY >= height) return;
        
        // Check for walls
        if (maze[newY] && maze[newY][finalX] === "W") return;
        
        let updatedMaze = maze.map(row => [...row]);
        let newScore = score;
        
        // Handle pellet collection
        if (maze[newY][finalX] === "P") {
            newScore += 10;
            updatedMaze[newY][finalX] = "E";
        }
        
        // Handle power pellet collection
        if (maze[newY][finalX] === "O") {
            newScore += 50;
            updatedMaze[newY][finalX] = "E";
            setPowerMode(true);
            setPowerTimer(5000); // 5 seconds of power mode
        }
        
        setMaze(updatedMaze);
        setPacman({ x: finalX, y: newY });
        setScore(newScore);
    }, [maze, pacman, gameState, score]);

    // Keyboard input
    useEffect(() => {
        if (isMobile) return;

        const handleKey = (e) => {
            e.preventDefault();
            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    movePacman(0, -1);
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    movePacman(0, 1);
                    break;
                case "ArrowLeft":
                case "a":
                case "A":
                    movePacman(-1, 0);
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    movePacman(1, 0);
                    break;
                case " ":
                    if (gameState === 'waiting') {
                        startGame();
                    } else if (gameState !== 'playing') {
                        restartGame();
                    }
                    break;
                default:
                    break;
            }
        };
        
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [movePacman, gameState, isMobile, startGame]);

    const restartGame = useCallback(() => {
        setMaze(initialMaze.map(row => [...row]));
        setPacman({ x: 1, y: 13 });
        setGhosts([
            { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 },
            { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 }
        ]);
        setScore(0);
        setGameState('playing');
        setPowerMode(false);
        setPowerTimer(0);
    }, []);

    // Power mode timer
    useEffect(() => {
        if (powerTimer > 0) {
            const interval = setInterval(() => {
                setPowerTimer(prev => {
                    if (prev <= 100) {
                        setPowerMode(false);
                        return 0;
                    }
                    return prev - 100;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [powerTimer]);

    // Advanced Ghost AI with proper pathfinding
    const getDistance = (x1, y1, x2, y2) => {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    };

    const isValidMove = (x, y) => {
        // Handle tunnel effect
        const width = maze[0].length;
        const height = maze.length;
        let finalX = x;
        if (x < 0) finalX = width - 1;
        if (x > width - 1) finalX = 0;
        
        // Check bounds and walls
        if (y < 0 || y >= height) return false;
        if (maze[y] && maze[y][finalX] === "W") return false;
        
        return true;
    };

    const findBestPathToTarget = (ghost, targetX, targetY) => {
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 1, dy: 0, name: 'right' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' }
        ];
        
        // Filter valid directions (avoid walls and immediate reversal unless necessary)
        let validDirections = directions.filter(dir => {
            const newX = ghost.x + dir.dx;
            const newY = ghost.y + dir.dy;
            
            if (!isValidMove(newX, newY)) return false;
            
            // Avoid immediate reversal unless it's the only option
            const isReverse = (dir.dx === -ghost.direction.dx && dir.dy === -ghost.direction.dy);
            return !isReverse;
        });

        // If no valid directions (corner case), allow reversal
        if (validDirections.length === 0) {
            validDirections = directions.filter(dir => {
                const newX = ghost.x + dir.dx;
                const newY = ghost.y + dir.dy;
                return isValidMove(newX, newY);
            });
        }

        if (validDirections.length === 0) return ghost.direction;

        // Calculate distances for each direction
        validDirections.forEach(dir => {
            const newX = ghost.x + dir.dx;
            const newY = ghost.y + dir.dy;
            
            // Handle tunnel effect for distance calculation
            let finalX = newX;
            if (newX < 0) finalX = 14;
            if (newX > 14) finalX = 0;
            
            dir.distance = getDistance(finalX, newY, targetX, targetY);
        });

        // Sort by distance (closest first for chase, furthest first for flee)
        if (powerMode && ghost.mode === 'flee') {
            validDirections.sort((a, b) => b.distance - a.distance);
        } else {
            validDirections.sort((a, b) => a.distance - b.distance);
        }

        // Add some controlled randomness (20% chance to not pick optimal)
        if (Math.random() < 0.2 && validDirections.length > 1) {
            return validDirections[Math.floor(Math.random() * Math.min(2, validDirections.length))];
        }

        return validDirections[0];
    };

    const updateGhostBehavior = (ghost) => {
        let targetX = pacman.x;
        let targetY = pacman.y;
        
        const width = maze[0].length;
        const height = maze.length;
        // Improved ghost AI: Red predicts next cell, Pink ambushes ahead (level-scaled)
        if (ghost.color === 'red') {
            // Predict Pac-Man's next cell
            targetX = pacman.x + lastDirection.dx;
            targetY = pacman.y + lastDirection.dy;
            targetX = Math.max(0, Math.min(width - 1, targetX));
            targetY = Math.max(0, Math.min(height - 1, targetY));
        } else if (ghost.color === 'pink') {
            // Ambush 4 cells ahead of Pac-Man
            const direction = getMovementDirection();
            targetX = pacman.x + direction.dx * ambushAhead;
            targetY = pacman.y + direction.dy * ambushAhead;
            targetX = Math.max(0, Math.min(width - 1, targetX));
            targetY = Math.max(0, Math.min(height - 1, targetY));
        } else if (ghost.color === 'cyan') {
            // Predictive with perpendicular offset
            const dir = getMovementDirection();
            const offset = { dx: dir.dy, dy: -dir.dx }; // perpendicular
            targetX = pacman.x + dir.dx * (ambushAhead - 1) + offset.dx * 2;
            targetY = pacman.y + dir.dy * (ambushAhead - 1) + offset.dy * 2;
            targetX = Math.max(0, Math.min(width - 1, targetX));
            targetY = Math.max(0, Math.min(height - 1, targetY));
        } else if (ghost.color === 'orange') {
            // Clyde-like: chase if far, scatter if near
            const dist = getDistance(ghost.x, ghost.y, pacman.x, pacman.y);
            if (dist > Math.max(6, Math.round(ambushAhead))) {
                targetX = pacman.x;
                targetY = pacman.y;
            } else {
                targetX = 0;
                targetY = height - 1;
            }
        } else if (ghost.color === 'green') {
            // Opportunistic: slightly random chase around predicted target
            const dir = getMovementDirection();
            targetX = pacman.x + dir.dx * (ambushAhead - 2);
            targetY = pacman.y + dir.dy * (ambushAhead - 2);
            targetX += Math.sign(Math.random() - 0.5) * 1;
            targetY += Math.sign(Math.random() - 0.5) * 1;
            targetX = Math.max(0, Math.min(width - 1, targetX));
            targetY = Math.max(0, Math.min(height - 1, targetY));
        }

        // In power mode, ghosts flee from Pacman
        if (powerMode) {
            ghost.mode = 'flee';
            // Flee to opposite corner
            targetX = ghost.x < Math.floor(width / 2) ? width - 1 : 0;
            targetY = ghost.y < Math.floor(height / 2) ? height - 1 : 0;
        } else {
            ghost.mode = 'chase';
        }

        ghost.targetX = targetX;
        ghost.targetY = targetY;

        return findBestPathToTarget(ghost, targetX, targetY);
    };

    // Helper to determine Pacman's movement direction for ambush AI
    const getMovementDirection = () => lastDirection;

    // Ghost movement with advanced AI
    useEffect(() => {
        if (gameState !== 'playing') return;
        
        const width = maze[0].length;
        const height = maze.length;
        const interval = setInterval(() => {
            setGhosts(prevGhosts => prevGhosts.map(ghost => {
                const newDirection = updateGhostBehavior(ghost);
                
                if (!newDirection) return ghost;
                
                const newX = ghost.x + newDirection.dx;
                const newY = ghost.y + newDirection.dy;
                
                // Handle tunnel effect
                let finalX = newX;
                if (newX < 0) finalX = width - 1;
                if (newX > width - 1) finalX = 0;
                
                // Validate the move
                if (isValidMove(finalX, newY)) {
                    return {
                        ...ghost,
                        x: finalX,
                        y: newY,
                        direction: newDirection
                    };
                }
                
                return ghost;
            }));
        }, powerMode ? GHOST_POWER_SPEED : GHOST_BASE_SPEED); // Ghosts move slower in power mode
        
        return () => clearInterval(interval);
    }, [gameState, pacman, powerMode, maze, lastDirection]);

    // Check collisions and win condition
    useEffect(() => {
        if (gameState !== 'playing') return;
        
        // Check ghost collisions
        const collidingGhostIndex = ghosts.findIndex(ghost => 
            Math.abs(ghost.x - pacman.x) <= 0.8 && Math.abs(ghost.y - pacman.y) <= 0.8
        );
        
        if (collidingGhostIndex !== -1) {
            if (powerMode) {
                // Pac-Man eats ghost - respawn ghost and award points
                setScore(prev => prev + 200);
                setGhosts(prevGhosts => prevGhosts.map((ghost, index) => {
                    if (index === collidingGhostIndex) {
                        return { ...ghost, x: 7, y: 7 }; // Respawn at center
                    }
                    return ghost;
                }));
            } else {
                setGameState('gameOver');
            }
        }
        
        // Check win condition (all pellets collected)
        const hasRemainingPellets = maze.some(row => 
            row.some(cell => cell === "P" || cell === "O")
        );
        
        if (!hasRemainingPellets) {
            setGameState('won');
        }
    }, [pacman, ghosts, gameState, powerMode, maze]);

    // const restartGame = () => {
    //     setMaze(initialMaze.map(row => [...row]));
    //     setPacman({ x: 1, y: 13 });
    //     setGhosts([
    //         { x: 6, y: 7, color: 'red', direction: { dx: 1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 },
    //         { x: 8, y: 7, color: 'pink', direction: { dx: -1, dy: 0 }, mode: 'chase', targetX: 1, targetY: 13 }
    //     ]);
    //     setScore(0);
    //     setGameState('playing');
    //     setPowerMode(false);
    //     setPowerTimer(0);
    // };

    const resetScores = () => {
        setHighScore(0);
        try {
            localStorage?.removeItem?.('pacmanHighScore');
        } catch (error) {
            console.warn('Could not clear high score:', error);
        }
    };

    const handleDifficultyChange = (e) => {
        const key = e.target.value;
        setDifficulty(key);
        const { scaled, pacStart, ghostList, cfg } = createLevelState(key);
        setMaze(scaled);
        setPacman({ x: pacStart.x, y: pacStart.y });
        setGhosts(ghostList);
        setScore(0);
        setGameState('waiting');
        setPowerMode(false);
        setPowerTimer(0);
        setLastDirection({ dx: 0, dy: 0 });
        setAmbushAhead(cfg.ambushAhead);
    };


    const getCellDisplay = (cell, x, y) => {
        // Check if Pac-Man is on this cell
        if (Math.abs(pacman.x - x) < 0.1 && Math.abs(pacman.y - y) < 0.1) {
            return <div className="w-full h-full bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold border border-yellow-600">🟡</div>;
        }
        
        // Check if any ghost is on this cell
        const ghostOnCell = ghosts.find(ghost => 
            Math.abs(ghost.x - x) < 0.1 && Math.abs(ghost.y - y) < 0.1
        );
        
        if (ghostOnCell) {
            if (powerMode) {
                return <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-800">👻</div>;
            } else {
                const ghostColor = ghostOnCell.color === 'red' ? 'bg-red-500 border-red-700' : 'bg-pink-500 border-pink-700';
                const ghostEmoji = ghostOnCell.color === 'red' ? '🔴' : '🩷';
                return <div className={`w-full h-full ${ghostColor} rounded-full flex items-center justify-center text-xs font-bold border`}>{ghostEmoji}</div>;
            }
        }
        
        // Regular cell content
        switch (cell) {
            case "W":
                return <div className="w-full h-full bg-blue-800 border border-blue-600 rounded-sm"></div>;
            case "P":
                return <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full"></div>
                </div>;
            case "O":
                return <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>;
            default:
                return <div className="w-full h-full bg-black"></div>;
        }
    };

    // Mobile restriction message
    if (isMobile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl fade-in max-w-4xl w-full transform transition-all duration-500">
                    <div className="flex justify-center items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">🥠 Pac-Man</h1>
                    </div>

                    <div className="text-center">
                        <div className="mb-8 bg-blue-50 p-8 rounded-xl border-2 border-blue-200">
                            <h2 className="text-2xl font-bold text-blue-600 mb-4">⌨️ Desktop Experience Required</h2>
                            <p className="text-lg text-gray-700 mb-4">
                                This game requires keyboard controls for precise movement and gameplay.
                            </p>
                            <p className="text-gray-600">
                                Please access this game on a desktop or laptop computer to enjoy the full Pac-Man experience with arrow key or WASD movement.
                            </p>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .fade-in {
                        animation: fadeIn 0.5s ease-out;
                    }
                    .game-board {
                        backdrop-filter: blur(10px);
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 16px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    }
                    .btn-secondary {
                        background: linear-gradient(45deg, #764ba2, #667eea);
                        transition: all 0.3s ease;
                        border: none;
                        cursor: pointer;
                    }
                    .btn-secondary:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                        filter: brightness(1.1);
                    }
                    @keyframes fadeIn {
                        from { 
                            opacity: 0; 
                            transform: translateY(20px); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">

            <main className="flex items-center justify-center p-6">
                <div className="game-board p-8 rounded-2xl fade-in max-w-4xl w-full transform transition-all duration-500 bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-black">🥠 Pac-Man</h1>
                        <button 
                            className="btn-secondary text-white px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105"
                            onClick={resetScores}
                            aria-label="Reset high score"
                        >
                            Reset High Score
                        </button>
                    </div>

                {/* Score Board */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-blue-600 mb-1">Current Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{score}</div>
                        <div className="text-xs text-gray-500">This Game</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-yellow-600 mb-1">🏆 High Score</div>
                        <div className="text-3xl font-semibold text-gray-700">{highScore}</div>
                        <div className="text-xs text-gray-500">Best Ever</div>
                    </div>
                    <div className="text-center p-4 bg-purple-100 rounded-xl transform transition-all duration-300 hover:scale-105">
                        <div className="text-xl font-bold text-purple-600 mb-1">Power Mode</div>
                        <div className="text-3xl font-semibold text-gray-700">
                            {powerMode ? `${Math.ceil(powerTimer/1000)}s` : "Off"}
                        </div>
                        <div className="text-xs text-gray-500">{powerMode ? "Active" : "Inactive"}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-center transform transition-all duration-300">
                        {gameState === 'waiting' ? (
                            <span className="text-blue-600 animate-pulse">🎮 Ready to Play!</span>
                        ) : gameState === 'playing' ? (
                            <span className="text-green-600 animate-pulse">🎮 Playing...</span>
                        ) : gameState === 'gameOver' ? (
                            <span className="text-red-500 animate-bounce-slow">💥 Game Over!</span>
                        ) : (
                            <span className="text-yellow-600 animate-pulse-slow">🎉 You Win!</span>
                        )}
                    </h2>

                    {/* Game Board */}
                    <div className="mb-6">
                        <div className="inline-block p-6 bg-gray-50 rounded-xl shadow-lg border-4 border-blue-600" 
                            style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 15}, 1fr)` }} role="presentation" aria-label="Pac-Man game board">
                                {maze.map((row, y) => 
                                    row.map((cell, x) => (
                                        <div key={`${x}-${y}`} className="w-6 h-6 relative">
                                            {getCellDisplay(cell, x, y)}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Game Controls */}
                    {gameState === 'waiting' && (
                        <div className="flex gap-4 mb-6">
                            <button
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={startGame}
                                aria-label="Start the game"
                            >
                                🎮 Start Game
                            </button>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-700">Difficulty:</label>
                                <select
                                    className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none bg-white text-black"
                                    value={difficulty}
                                    onChange={handleDifficultyChange}
                                >
                                    {Object.keys(DIFFICULTIES).map((k) => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {gameState !== 'playing' && gameState !== 'waiting' && (
                        <div className="flex gap-4 mb-6">
                            <button
                                className="btn-primary text-white px-6 py-3 rounded-lg font-bold transform transition-all duration-200 hover:scale-105"
                                onClick={restartGame}
                                aria-label="Start a new game"
                            >
                                🎮 {gameState === 'gameOver' ? 'Try Again' : 'Play Again'}
                            </button>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-700">Difficulty:</label>
                                <select
                                    className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none bg-white"
                                    value={difficulty}
                                    onChange={handleDifficultyChange}
                                >
                                    {Object.keys(DIFFICULTIES).map((k) => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-6 text-center text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                        <p className="mb-2">🎯 <strong>How to Play:</strong></p>
                        <p>Use Arrow Keys or WASD to move Pac-Man around the maze</p>
                        <p>Collect all pellets while avoiding ghosts</p>
                        <p className="mt-2">💛 Power pellets make ghosts vulnerable for a short time!</p>
                        <p className="mt-2 text-xs text-gray-500">
                            {gameState === 'waiting' ? 'Press Space or click Start Game to begin!' : 
                             gameState !== 'playing' ? 'Press Space to restart' : 'Collect all pellets to win!'}
                        </p>
                    </div>
                </div>
                </div>
            </main>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                .game-board {
                    backdrop-filter: blur(10px);
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
                .btn-primary {
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    transition: all 0.3s ease;
                    transform: translateY(0);
                    border: none;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }
                .btn-secondary {
                    background: linear-gradient(45deg, #764ba2, #667eea);
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                }
                .btn-secondary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }
                @keyframes fadeIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                .animate-pulse-slow {
                    animation: pulse 2s infinite;
                }
                .animate-bounce-slow {
                    animation: bounce 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% {
                        transform: translate3d(0, 0, 0);
                    }
                    40%, 43% {
                        transform: translate3d(0, -8px, 0);
                    }
                    70% {
                        transform: translate3d(0, -4px, 0);
                    }
                    90% {
                        transform: translate3d(0, -2px, 0);
                    }
                }
            `}</style>
        </div>
    );
}