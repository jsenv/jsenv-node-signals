import { SIGTERMSignal } from "./SIGTERMSignal.js"
import { SIGINTSignal } from "./SIGINTSignal.js"
import { SIGUPSignal } from "./SIGUPSignal.js"
import { beforeExitSignal } from "./beforeExitSignal.js"
import { exitSignal } from "./exitSignal.js"

// usefull to ensure a given server is closed when process stops for instance
const addCallback = (callback) => {
  return eventRace({
    SIGHUP: {
      register: SIGUPSignal.addCallback,
      callback: () => callback("SIGHUP"),
    },
    SIGINT: {
      register: SIGINTSignal.addCallback,
      callback: () => callback("SIGINT"),
    },
    ...(process.platform === "win32"
      ? {}
      : {
          SIGTERM: {
            register: SIGTERMSignal.addCallback,
            callback: () => callback("SIGTERM"),
          },
        }),
    beforeExit: {
      register: beforeExitSignal.addCallback,
      callback: () => callback("beforeExit"),
    },
    exit: {
      register: exitSignal.addCallback,
      callback: () => callback("exit"),
    },
  })
}

const eventRace = (eventMap) => {
  const unregisterMap = {}

  const unregisterAll = (reason) => {
    return Object.keys(unregisterMap).map((name) => unregisterMap[name](reason))
  }

  Object.keys(eventMap).forEach((name) => {
    const { register, callback } = eventMap[name]

    unregisterMap[name] = register((...args) => {
      unregisterAll()
      callback(...args)
    })
  })

  return unregisterAll
}

export const teardownSignal = {
  addCallback,
}
