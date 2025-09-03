import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import SnakeGame from './components/SnakeGame'
import TicTacToe from './components/TicTacToe'
import FlappyBird from './components/FlappyBird'
import FroggerGame from './components/FroggerGame'
import DoodleJump from './components/DoodleJump'
import PongGame from './components/PongGame'
import SpaceInvaders from './components/SpaceInvaders'
import Minesweeper from './components/Minesweeper'
import PacMan from './components/PacMan'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/snake" element={<SnakeGame />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/flappybird" element={<FlappyBird />} />
        <Route path="/frogger" element={<FroggerGame />} />
        <Route path="/doodlejump" element={<DoodleJump />} />
        <Route path="/pong" element={<PongGame />} />
        <Route path="/spaceinvaders" element={<SpaceInvaders />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/pacman" element={<PacMan />} />
      </Routes>
    </div>
  )
}

export default App
