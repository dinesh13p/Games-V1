import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import SnakeGame from './components/SnakeGame'
import TicTacToe from './components/TicTacToe'
import GoGame from './components/GoGame'
import FlappyBird from './components/FlappyBird'
import FroggerGame from './components/FroggerGame'
import DoodleJump from './components/DoodleJump'
import PongGame from './components/PongGame'
import Minesweeper from './components/Minesweeper'
import ArcheryGame from './components/ArcheryGame'
import Tetris from './components/Tetris'
import BrickBreaker from './components/BrickBreaker'
import SpaceInvaders from './components/SpaceInvaders'
import PacMan from './components/PacMan'
import BaghChalGame from './components/BaghChalGame'

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
