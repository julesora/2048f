import { useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { ArrowRight, CircleHelp, X } from 'lucide-react'
import { createPuzzle } from './game/engine'
import { getConfig } from './game/config'
import { Game } from './components/Game'
import './App.css'

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
          <a className="brand" href="/" aria-label="2048 Reverse home">
            <span className="brand-mark">
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
          <nav>
            <span className="daily-label">
              <span />A daily dose of logic
            </span>
            <button
              className="help-button"
              onClick={() => help.current?.showModal()}
            >
              <CircleHelp size={16} />
              How to play
            </button>
          </nav>
        </header>
        <main>
          <section className="intro">
            <div>
              <div className="eyebrow">
                <span />
                THE NEXT MOVE IS YOURS
              </div>
              <h1>
                2048, in <em>reverse.</em>
              </h1>
              <p>
                The destination is set. The path is hidden.
                <br className="mobile-break" /> Find the sequence that connects
                them.
              </p>
            </div>
            <div className="intro-art" aria-hidden="true">
              <div className="art-tile">2</div>
              <span>+</span>
              <div className="art-tile second">2</div>
              <ArrowRight size={23} />
              <div className="art-tile result">
                4<span>aha.</span>
              </div>
            </div>
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
          <section className="principles" aria-label="Game essentials">
            <div>
              <span className="principle-number">01</span>
              <div>
                <h3>A familiar foundation</h3>
                <p>
                  Slide and merge matching tiles.
                  <br />
                  The 2048 rules you already know.
                </p>
              </div>
            </div>
            <div>
              <span className="principle-number">02</span>
              <div>
                <h3>A single way through</h3>
                <p>
                  One target. One exact sequence.
                  <br />
                  Every puzzle has a unique solution.
                </p>
              </div>
            </div>
            <div>
              <span className="principle-number">03</span>
              <div>
                <h3>Room to experiment</h3>
                <p>
                  Undo, reset, and follow your curiosity.
                  <br />
                  There’s no rush to your next aha.
                </p>
              </div>
            </div>
          </section>
        </main>
        <footer>
          <span>
            Less luck. <span>More logic.</span>
          </span>
          <span>
            Made for curious minds.<span className="footer-flower">✳</span>
          </span>
        </footer>
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
              aria-label="Close rules"
              onClick={() => help.current?.close()}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">A FAMILIAR GAME, REIMAGINED</div>
            <h2 id="help-title">Find the missing moves.</h2>
            <p>
              Turn your starting board into the target board in the exact number
              of moves shown.
            </p>
            <ol>
              <li>
                <strong>Slide the whole board.</strong> Use the arrow keys,
                WASD, on-screen buttons, or swipe your board.
              </li>
              <li>
                <strong>Match to merge.</strong> Equal tiles combine once per
                move: 2 + 2 = 4. A new tile appears after each valid move.
              </li>
              <li>
                <strong>Follow a fixed path.</strong> New tiles fill the first
                empty cell, scanning left to right, top to bottom. Tile values
                follow a fixed sequence for each puzzle. Moves that do nothing
                don’t count.
              </li>
              <li>
                <strong>Find the only solution.</strong> Match every tile and
                empty space in exactly {puzzle.solution.length} moves. Undo with
                Z or Backspace; use hints when stuck.
              </li>
            </ol>
            <p className="help-note">
              Click a move in your timeline to inspect it, or replay your
              sequence. Your progress saves automatically on this device.
            </p>
            <button
              className="primary-button"
              onClick={() => help.current?.close()}
            >
              Let’s play <ArrowRight size={17} />
            </button>
          </div>
        </dialog>
      </div>
    </MotionConfig>
  )
}

export default App
