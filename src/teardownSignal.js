import { beforeExitSignal } from "./beforeExitSignal.js"
import { exitSignal } from "./exitSignal.js"
import { deathSignal } from "./deathSignal.js"
import { hangupOrDeathSignal } from "./hangupOrDeathSignal.js"

// when any of SIGUP, SIGINT, SIGTERM, beforeExit, exit is emitted callback is called
// usefull to ensure a given server is closed when process stops for instance
const addCallback = (callback) => {
  return eventRace({
    beforeExit: {
      register: beforeExitSignal.addCallback,
      callback: () => callback("beforeExit"),
    },
    hangupOrDeath: {
      register: hangupOrDeathSignal.addCallback,
      callback: () => callback("hangupOrDeath"),
    },
    death: {
      register: deathSignal.addCallback,
      callback: () => callback("death"),
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
