---
id: design
title: Design
sidebar_label: Design
---

Traditionally, we can distinct 4 classic methods of handling derivation of state:

- Native - compute from scratch every time the state is changed.
- Manual - Handle cache invalidation manually (with all the pain this process entails).
- Persistent - Using Immutable data and caching computation based on the identity of inputs.
- Reactive - Using Functional Reactive Programming to box fragments of your state with getters & setters; running derivations in a way that would log which fragments were read during the computation, and invalidate when one of their setters is invoked.

This project is an attempt at a new approach, a DSL + Compiler which are fed two types of inputs:

1.  The derivation of state you need
2.  Paths in the model you want to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically.

Because the compiler "knows" in advance about all the stuff that can be read/written from/to the model, it can do all sorts of cool things which are nearly impossible to do automatically using other approaches:

- Track conditional consumption of parts of the model only if used with zero overhead.
- Hoisting shared sub expressions, so they are only calculated once.
- Not track dependencies if there are no setters that can cause an expression to invalidate.
- All computation is incremental.

## Main parts

1.  A frontend that utilizes a Lodash-inspired API for defining the state derivations needed in your project, letting you map/filter. It generates an S-EXPressions (lisp) inspired data structure (which should remain opaque to the user of this library) and feeds it into the compiler.
2.  An optimizing pass which hoist shared sub-expressions, eliminates dead code, tags the SEXPs (the naive version of the compiler skips this step).
3.  Backend which takes the SEXPs and generates your state container function.

### Frontend
A Domain Specific Language (DSL) for creating derivations of state created using es6 proxies. See [API Reference](https://carmi.js.org/docs/api/api.html) for more.

### Compilers
1.  Optimizing - This is the default compiler, it hoists shared sub-expressions and all computation is incremental.
2.  Simple - Hoists shared-subexpressions but all computation is done from scratch per every change in the state. Very useful for Server Side Rendering.
3.  Naive - Maintains a 1:1 mapping of your model to the code generated but has big performance issues.
4.  Flow - Based on a simple compiler and adds flow-type annotations only used for generating code for compilers that are typed, like the Rust compiler.
5.  Rust - Right now this compiler is just an experiment I used to verify that it is feasible in the future to generate Rust code out of the same models, only created to put my mind at rest that if/when in the future we need to switch to WASM, it would be possible.

### Backend
A set of compilers that generate your function's code out of the model supplied.
