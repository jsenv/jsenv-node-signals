// to properly test teardownSignal and other signals
// we should spawn a node process in which we register signals
// then we dispatch signal from outside
// and ensure the callback was called somehow

import { teardownSignal } from "../../index.js"

teardownSignal.addCallback((reason) => {
  console.log(reason)
})
