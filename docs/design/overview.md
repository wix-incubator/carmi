---
id: overview
title: Overview
sidebar_label: Overview
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
cool stuff that is nearly impossible to do automatically using other approaches

- Track conditional consumption of parts of the model only if used with zero over head
- Hoisting shared sub expressions, so they are only calculated once
- Not track dependencies if there are no setters that can cause the expression to invalidate
- All computation is incremental
There are 4 classic methods of handling derivation of state

### Main parts

1.  [Frontend](design/frontend.md) which exposes a lodash inspired API for defining the state derivations needed in your project letting you
    map/filter, the frontend generates a S-EXPressions (lisp) inspired data structure which should remain opaque to the
    consumer of this library and is fed into the compiler
2.  An optimizing pass([compile](design/compilers.md)) which hoist shared sub-expressions, eliminates dead code, tag the SEXPs (The naive version of the
    compiler skips this step)
3.  [Backend](design/backend.md) which takes the SEXPs and generates your state container function
