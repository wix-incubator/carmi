# CARMI

## Compiler for Automatic Reactive Modelling of Inference

This is a POC of an entirely new approach to modelling infered state, there are 4 classic methods of handling
deriviation of state

1. The naive - compute from scratch everytime the state is changed
2. Handle cache invalidation manually with all the world of hurt that entails.
3. Using Immutable data and caching computation based on the identity of the inputs
4. Using Functional Reactive Programming to box fragments of your state with getters&setters, running deriviations in a
   way that logs which fragments were read during the computation, and invalidate when one of their setters is invoked

This project is an attempt at a new approach, a DSL+Compiler which are fed two types of inputs:

1. The deriviation of state you need
2. The paths in the model you want to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically

Because the compiler knows in advance all the stuff that can be read/written from/to the model, it can do all sort of
cool stuff that is nearly impossible to do automatically using other approachs

1. Track conditional consumption of parts of the model only if used with zero
2. Hoisting shared sub expressions, so they are only calculated once
3. Not track dependencies if there are no setters that can cause the expression to invalidate

THIS IS A POC - Do not use for production yet
