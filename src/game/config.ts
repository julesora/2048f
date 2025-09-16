import type { Difficulty } from './engine'

export const today = () => new Date().toISOString().slice(0, 10)

export function getConfig() {
  const params = new URLSearchParams(window.location.search)
  const level = params.get('level')
  return {
    seed: params.get('puzzle')?.slice(0, 100) || today(),
    difficulty: (level === 'easy' || level === 'hard'
      ? level
      : 'medium') as Difficulty,
  }
}
