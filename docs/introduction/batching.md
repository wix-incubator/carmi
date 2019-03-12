---
id: batching
title: Batching
sidebar_label: Batching
---

If you want to trigger multiple setters on your model at once you can use the batching APIs,

```js
const modelFunction = require('./model-reactions.carmi');
const instance = modelFunction([1, 2, 3, 4], {
  logItemChanged: (value, idx) => {
    console.log('itemChanged', idx, value);
    return value;
  },
  logArrayChanged: arr => {
    console.log('arrayChanged', arr);
    return arr;
  }
});
// prints itemChanged 0 2
// prints itemChanged 1 4
// prints itemChanged 2 6
// prints itemChanged 3 8
// prints arrayChanged [2,4,6,8]
instance.$startBatch();
instance.setItem(0, 10);
instance.setItem(1, 20);
instance.$endBatch();
// prints itemChanged 0 20
// prints itemChanged 10 40
// prints arrayChanged [20,40,6,8]
// the print only happens once because the setters were batched
```
