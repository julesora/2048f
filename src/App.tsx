import { useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { X, Keyboard } from 'lucide-react'
import { createPuzzle } from './game/engine'
import { getConfig } from './game/config'
import { Game } from './components/Game'
import './App.css'

const shortcuts = [
  ['Move', '↑ ↓ ← → / WASD'],
  ['Undo', 'Z / Backspace / ⌘ Ctrl Z'],
  ['Reset', 'R'],
  ['Hint', 'H'],
  ['Replay / return', 'P'],
  ['Exit replay', 'Esc'],
  ['New puzzle', 'N'],
  ['Controls', '?'],
]

function App() {
  const [config, setConfig] = useState(getConfig)
  const puzzle = useMemo(
    () => createPuzzle(config.seed, config.difficulty),
    [config],
  )
  const help = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('puzzle', config.seed)
    url.searchParams.set('level', config.difficulty)
    window.history.replaceState(null, '', url)
  }, [config])
  const newPuzzle = () =>
    setConfig((value) => ({ ...value, seed: crypto.randomUUID().slice(0, 8) }))

  return (
    <MotionConfig reducedMotion="user">
      <div className="site-shell">
        <header className="site-header">
          <a
            className="brand"
            href={import.meta.env.BASE_URL}
            aria-label="2048 Reverse home"
          >
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              2048<span className="brand-divider">/</span>
              <span className="brand-name">reverse</span>
            </span>
          </a>
          <button
            className="help-button"
            aria-label="Controls"
            aria-keyshortcuts="Shift+/"
            onClick={() => help.current?.showModal()}
          >
            <Keyboard size={17} />
            Controls <kbd aria-hidden="true">?</kbd>
          </button>
        </header>
        <main>
          <section className="intro">
            <h1>Match the target.</h1>
            <p>One sequence. Exactly {puzzle.solution.length} moves.</p>
          </section>
          <Game
            key={`${config.seed}:${config.difficulty}`}
            puzzle={puzzle}
            onNew={newPuzzle}
            onDifficulty={(difficulty) =>
              setConfig((value) => ({ ...value, difficulty }))
            }
            onHelp={() => help.current?.showModal()}
          />
        </main>
        <dialog
          ref={help}
          aria-labelledby="help-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) help.current?.close()
          }}
        >
          <div className="help-content">
            <button
              className="icon-button dialog-close"
              aria-label="Close controls"
              onClick={() => help.current?.close()}
            >
              <X size={20} />
            </button>
            <h2 id="help-title">Controls</h2>
            <dl className="shortcuts">
              {shortcuts.map(([action, keys]) => (
                <div key={action}>
                  <dt>{action}</dt>
                  <dd>
                    <kbd>{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              Standard 2048 merges. New tiles fill the first empty cell, left to
              right, top to bottom. Match the target in exactly{' '}
              {puzzle.solution.length} moves.
            </p>
            <button
              className="primary-button"
              onClick={() => help.current?.close()}
            >
              Back to puzzle
            </button>
          </div>
        </dialog>
      </div>
    </MotionConfig>
  )
}

export default App
