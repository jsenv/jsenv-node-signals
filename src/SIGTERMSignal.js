const addCallback = (callback) => {
  if (process.platform === "win32") {
    console.warn(`SIGTERM is not supported on windows`)
    return () => {}
  }

  const triggerTermination = () => callback()
  // SIGTERM http://man7.org/linux/man-pages/man7/signal.7.html
  process.once("SIGTERM", triggerTermination)
  return () => {
    process.removeListener("SIGTERM", triggerTermination)
  }
}

export const SIGTERMSignal = {
  addCallback,
}
