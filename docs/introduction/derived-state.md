---
id: derived-state
title: Derived state
sidebar_label: Derived state
---

Computed state is derived using a **[lodash](https://lodash.com)**-inspired DSL, see [API section](/docs/api/api.html) for a complete list of available functionality.

A few key concepts

- **root** and everything derived from it is chainable
- Everything is declarative, there is no data compile time - much like Lodash-FP or Ramda
- Anything you derive but don't export from your model never happens
- Nothing changes in place. Instead you define a series of transformations. For example: **[assign()](http://localhost:3000/docs/api/api.html#assign)** won't modify the input array it recives.
Instead it creates new object with the result.
- **call** is your escape hatch - you can use it to do any transformation that is not part of the DSL. Treat the inputs as read only though, otherwise bugs will happen
