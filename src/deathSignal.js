const addCallback = (callback) => {
  const triggerDeath = () => callback()
  // SIGTERM http://man7.org/linux/man-pages/man7/signal.7.html
  process.once("SIGTERM", triggerDeath)
  return () => {
    process.removeListener("SIGTERM", triggerDeath)
  }
}

export const deathSignal = {
  addCallback,
}
