let beforeExitCallbackArray = []
let uninstall
const addCallback = (callback) => {
  if (beforeExitCallbackArray.length === 0) uninstall = install()
  beforeExitCallbackArray = [...beforeExitCallbackArray, callback]

  return () => {
    if (beforeExitCallbackArray.length === 0) return
    beforeExitCallbackArray = beforeExitCallbackArray.filter(
      (beforeExitCallback) => beforeExitCallback !== callback,
    )
    if (beforeExitCallbackArray.length === 0) uninstall()
  }
}

const install = () => {
  const onBeforeExit = () => {
    return beforeExitCallbackArray.reduce(async (previous, callback) => {
      await previous
      return callback()
    }, Promise.resolve())
  }
  process.once("beforeExit", onBeforeExit)
  return () => {
    process.removeListener("beforeExit", onBeforeExit)
  }
}

export const beforeExitSignal = {
  addCallback,
}
