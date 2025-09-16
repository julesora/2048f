import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CornerUpLeft,
  Flag,
  Lightbulb,
  Link,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react'
import {
  directions,
  hash,
  move,
  moveCounts,
  replay,
  sameBoard,
} from '../game/engine'
import type { Difficulty, Direction, Puzzle } from '../game/engine'
import { readProgress } from '../game/progress'
import { today } from '../game/config'
import { BoardView } from './BoardView'

const arrowIcons = {
  up: ArrowUp,
  right: ArrowRight,
  down: ArrowDown,
  left: ArrowLeft,
}
const difficultyNames = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export function Game({
  puzzle,
  onNew,
  onDifficulty,
  onHelp,
}: {
  puzzle: Puzzle
  onNew: () => void
  onDifficulty: (level: Difficulty) => void
  onHelp: () => void
}) {
  const [progress, setProgress] = useState(() => readProgress(puzzle))
  const [notice, setNotice] = useState('')
  const [cursor, setCursor] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const { moves, attempts, hints } = progress
  const history = useMemo(() => replay(puzzle, moves), [puzzle, moves])
  const current = history[history.length - 1]
  const limit = puzzle.solution.length
  const complete = moves.length === limit
  const solved = complete && sameBoard(current, puzzle.target)
  const preview = cursor !== null
  const shown = history[cursor ?? moves.length]
  const daily = puzzle.seed === today()

  useEffect(() => {
    try {
      localStorage.setItem(
        `reverse-v1:${puzzle.seed}:${puzzle.difficulty}`,
        JSON.stringify(progress),
      )
    } catch {
      /* Playing works without storage. */
    }
  }, [progress, puzzle])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (cursor === null || cursor >= moves.length) {
        setPlaying(false)
        setCursor(null)
      } else setCursor(cursor + 1)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, moves.length])

  const makeMove = useCallback(
    (direction: Direction) => {
      if (complete || preview) return
      const next = move(current, direction, puzzle.seed, moves.length)
      if (!next) {
        setNotice('Those tiles cannot move that way. Try another direction.')
        return
      }
      setNotice('')
      setProgress((value) => ({
        ...value,
        moves: [...value.moves, direction],
        attempts: value.attempts + (value.moves.length + 1 === limit ? 1 : 0),
      }))
    },
    [complete, preview, current, puzzle.seed, moves.length, limit],
  )

  const undo = useCallback(() => {
    setPlaying(false)
    setCursor(null)
    setNotice('')
    setProgress((value) => ({ ...value, moves: value.moves.slice(0, -1) }))
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        document.querySelector('dialog[open]') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)))
      )
        return
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowRight: 'right',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        w: 'up',
        d: 'right',
        s: 'down',
        a: 'left',
      }
      const direction = keys[event.key]
      if (direction) {
        event.preventDefault()
        makeMove(direction)
      }
      if (event.key === 'Backspace' || event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [makeMove, undo])

  function reset() {
    setPlaying(false)
    setCursor(null)
    setNotice('')
    setProgress((value) => ({ ...value, moves: [] }))
  }

  function hint() {
    const mismatch = moves.findIndex(
      (direction, index) => direction !== puzzle.solution[index],
    )
    const step = mismatch >= 0 ? mismatch : moves.length
    if (step >= limit) return
    setNotice(
      mismatch >= 0
        ? `Revisit move ${step + 1}: try ${puzzle.solution[step]}. Undo to that step to get back on track.`
        : `A little nudge: move ${step + 1} is ${puzzle.solution[step]}.`,
    )
    setProgress((value) => ({ ...value, hints: value.hints + 1 }))
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Puzzle link copied. Same board, same challenge.')
    } catch {
      setNotice('Copy the address in your browser to share this exact puzzle.')
    }
  }

  return (
    <>
      <section className="puzzle-card" aria-label="2048 puzzle">
        <div className="puzzle-toolbar">
          <div className="puzzle-name">
            <span className="status-dot" />
            <strong>{daily ? 'The daily sequence' : 'A fresh sequence'}</strong>
            <span className="puzzle-id">
              #{hash(puzzle.seed).toString(16).slice(0, 5).toUpperCase()}
            </span>
          </div>
          <div className="toolbar-actions">
            <div className="difficulty-select">
              <span className="difficulty-bars">
                <i />
                <i />
                <i />
              </span>
              <select
                aria-label="Difficulty"
                value={puzzle.difficulty}
                onChange={(event) =>
                  onDifficulty(event.target.value as Difficulty)
                }
              >
                {Object.entries(difficultyNames).map(([value, name]) => (
                  <option value={value} key={value}>
                    {name} · {moveCounts[value as Difficulty]} moves
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <button
              className="icon-button"
              aria-label="Copy puzzle link"
              onClick={share}
            >
              <Link size={17} />
            </button>
          </div>
        </div>
        <div className="workspace">
          <div className="boards-and-sequence">
            <div className="boards">
              <div className="board-section">
                <div className="board-heading">
                  <h2>
                    <span className="label-dot" />
                    Your board
                  </h2>
                  <span>
                    {preview
                      ? `Step ${cursor}`
                      : moves.length === 0
                        ? 'Start here'
                        : `Move ${moves.length} of ${limit}`}
                  </span>
                </div>
                <BoardView
                  board={shown}
                  label="Your board"
                  onSwipe={makeMove}
                />
                <div className="board-caption">
                  <span className="small-square" />
                  {preview
                    ? 'A look back at your sequence'
                    : 'Slide the tiles. Follow the possibilities.'}
                </div>
              </div>
              <div className="board-bridge">
                <ArrowRight size={19} />
              </div>
              <div className="board-section">
                <div className="board-heading">
                  <h2>
                    <Flag size={14} />
                    The target
                  </h2>
                  <span className="target-tag">Match this</span>
                </div>
                <BoardView board={puzzle.target} label="Target board" target />
                <div className="board-caption">
                  <span className="small-square target-square" />
                  Same tiles. Exact positions.
                </div>
              </div>
            </div>
            <div className="sequence-panel">
              <div className="sequence-heading">
                <h3>Your sequence</h3>
                <span>
                  <b>{moves.length}</b> / {limit} moves
                </span>
              </div>
              <div className="sequence-track">
                <button
                  className={`sequence-start ${cursor === 0 ? 'selected' : ''}`}
                  aria-label="View starting board"
                  onClick={() => {
                    setPlaying(false)
                    setCursor(0)
                  }}
                >
                  <span />
                  <small>START</small>
                </button>
                {Array.from({ length: limit }, (_, index) => {
                  const direction = moves[index]
                  const Icon = direction ? arrowIcons[direction] : null
                  return (
                    <button
                      key={index}
                      className={`sequence-slot ${direction ? 'filled' : ''} ${cursor === index + 1 ? 'selected' : ''}`}
                      disabled={!direction}
                      aria-label={
                        direction
                          ? `View move ${index + 1}: ${direction}`
                          : `Move ${index + 1}: empty`
                      }
                      onClick={() => {
                        setPlaying(false)
                        setCursor(index + 1)
                      }}
                    >
                      {Icon ? <Icon size={22} /> : <span>{index + 1}</span>}
                    </button>
                  )
                })}
                <Flag className="sequence-flag" size={18} />
              </div>
              <div className="sequence-footer">
                <span>
                  {preview
                    ? 'Viewing your moves. Return to live to keep playing.'
                    : 'Every move counts. Make them yours.'}
                </span>
                <button
                  className="text-button"
                  disabled={!moves.length && !preview}
                  onClick={() => {
                    if (preview) {
                      setPlaying(false)
                      setCursor(null)
                    } else {
                      setCursor(0)
                      setPlaying(true)
                    }
                  }}
                >
                  {preview ? (
                    <>
                      <X size={13} /> Back to live
                    </>
                  ) : (
                    <>
                      <Play size={12} /> Replay
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <aside className="control-panel">
            <div className="move-badge">
              <Sparkles size={15} /> ONE SOLUTION. {limit} MOVES.
            </div>
            <h2>
              {solved
                ? 'Beautifully solved.'
                : complete
                  ? 'Another way awaits.'
                  : 'Make your move.'}
            </h2>
            <p>
              {solved ? (
                'You found the exact sequence. A little logic goes a long way.'
              ) : complete ? (
                'Not quite the target. Undo a move or start fresh to try a different path.'
              ) : (
                <>
                  Recreate the target in exactly <strong>{limit} moves.</strong>{' '}
                  Can you find the only way there?
                </>
              )}
            </p>
            <div className={`direction-pad ${solved ? 'solved-pad' : ''}`}>
              {solved ? (
                <div className="solved-icon">
                  <Check size={44} strokeWidth={1.5} />
                </div>
              ) : (
                directions.map((direction) => {
                  const Icon = arrowIcons[direction]
                  return (
                    <button
                      className={`direction direction-${direction}`}
                      key={direction}
                      aria-label={`Move ${direction}`}
                      disabled={complete || preview}
                      onClick={() => makeMove(direction)}
                    >
                      <Icon size={24} strokeWidth={1.7} />
                    </button>
                  )
                })
              )}
              {!solved && <span className="pad-center" />}
            </div>
            <div className="keyboard-caption">
              {solved ? (
                `${attempts} ${attempts === 1 ? 'attempt' : 'attempts'} · ${hints} ${hints === 1 ? 'hint' : 'hints'} used`
              ) : (
                <>
                  Use arrow keys or <kbd>W</kbd>
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd>
                </>
              )}
            </div>
            <div className="control-actions">
              <button
                className="secondary-button"
                disabled={!moves.length}
                onClick={undo}
              >
                <CornerUpLeft size={16} />
                Undo
              </button>
              <button
                className="secondary-button"
                disabled={!moves.length}
                onClick={reset}
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
            {solved ? (
              <button className="hint-button" onClick={onNew}>
                <Shuffle size={17} />
                Try another puzzle
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="hint-button" onClick={hint} disabled={preview}>
                <Lightbulb size={17} />A little hint<span>↗</span>
              </button>
            )}
            <div
              className={`game-notice ${solved ? 'success-notice' : ''}`}
              role="status"
              aria-live="polite"
            >
              {notice ||
                (solved ? (
                  'Perfect match. Every tile is in its place.'
                ) : complete ? (
                  'The boards don’t match yet. You can keep trying.'
                ) : (
                  <>
                    <span className="notice-dot" />
                    No timer. Just you and the puzzle.
                  </>
                ))}
            </div>
          </aside>
        </div>
        <div className="puzzle-bottom">
          <span>
            <span className="seed-icon">✳</span>Nothing left to chance. Tile
            spawns are always the same.
          </span>
          <button className="text-button" onClick={onHelp}>
            The rules <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
      <div className="below-puzzle">
        <span>A familiar game. A different kind of thinking.</span>
        <button className="text-button new-puzzle" onClick={onNew}>
          <Shuffle size={15} />
          New puzzle
          <ArrowRight size={15} />
        </button>
      </div>
    </>
  )
}
