const addCallback = (callback) => {
  const triggerHangUpOrDeath = () => callback()
  // SIGHUP http://man7.org/linux/man-pages/man7/signal.7.html
  process.once("SIGUP", triggerHangUpOrDeath)
  return () => {
    process.removeListener("SIGUP", triggerHangUpOrDeath)
  }
}

export const hangupOrDeathSignal = {
  addCallback,
}
