import { directions, replay } from './engine'
import type { Direction, Puzzle } from './engine'

interface Progress {
  moves: Direction[]
  attempts: number
  hints: number
}
export function readProgress(puzzle: Puzzle): Progress {
  try {
    const saved = JSON.parse(
      localStorage.getItem(`reverse-v1:${puzzle.seed}:${puzzle.difficulty}`) ||
        'null',
    )
    if (
      saved &&
      Array.isArray(saved.moves) &&
      saved.moves.length <= puzzle.solution.length &&
      saved.moves.every((value: Direction) => directions.includes(value)) &&
      Number.isInteger(saved.attempts) &&
      saved.attempts >= 0 &&
      Number.isInteger(saved.hints) &&
      saved.hints >= 0
    ) {
      replay(puzzle, saved.moves)
      return saved
    }
  } catch {
    /* Storage may be unavailable. */
  }
  return { moves: [], attempts: 0, hints: 0 }
}
