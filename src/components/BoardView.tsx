import { useRef } from 'react'
import { motion } from 'motion/react'
import type { Board, Direction } from '../game/engine'

export function BoardView({
  board,
  label,
  target = false,
  onSwipe,
}: {
  board: Board
  label: string
  target?: boolean
  onSwipe?: (direction: Direction) => void
}) {
  const touch = useRef<{ x: number; y: number } | null>(null)
  return (
    <div
      className={`board ${target ? 'board-target' : ''}`}
      role="group"
      aria-label={label}
      onTouchStart={(event) => {
        touch.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        }
      }}
      onTouchEnd={(event) => {
        if (!touch.current || !onSwipe) return
        const dx = event.changedTouches[0].clientX - touch.current.x
        const dy = event.changedTouches[0].clientY - touch.current.y
        touch.current = null
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return
        onSwipe(
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 'right'
              : 'left'
            : dy > 0
              ? 'down'
              : 'up',
        )
      }}
    >
      {board.map((value, index) => (
        <div
          role="img"
          className={`cell tile-${value}`}
          key={index}
          aria-label={`Row ${Math.floor(index / 4) + 1}, column ${(index % 4) + 1}: ${value || 'empty'}`}
        >
          {value > 0 && (
            <motion.span
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.16 }}
            >
              {value}
            </motion.span>
          )}
        </div>
      ))}
    </div>
  )
}
