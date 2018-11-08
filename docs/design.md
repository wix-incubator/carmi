---
id: design
title: Design
---

There are 4 classic methods of handling derivation of state

- The naive - compute from scratch everytime the state is changed
- Handle cache invalidation manually with all the world of hurt that entails.
- Using Immutable data and caching computation based on the identity of the inputs
- Using Functional Reactive Programming to box fragments of your state with getters&setters, running derivations in a
  way that logs which fragments were read during the computation, and invalidate when one of their setters is invoked

This project is an attempt at a new approach, a DSL+Compiler which are fed two types of inputs:

1.  The derivation of state you need
2.  The paths in the model you want to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically

Because the compiler knows in advance all the stuff that can be read/written from/to the model, it can do all sort of
cool stuff that is nearly impossible to do automatically using other approachs

- Track conditional consumption of parts of the model only if used with zero over head
- Hoisting shared sub expressions, so they are only calculated once
- Not track dependencies if there are no setters that can cause the expression to invalidate
- All computation is incremental

### CARMI is built from 3 parts:

1.  Frontend which exposes a lodash inspired API for defining the state derivations needed in your project letting you
    map/filter, the frontend generates a S-EXPressions (lisp) inspired data strcture which should remain opaque to the
    consumer of this library and is fed into the compiler
2.  An optimizing pass which hoist shared sub-expressions, eliminates dead code, tag the SEXPs (The naive version of the
    compiler skips this step)
3.  Backend which takes the SEXPs and generates your state container function

### Frontend

A Domain Specific Language (DSL) for creating derivations of state created using es6 proxies

### Backend

A set of compilers that generate your function's code out of the model supplied

### Compilers

1.  Optimizing - This is the default compiler, hoists shared sub-expressions and all computation is incremental.
2.  Simple - Hoists shared-subexpressions but all computation is done from scratch on each change in the state. Very
    useful for Server Side Rendering.
3.  Naive - Maintains a 1:1 mapping of your model to the code generated but has horrible performance
4.  Flow - Based on the simple compiler and adds flow-type annotations only used for generating code for compilers that
    are typed like the Rust compiler
5.  Rust - Right now this compiler is just an experiment I used to verify that it is feasible in the future to generate
    Rust code out of the same models, only created to put my mind at rest that if/when in the future we'll need to
    switch to WASM it would be possible
