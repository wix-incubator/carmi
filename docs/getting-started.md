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
  doubled: root.map(item => item.mult(2)),
  setItem: setter(arg0)
};
```

```js
/// you can load your generated code either using a babel loader / a webpack plugin or just add a build step to generate the source
const modelFunction = require('carmi/loader!./model.carmi');
const instance = modelFunction([1, 2, 3, 4]);
console.log(instance.doubled);
// [2,4,6,8]
instance.setItem(0, 10);
console.log(instance.doubled);
// [20,4,6,8]
```

## Why

There are a few

## Building your model

All derived state is a The simplest way to integrate CARMI into a project is using the WebPack loader
