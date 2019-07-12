---
id: reactions
title: Reactions
sidebar_label: Reactions
---

While the derived state is always synchronized with the state, sometimes you want reactions triggered to connect the derived state to the external world. Currently the method to implement these is using the **call** API to trigger the
reaction on your values.

```js
/// model-reactions.carmi.js
const { root, arg0, setter } = require('carmi');
const model = {
  doubled: root.map((item, idx) => item.mult(2).call('logItemChanged', idx)).call('logArrayChanged'),
  setItem: setter(arg0)
};
module.exports = model;
```

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
console.log(instance.doubled);
// prints [2,4,6,8]
instance.setItem(0, 10);
// prints itemChanged 0 20
// prints arrayChanged [20,4,6,8]
console.log(instance.doubled);
// prints [20,4,6,8]
```
