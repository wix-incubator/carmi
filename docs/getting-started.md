---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

## Overview

CARMI is a build time tool that transforms a Directed Acyclic Graph of derivations and setters into the source code of
an optimized function that calculates your derivations/computed-state and maintains them as long as you change your
model only using the setters you defined.

> Phil Karlton - "There are only two hard things in Computer Science: cache invalidation and naming things"
>
> I can't help you much with naming stuff (although you tend to name significantly fewer things in CARMI as you just let
> the data flow from one derivation to the next) - but I sure you hope we never have to think of cache invalidation
> again

Install Carmi using [`yarn`](https://yarnpkg.com/en/package/carmi):

```bash
yarn add --dev carmi
```

Or [`npm`](https://www.npmjs.com/):

```bash
npm install --save-dev carmi
```

Create your first model

```js
/// model.carmi.js
const { root, arg0, setter } = require('carmi');
const model = {
  doubled: root.map(item => item.mult(2)),
  setItem: setter(arg0)
};
module.exports = model;
```


CLI usage

```bash
npx carmi --source ./model.carmi.js --output ./model.js --format cjs
```

Configure webpack

Within your webpack configuration object, you'll need to add the Carmi loader to the list of modules:

```javascript
module: {
  rules: [
    {
      test: /\.carmi.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'carmi/loader'
      }
    }
  ];
}
```

```js
/// you can load your generated code either using a babel loader / a webpack plugin or just add a build step to generate the source
const modelFunction = require('./model.carmi');
const instance = modelFunction([1, 2, 3, 4]);
// each property defined on the model object generates either a derived value or a setter
console.log(instance.doubled);
// prints [2,4,6,8]
instance.setItem(0, 10);
console.log(instance.doubled);
// prints [20,4,6,8]
```

## Derived state

You derive your computed state using the Lodash inspired DSL - checkout the API section for a complete listing

A few key concepts

- **root** and everything derived from it is chainable
- Everything is declarative, there is no data compile time - much like Lodash-FP or Ramda
- Anything you derive but don't export from your model never happens
- Nothing changes in place - you are defining a series of transformations, for example **assign** won't modify the input
  array it gets, it just generates a new object with the result
- **call** is your escape hatch - you can use it to do any transformation that is not part of the DSL, but treat the
  inputs as read only otherwise bugs will happen

### Reactions

While the derived state is always synchronized with the state, sometimes you want reactions triggered to connect the
derived state to the external world, the current method to implement these is using the **call** api to trigger the
reaction on your values.

```js
/// model-reactions.carmi.js
const { root, arg0 } = require('carmi');
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

## Batching

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
