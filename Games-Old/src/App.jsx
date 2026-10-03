import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/games/Home/Home'
import SnakeGame from './components/games/SnakeGame/SnakeGame'
import TicTacToe from './components/games/TicTacToe/TicTacToe'
import GoGame from './components/games/GoGame/GoGame'
import FlappyBird from './components/games/FlappyBird/FlappyBird'
import FroggerGame from './components/games/FroggerGame/FroggerGame'
import DoodleJump from './components/games/DoodleJump/DoodleJump'
import PongGame from './components/games/PongGame/PongGame'
import Minesweeper from './components/games/Minesweeper/Minesweeper'
import ArcheryGame from './components/games/ArcheryGame/ArcheryGame'
import Tetris from './components/games/Tetris/Tetris'
import BrickBreaker from './components/games/BrickBreaker/BrickBreaker'
import SpaceInvaders from './components/games/SpaceInvaders/SpaceInvaders'
import PacMan from './components/games/PacMan/PacMan'
import BaghChalGame from './components/games/BaghChalGame/BaghChalGame'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/snake" element={<SnakeGame />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/go" element={<GoGame />} />
        <Route path="/flappybird" element={<FlappyBird />} />
        <Route path="/frogger" element={<FroggerGame />} />
        <Route path="/doodlejump" element={<DoodleJump />} />
        <Route path="/pong" element={<PongGame />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/archery" element={<ArcheryGame />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/brickbreaker" element={<BrickBreaker />} />
        <Route path="/spaceinvaders" element={<SpaceInvaders />} />
        <Route path="/pacman" element={<PacMan />} />
        <Route path="/baghchal" element={<BaghChalGame />} />
      </Routes>
    </div>
  )
}

export default App