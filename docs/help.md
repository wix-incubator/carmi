---
id: help
title: Help
---

> This project is still in it's infancy. So if you encounter a bug, please submit an issue.

A very convenient way to inspect your derivations is to add a tap method that calls a debugger/console.log method to your function library, and value.call('tap') in the part that is tricky.

```js
const instance = modelFunction(initialState, {
  tap: val => {
    debugger;
    return val;
  }
});
```

If you derived state is incorrect and everything is working when using the Simple compiler, it is either a bug in CARMI or your state/derivations were mutated not by the setters in the model. Always treat your derivations as readonly including anything passed to **call**. (A good way to enforce this is to use es6 proxies to make the model readonly in debug mode)

To ease debugging the names of the non exported top level values are based on the filename and line number where they are defined.
