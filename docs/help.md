---
id: help
title: Help
---

> This project is still in it's infancy. So if you encounter a bug, please submit an [issue](https://github.com/wix-incubator/carmi/issues/new).

A very convenient way to inspect your derivations is to add a `tap` method
that creates a scope where you can either call the `debugger` or use `console.log()`
to inspect the value in the part that it is interesting:
```js
const initialState = { a: 1 }
const { root } = require('carmi')

const instance = createInstance({
    output: root.call('tap').get('a')
}, initialState, {
    tap: val => {
        console.log(val); //or debugger;
        return val;
    }
})

instance.output //1
```

If your derived state is incorrect but when using the simple compiler everything is working.
It might be the case that your state or derivations are being mutated directly and not trough Carmi's [setters](/docs/api/api.html#setterpath).
Always treat your derivations as **readonly** including anything passed to **[call()](/docs/api/api.html#callfunc-args)**.

> Note: A good way to enforce readonly access this is to use [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
> to make the model readonly in debug mode

> To ease debugging: The names of the non exported top level values are based on the filename and line number where they are defined.
