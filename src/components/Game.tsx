import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Check,
  ChevronDown,
  CornerUpLeft,
  Flag,
  Lightbulb,
  Link,
  Play,
  RotateCcw,
  Shuffle,
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
import { progressKey, readProgress } from '../game/progress'
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
      localStorage.setItem(progressKey(puzzle), JSON.stringify(progress))
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
        setNotice('No move that way.')
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

  function reset() {
    setPlaying(false)
    setCursor(null)
    setNotice('')
    setProgress((value) => ({ ...value, moves: [] }))
  }

  function hint() {
    if (preview || solved) return
    const mismatch = moves.findIndex(
      (direction, index) => direction !== puzzle.solution[index],
    )
    const step = mismatch >= 0 ? mismatch : moves.length
    if (step >= limit) return
    setNotice(
      mismatch >= 0
        ? `Revisit move ${step + 1}: try ${puzzle.solution[step]}. Undo to that step.`
        : `Next move: move ${step + 1} is ${puzzle.solution[step]}.`,
    )
    setProgress((value) => ({ ...value, hints: value.hints + 1 }))
  }

  function toggleReplay() {
    if (preview) {
      setPlaying(false)
      setCursor(null)
    } else if (moves.length) {
      setCursor(0)
      setPlaying(true)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        document.querySelector('dialog[open]') ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)))
      )
        return
      const key = event.key.toLowerCase()
      if (event.altKey) return
      if (event.ctrlKey || event.metaKey) {
        if (key === 'z' && !event.shiftKey) {
          event.preventDefault()
          undo()
        }
        return
      }
      const keys: Record<string, Direction> = {
        arrowup: 'up',
        arrowright: 'right',
        arrowdown: 'down',
        arrowleft: 'left',
        w: 'up',
        d: 'right',
        s: 'down',
        a: 'left',
      }
      const actions: Record<string, () => void> = {
        z: undo,
        backspace: undo,
        r: reset,
        h: hint,
        p: toggleReplay,
        n: onNew,
        '?': onHelp,
        escape: () => {
          setPlaying(false)
          setCursor(null)
        },
      }
      if (keys[key]) {
        event.preventDefault()
        makeMove(keys[key])
      } else if (actions[key]) {
        event.preventDefault()
        actions[key]()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Puzzle link copied.')
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
            <strong>{daily ? 'Daily puzzle' : 'Puzzle'}</strong>
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
              className="help-button"
              aria-label="Copy puzzle link"
              onClick={share}
            >
              <Link size={17} /> Share
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
                <span>{preview ? `Step ${cursor} / ${moves.length}` : ''}</span>
                <button
                  className="text-button"
                  disabled={!moves.length && !preview}
                  aria-label={preview ? 'Back to live' : 'Replay'}
                  aria-keyshortcuts="p"
                  onClick={toggleReplay}
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
                  <kbd aria-hidden="true">P</kbd>
                </button>
              </div>
            </div>
          </div>
          <aside className="control-panel">
            <h2>
              {solved ? 'Solved.' : complete ? 'Not a match.' : 'Your move'}
            </h2>
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
                  ↑ ↓ ← → / <kbd>W</kbd>
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
                aria-label="Undo"
                aria-keyshortcuts="z Backspace Control+z Meta+z"
                onClick={undo}
              >
                <CornerUpLeft size={16} />
                Undo <kbd aria-hidden="true">Z</kbd>
              </button>
              <button
                className="secondary-button"
                disabled={!moves.length}
                aria-label="Reset"
                aria-keyshortcuts="r"
                onClick={reset}
              >
                <RotateCcw size={15} />
                Reset <kbd aria-hidden="true">R</kbd>
              </button>
            </div>
            {solved ? (
              <button
                className="hint-button"
                aria-keyshortcuts="n"
                onClick={onNew}
              >
                <Shuffle size={17} />
                Next puzzle
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="hint-button"
                aria-label="Hint"
                aria-keyshortcuts="h"
                onClick={hint}
                disabled={preview}
              >
                <Lightbulb size={17} />
                Hint<kbd aria-hidden="true">H</kbd>
              </button>
            )}
            <div
              className={`game-notice ${solved ? 'success-notice' : ''}`}
              role="status"
              aria-live="polite"
            >
              {notice ||
                (solved
                  ? 'Exact match.'
                  : complete
                    ? 'Undo or reset to try again.'
                    : '')}
            </div>
          </aside>
        </div>
        <div className="puzzle-bottom">
          <span>Spawns: first empty cell from top left.</span>
          <button
            className="text-button new-puzzle"
            aria-label="New puzzle"
            aria-keyshortcuts="n"
            onClick={onNew}
          >
            <Shuffle size={15} />
            New puzzle<kbd aria-hidden="true">N</kbd>
          </button>
        </div>
      </section>
    </>
  )
}
