# node-signals

Register callback on node process signals.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-node-signals.svg?logo=github&label=package)](https://github.com/jsenv/jsenv-node-signals/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/node-signals.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/node-signals)
[![github ci](https://github.com/jsenv/jsenv-node-signals/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-node-signals/actions?workflow=ci)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-node-signals/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-node-signals)

# Table of contents

- [Presentation](#Presentation)
- [Installation](#installation)

# Presentation

`@jsenv/node-signals` was designed to cleanup things (gracefully if possible), when node process exits.

# Installation

```console
npm install @jsenv/node-signals@2.0.0
```

```js
import { teardownSignal } from "@jsenv/node-signals"

teardownSignal.addCallback((reason) => {
  console.log(`teardown because ${reason}`)
})
```

For node < 13

```js
const { teardownSignal } = require("@jsenv/node-signals")
```
