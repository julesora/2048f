import { describe, expect, it } from 'vitest'
import { createPuzzle, directions, move, replay, sameBoard, slide } from './engine'
import type { Board, Difficulty } from './engine'

const board = (row: number[]) => [...row, ...Array<number>(12).fill(0)]

describe('2048 rules', () => {
  it('merges each tile only once and preserves its input', () => {
    const input = board([2, 2, 2, 2])
    expect(slide(input, 'left')).toEqual(board([4, 4, 0, 0]))
    expect(slide(board([2, 2, 4, 0]), 'left')).toEqual(board([4, 4, 0, 0]))
    expect(input).toEqual(board([2, 2, 2, 2]))
  })
  it('slides in all four directions', () => {
    expect(slide(board([2, 0, 2, 0]), 'right')).toEqual(board([0, 0, 0, 4]))
    const vertical = [2, 0, 0, 0, 2, 0, 0, 0, ...Array<number>(8).fill(0)]
    expect(slide(vertical, 'up')).toEqual(board([4, 0, 0, 0]))
    expect(slide(vertical, 'down')).toEqual([...Array<number>(12).fill(0), 4, 0, 0, 0])
  })
  it('ignores no-op moves without spawning', () => {
    expect(move(board([2, 0, 0, 0]), 'left', 'test', 0)).toBeNull()
  })
  it('spawns deterministically after a valid move', () => {
    const input = board([2, 2, 0, 0])
    const next = move(input, 'right', 'test', 0)!
    expect(next).toEqual(move(input, 'right', 'test', 0))
    expect(next.filter(Boolean)).toHaveLength(2)
  })
})

describe('puzzles', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`has one and only one ${difficulty} solution`, () => {
      const puzzle = createPuzzle('2026-09-21', difficulty)
      expect(createPuzzle(puzzle.seed, difficulty)).toEqual(puzzle)
      expect(replay(puzzle, puzzle.solution).at(-1)).toEqual(puzzle.target)
      let solutions = 0
      const count = (current: Board, step: number) => {
        if (step === puzzle.solution.length) {
          if (sameBoard(current, puzzle.target)) solutions++
          return
        }
        for (const direction of directions) {
          const next = move(current, direction, puzzle.seed, step)
          if (next) count(next, step + 1)
        }
      }
      count(puzzle.start, 0)
      expect(solutions).toBe(1)
    })
  }
  it('generates playable puzzles across seeds', () => {
    for (let i = 0; i < 30; i++) {
      const puzzle = createPuzzle(`sample-${i}`, 'medium')
      expect(replay(puzzle, puzzle.solution).at(-1)).toEqual(puzzle.target)
    }
  })
})
