'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const addCallback = callback => {
  const triggerHangUpOrDeath = () => callback(); // SIGHUP http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGUP", triggerHangUpOrDeath);
  return () => {
    process.removeListener("SIGUP", triggerHangUpOrDeath);
  };
};

const SIGUPSignal = {
  addCallback
};

const addCallback$1 = callback => {
  // SIGINT is CTRL+C from keyboard also refered as keyboard interruption
  // http://man7.org/linux/man-pages/man7/signal.7.html
  // may also be sent by vscode https://github.com/Microsoft/vscode-node-debug/issues/1#issuecomment-405185642
  process.once("SIGINT", callback);
  return () => {
    process.removeListener("SIGINT", callback);
  };
};

const SIGINTSignal = {
  addCallback: addCallback$1
};

const addCallback$2 = callback => {
  if (process.platform === "win32") {
    console.warn(`SIGTERM is not supported on windows`);
    return () => {};
  }

  const triggerTermination = () => callback(); // SIGTERM http://man7.org/linux/man-pages/man7/signal.7.html


  process.once("SIGTERM", triggerTermination);
  return () => {
    process.removeListener("SIGTERM", triggerTermination);
  };
};

const SIGTERMSignal = {
  addCallback: addCallback$2
};

let beforeExitCallbackArray = [];
let uninstall;

const addCallback$3 = callback => {
  if (beforeExitCallbackArray.length === 0) uninstall = install();
  beforeExitCallbackArray = [...beforeExitCallbackArray, callback];
  return () => {
    if (beforeExitCallbackArray.length === 0) return;
    beforeExitCallbackArray = beforeExitCallbackArray.filter(beforeExitCallback => beforeExitCallback !== callback);
    if (beforeExitCallbackArray.length === 0) uninstall();
  };
};

const install = () => {
  const onBeforeExit = () => {
    return beforeExitCallbackArray.reduce(async (previous, callback) => {
      await previous;
      return callback();
    }, Promise.resolve());
  };

  process.once("beforeExit", onBeforeExit);
  return () => {
    process.removeListener("beforeExit", onBeforeExit);
  };
};

const beforeExitSignal = {
  addCallback: addCallback$3
};

const addCallback$4 = (callback, {
  collectExceptions = false
} = {}) => {
  if (!collectExceptions) {
    const exitCallback = () => {
      callback();
    };

    process.on("exit", exitCallback);
    return () => {
      process.removeListener("exit", exitCallback);
    };
  }

  const {
    getExceptions,
    stop
  } = trackExceptions();

  const exitCallback = () => {
    process.removeListener("exit", exitCallback);
    stop();
    callback({
      exceptionArray: getExceptions().map(({
        exception,
        origin
      }) => {
        return {
          exception,
          origin
        };
      })
    });
  };

  process.on("exit", exitCallback);
  return () => {
    process.removeListener("exit", exitCallback);
  };
};

const trackExceptions = () => {
  let exceptionArray = [];

  const unhandledRejectionCallback = (unhandledRejection, promise) => {
    exceptionArray = [...exceptionArray, {
      origin: "unhandledRejection",
      exception: unhandledRejection,
      promise
    }];
  };

  const rejectionHandledCallback = promise => {
    exceptionArray = exceptionArray.filter(exceptionArray => exceptionArray.promise !== promise);
  };

  const uncaughtExceptionCallback = (uncaughtException, origin) => {
    // since node 12.4 https://nodejs.org/docs/latest-v12.x/api/process.html#process_event_uncaughtexception
    if (origin === "unhandledRejection") return;
    exceptionArray = [...exceptionArray, {
      origin: "uncaughtException",
      exception: uncaughtException
    }];
  };

  process.on("unhandledRejection", unhandledRejectionCallback);
  process.on("rejectionHandled", rejectionHandledCallback);
  process.on("uncaughtException", uncaughtExceptionCallback);
  return {
    getExceptions: () => exceptionArray,
    stop: () => {
      process.removeListener("unhandledRejection", unhandledRejectionCallback);
      process.removeListener("rejectionHandled", rejectionHandledCallback);
      process.removeListener("uncaughtException", uncaughtExceptionCallback);
    }
  };
};

const exitSignal = {
  addCallback: addCallback$4
};

const addCallback$5 = callback => {
  return eventRace({
    SIGHUP: {
      register: SIGUPSignal.addCallback,
      callback: () => callback("SIGHUP")
    },
    SIGINT: {
      register: SIGINTSignal.addCallback,
      callback: () => callback("SIGINT")
    },
    ...(process.paltform === "win32" ? {} : {
      SIGTERM: {
        register: SIGTERMSignal.addCallback,
        callback: () => callback("SIGTERM")
      }
    }),
    beforeExit: {
      register: beforeExitSignal.addCallback,
      callback: () => callback("beforeExit")
    },
    exit: {
      register: exitSignal.addCallback,
      callback: () => callback("exit")
    }
  });
};

const eventRace = eventMap => {
  const unregisterMap = {};

  const unregisterAll = reason => {
    return Object.keys(unregisterMap).map(name => unregisterMap[name](reason));
  };

  Object.keys(eventMap).forEach(name => {
    const {
      register,
      callback
    } = eventMap[name];
    unregisterMap[name] = register((...args) => {
      unregisterAll();
      callback(...args);
    });
  });
  return unregisterAll;
};

const teardownSignal = {
  addCallback: addCallback$5
};

const firstOperationMatching = ({
  array,
  start,
  predicate
}) => {
  if (typeof array !== "object") throw new TypeError(createArrayErrorMessage({
    array
  }));
  if (typeof start !== "function") throw new TypeError(createStartErrorMessage({
    start
  }));
  if (typeof predicate !== "function") throw new TypeError(createPredicateErrorMessage({
    predicate
  }));
  return new Promise((resolve, reject) => {
    const visit = index => {
      if (index >= array.length) {
        return resolve();
      }

      const input = array[index];
      const returnValue = start(input);
      return Promise.resolve(returnValue).then(output => {
        if (predicate(output)) {
          return resolve(output);
        }

        return visit(index + 1);
      }, reject);
    };

    visit(0);
  });
};

const createArrayErrorMessage = ({
  array
}) => `array must be an object.
array: ${array}`;

const createStartErrorMessage = ({
  start
}) => `start must be a function.
start: ${start}`;

const createPredicateErrorMessage = ({
  predicate
}) => `predicate must be a function.
predicate: ${predicate}`;

/*
why unadvised ?
- First because you should not do anything when a process uncaughtException
or unhandled rejection happens.
You cannot assume assume or trust the state of your process so you're
likely going to throw an other error trying to handle the first one.
- Second because the error stack trace will be modified making it harder
to reach back what cause the error

Instead you should monitor your process with an other one
and when the monitored process die, here you can do what you want
like analysing logs to find what cause process to die, ping a log server, ...
*/
let recoverCallbackArray = [];
let uninstall$1;

const addCallback$6 = callback => {
  if (recoverCallbackArray.length === 0) uninstall$1 = install$1();
  recoverCallbackArray = [...recoverCallbackArray, callback];
  return () => {
    if (recoverCallbackArray.length === 0) return;
    recoverCallbackArray = recoverCallbackArray.filter(recoverCallback => recoverCallback !== callback);
    if (recoverCallbackArray.length === 0) uninstall$1();
  };
};

const install$1 = () => {
  const onUncaughtException = error => triggerUncaughtException(error);

  const onUnhandledRejection = (value, promise) => triggerUnhandledRejection(value, promise);

  const onRejectionHandled = promise => recoverExceptionMatching(exception => exception.promise === promise);

  process.on("unhandledRejection", onUnhandledRejection);
  process.on("rejectionHandled", onRejectionHandled);
  process.on("uncaughtException", onUncaughtException);
  return () => {
    process.removeListener("unhandledRejection", onUnhandledRejection);
    process.removeListener("rejectionHandled", onRejectionHandled);
    process.removeListener("uncaughtException", onRejectionHandled);
  };
};

const triggerUncaughtException = error => crash({
  type: "uncaughtException",
  value: error
});

const triggerUnhandledRejection = (value, promise) => crash({
  type: "unhandledRejection",
  value,
  promise
});

let isCrashing = false;
let crashReason;
let resolveRecovering;

const crash = async reason => {
  if (isCrashing) {
    console.log(`cannot recover due to ${crashReason.type} during recover`);
    console.error(crashReason.value);
    resolveRecovering(false);
    return;
  }

  console.log(`process starts crashing due to ${crashReason.type}`);
  console.log(`trying to recover`);
  isCrashing = true;
  crashReason = reason;
  const externalRecoverPromise = new Promise(resolve => {
    resolveRecovering = resolve;
  });
  const callbackRecoverPromise = firstOperationMatching({
    array: recoverCallbackArray,
    start: recoverCallback => recoverCallback(reason),
    predicate: recovered => typeof recovered === "boolean"
  });
  const recoverPromise = Promise.race([externalRecoverPromise, callbackRecoverPromise]);

  try {
    const recovered = await recoverPromise;
    if (recovered) return;
  } catch (error) {
    console.error(`cannot recover due to internal recover error`);
    console.error(error);
  }

  crashReason = undefined; // uninstall() prevent catching of the next throw
  // else the following would create an infinite loop
  // process.on('uncaughtException', function() {
  //     setTimeout(function() {
  //         throw 'yo';
  //     });
  // });

  uninstall$1();
  throw reason.value; // this mess up the stack trace :'(
};

const recoverExceptionMatching = predicate => {
  if (isCrashing && predicate(crashReason)) {
    resolveRecovering(true);
  }
};

const unadvisedCrashSignal = {
  addCallback: addCallback$6
};

exports.SIGINTSignal = SIGINTSignal;
exports.SIGTERMSignal = SIGTERMSignal;
exports.SIGUPSignal = SIGUPSignal;
exports.beforeExitSignal = beforeExitSignal;
exports.exitSignal = exitSignal;
exports.teardownSignal = teardownSignal;
exports.unadvisedCrashSignal = unadvisedCrashSignal;
//# sourceMappingURL=main.cjs.map
