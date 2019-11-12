const addCallback = (callback, { collectExceptions = false } = {}) => {
  if (!collectExceptions) {
    const exitCallback = () => {
      callback()
    }
    process.on("exit", exitCallback)
    return () => {
      process.removeListener("exit", exitCallback)
    }
  }

  const { getExceptions, stop } = trackExceptions()
  const exitCallback = () => {
    process.removeListener("exit", exitCallback)
    stop()
    callback({
      exceptionArray: getExceptions().map(({ exception, origin }) => {
        return { exception, origin }
      }),
    })
  }
  process.on("exit", exitCallback)
  return () => {
    process.removeListener("exit", exitCallback)
  }
}

const trackExceptions = () => {
  let exceptionArray = []

  const unhandledRejectionCallback = (unhandledRejection, promise) => {
    exceptionArray = [
      ...exceptionArray,
      { origin: "unhandledRejection", exception: unhandledRejection, promise },
    ]
  }

  const rejectionHandledCallback = (promise) => {
    exceptionArray = exceptionArray.filter((exceptionArray) => exceptionArray.promise !== promise)
  }

  const uncaughtExceptionCallback = (uncaughtException, origin) => {
    // since node 12.4 https://nodejs.org/docs/latest-v12.x/api/process.html#process_event_uncaughtexception
    if (origin === "unhandledRejection") return

    exceptionArray = [
      ...exceptionArray,
      { origin: "uncaughtException", exception: uncaughtException },
    ]
  }

  process.on("unhandledRejection", unhandledRejectionCallback)
  process.on("rejectionHandled", rejectionHandledCallback)
  process.on("uncaughtException", uncaughtExceptionCallback)

  return {
    getExceptions: () => exceptionArray,
    stop: () => {
      process.removeListener("unhandledRejection", unhandledRejectionCallback)
      process.removeListener("rejectionHandled", rejectionHandledCallback)
      process.removeListener("uncaughtException", uncaughtExceptionCallback)
    },
  }
}

export const exitSignal = {
  addCallback,
}
