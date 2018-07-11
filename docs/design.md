---
id: design
title: Design
---

CARMI is built from two halves:

1.  Frontend which exposes a lodash inspired API for defining the state deriviations needed in your project letting you
    map/filter, the frontend generates a S-EXPressions (lisp) inspired data strcture which should be opaque to the
    consumer of this library and is fed into the compiler
2.  Backend which takes the SEXP and generates your state container function - there are several types of compilers, all
    of them except the 'naive' version take the SEXP and pass them through several passes of pre-compiler steps which
    hoist shared sub-expressions, eliminate dead code, tag the SEXPs

### Frontend

A Domain Specific Language (DSL) for creating derivations of state created using es6 proxies

### Backend

A set of compilers that generate your function's code out of the model supplied

1.  Optimizing - This is the default compiler, hoists shared sub-expressions and all computation is incremental.
2.  Simple - Hoists shared-subexpressions but all computation is done from scratch on each change in the state. Very
    useful for Server Side Rendering.
3.  Naive - Maintains a 1:1 mapping of your model to the code generated but has horrible performance
4.  Flow - Based on the simple compiler and adds flow-type annotations only used for generating code for compilers that
    are typed like the Rust compiler
5.  Rust - Right now this compiler is just an experiment I used to verify that it is feasible in the future to generate
    Rust code out of the same models, only created to put my mind at rest that if/when in the future we'll need to
    switch to WASM it would be possible
