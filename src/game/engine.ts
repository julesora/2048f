export const directions = ['up', 'right', 'down', 'left'] as const
export type Direction = (typeof directions)[number]
export type Board = number[]
export type Difficulty = 'easy' | 'medium' | 'hard'
export const moveCounts: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 }
export interface Puzzle {
  seed: string
  difficulty: Difficulty
  start: Board
  target: Board
  solution: Direction[]
}

export function hash(text: string): number {
  let value = 2166136261
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

function random(seed: number) {
  let state = seed
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function sameBoard(a: Board, b: Board) {
  return a.every((value, index) => value === b[index])
}

export function slide(board: Board, direction: Direction): Board {
  const next = Array<number>(16).fill(0)
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, offset) => {
      if (direction === 'left') return line * 4 + offset
      if (direction === 'right') return line * 4 + 3 - offset
      if (direction === 'up') return offset * 4 + line
      return (3 - offset) * 4 + line
    })
    const values = indices.map((index) => board[index]).filter(Boolean)
    const merged: number[] = []
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        merged.push(values[i] * 2)
        i++
      } else merged.push(values[i])
    }
    indices.forEach((index, offset) => { next[index] = merged[offset] ?? 0 })
  }
  return next
}

export function move(board: Board, direction: Direction, seed: string, step: number): Board | null {
  const next = slide(board, direction)
  if (sameBoard(board, next)) return null
  const empty = next.flatMap((value, index) => value === 0 ? [index] : [])
  const rng = random(hash(`${seed}:spawn:${step}`))
  next[empty[Math.floor(rng() * empty.length)]] = rng() < 0.9 ? 2 : 4
  return next
}

export function replay(puzzle: Puzzle, moves: Direction[]): Board[] {
  const boards = [puzzle.start]
  moves.forEach((direction, step) => {
    const next = move(boards[boards.length - 1], direction, puzzle.seed, step)
    if (!next) throw new Error('Sequence contains a move that does not change the board.')
    boards.push(next)
  })
  return boards
}

export function createPuzzle(seed: string, difficulty: Difficulty): Puzzle {
  const rng = random(hash(`${seed}:${difficulty}:v1`))
  const length = moveCounts[difficulty]
  for (let attempt = 0; attempt < 20; attempt++) {
    const start = Array<number>(16).fill(0)
    for (let tile = 0; tile < 5; tile++) {
      const empty = start.flatMap((value, index) => value === 0 ? [index] : [])
      start[empty[Math.floor(rng() * empty.length)]] = tile === 0 ? 8 : rng() < 0.7 ? 2 : 4
    }
    const endings = new Map<string, { board: Board; path: Direction[]; count: number }>()
    const visit = (board: Board, path: Direction[]) => {
      if (path.length === length) {
        const key = board.join(',')
        const existing = endings.get(key)
        if (existing) existing.count++
        else endings.set(key, { board, path, count: 1 })
        return
      }
      for (const direction of directions) {
        const next = move(board, direction, seed, path.length)
        if (next) visit(next, [...path, direction])
      }
    }
    // Keep only targets with exactly one valid sequence of this length.
    visit(start, [])
    const unique = [...endings.values()].filter((ending) => ending.count === 1)
    if (unique.length) {
      const ending = unique[Math.floor(rng() * unique.length)]
      return { seed, difficulty, start, target: ending.board, solution: ending.path }
    }
  }
  throw new Error('Could not generate a unique puzzle.')
}
