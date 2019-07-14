---
id: derived-state
title: Derived state
sidebar_label: Derived state
---

Computed state is derived using a [Lodash](https://lodash.com) inspired DSL - checkout the [API section](/docs/api/api.html) for a complete listing

A few key concepts

- **root** and everything derived from it is chainable
- Everything is declarative, there is no data compile time - much like Lodash-FP or Ramda
- Anything you derive but don't export from your model never happens
- Nothing changes in place since you are defining a series of transformations. For example, **assign** won't modify the input array it gets, it will just generate a new object with the result
- **call** is your escape hatch - you can use it to do any transformation that is not part of the DSL. Treat the inputs as read only though, otherwise bugs will happen
