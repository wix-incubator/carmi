---
id: derived-state
title: Derived state
sidebar_label: Derived state
---

You derive your computed state using the Lodash inspired DSL - checkout the API section for a complete listing

A few key concepts

- **root** and everything derived from it is chainable
- Everything is declarative, there is no data compile time - much like Lodash-FP or Ramda
- Anything you derive but don't export from your model never happens
- Nothing changes in place - you are defining a series of transformations, for example **assign** won't modify the input
  array it gets, it just generates a new object with the result
- **call** is your escape hatch - you can use it to do any transformation that is not part of the DSL, but treat the
  inputs as read only otherwise bugs will happen
