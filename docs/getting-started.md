---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

## Overview

CARMI is a build time tool that transforms a Directed Acyclic Graph of deriviations and setters into the source code of
an optimizied function that calculates your deriviations/computed-state and maintains them as long as you change your
model only using the setters you defined.

> Phil Keaton - "There are only two hard things in Computer Science: cache invalidation and naming things"
>
> I can't help you much with naming stuff (although you tend to name significantly fewer things in CARMI as you just let
> the data flow from one deriviation to the next) - but I sure you hope we never have to think of cache invalidation
> again

```js
/// model.carmi.js
const { root, arg0 } = require('carmi');
const model = {
  doubled: root.map(item => item.mult(2)).call('log'),
  setItem: setter(arg0)
};
module.exports = model;
```

```js
/// you can load your generated code either using a babel loader / a webpack plugin or just add a build step to generate the source
const modelFunction = require('carmi/loader!./model.carmi');
const instance = modelFunction([1, 2, 3, 4], { log: val => console.log(val);return val });
// prints [2, 4, 6, 8]
// each property defined on the model object generates either a derived value or a setter
console.log(instance.doubled);
// prints [2,4,6,8]
instance.setItem(0, 10);
// prints [20,4,6,8]
instance.setItem(1, 20);
// prints [20,40,6,8]
```

## Reactions

While the derived state is always synchronized with the state, sometimes you want reactions triggered, the current
method to implement these is using the **call** api to trigger the reaction on your values.

## Batching

If you want to trigger multiple setters on your model at once you can use the batching APIs

```js
const modelFunction = require('carmi/loader!./model.carmi');
const instance = modelFunction([1, 2, 3, 4], { log: val => console.log(val);return val });
// prints [2,4,6,8]
instance.$startBatch();
instance.setItem(0, 10);
instance.setItem(1, 20);
instance.$endBatch();
// prints [20,40,6,8]
// the print only happens once because the setters were batched
```
