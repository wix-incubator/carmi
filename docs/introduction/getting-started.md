---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

CARMI is a build time tool that transforms a Directed Acyclic Graph of derivations and setters into the source code of
an optimized function that calculates your derivations/computed-state and maintains them as long as you change your
model only using the setters you defined.

> Phil Karlton - "There are only two hard things in Computer Science: cache invalidation and naming things"
>
> I can't help you much with naming stuff (although you tend to name significantly fewer things in CARMI as you just let
> the data flow from one derivation to the next) - but I sure hope you'll never have to think of cache invalidation
> again.

Install Carmi using [`yarn`](https://yarnpkg.com/en/package/carmi):

```bash
yarn add --dev carmi
```

or [`npm`](https://www.npmjs.com/):

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

Add the Carmi loader to the list of modules within your webpack configuration object:

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
/// you can load your generated code either via using a babel loader / a webpack plugin,
/// or by simply adding a build step to generate the source
const modelFunction = require('./model.carmi');
const instance = modelFunction([1, 2, 3, 4]);
// each property defined on the model object generates either a derived value or a setter
console.log(instance.doubled);
// prints [2,4,6,8]
instance.setItem(0, 10);
console.log(instance.doubled);
// prints [20,4,6,8]
```
