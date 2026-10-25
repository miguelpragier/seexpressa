/**
 * Cancellable execution controller. A single `Runner` drives the animation by
 * re-scheduling itself with `setTimeout`, so there is never more than one
 * pending timer. Calling `stop()` invalidates any scheduled callback (via the
 * generation counter), which makes restart, edit-during-run, and new-maze all
 * safe from stale callbacks.
 */
export class Runner {
  private timer: number | null = null
  private generation = 0

  constructor(
    private readonly onTick: () => void,
    private readonly getDelay: () => number,
  ) {}

  start(): void {
    this.stop()
    const generation = ++this.generation
    const loop = (): void => {
      if (generation !== this.generation) return
      this.timer = window.setTimeout(() => {
        this.timer = null
        if (generation !== this.generation) return
        this.onTick()
        if (generation === this.generation) loop()
      }, this.getDelay())
    }
    loop()
  }

  stop(): void {
    this.generation++
    if (this.timer !== null) {
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }
}
