---
id: batching
title: Batching
sidebar_label: Batching
---

If you want to trigger multiple setters on your model at once you can use the batching APIs,

```js
const { root, setter, arg0 } = require('carmi')
const instance = createInstance({
    setItem: setter(arg0),
    value: root.map((v, i) => v.call('change', i)),
  setItem: setter(arg0)
}, [7, 2], {
  change: (v, i) => {
    console.log(`array change [${i}] = ${v}`)
    return v
  }
})

// array change [0] = 7
// array change [1] = 2
instance.$startBatch();
instance.setItem(0, 1)
instance.setItem(1, 3)
console.log('endbatch') // endbatch
instance.$endBatch();
// array change [0] = 1
// array change [1] = 3
instance.value // [1, 3]

```
