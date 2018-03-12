# essx
Essential Complexity - Compiler for Automatic Reactive Modelling of Inference

This is a POC of an entirely new approach to modelling infered state, there are 4 classic methods of writing performant deriviation of state
1) Handle cache invalidation manually with all the world of hurt that entails.
2) The naive - compute from scratch everytime the state is changed
3) Using Immutable data and caching computation based on the identity of the inputs
4) Using Functional Reactive Programming to box fragments of your state with getters&setters, running deriviations in a way that logs which fragments were read during the computation, and invalidate when one of their setters is invoked

This project is an attempt at a new approach, a DSL+Compiler which are fed inputs of all the deriviation of state you need and the paths into your state which you want to be able to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically, and can do all sort of cool stuff that is nearly impossible to do automatically in the other approachs like hoisting shared sub expressions


THIS IS A POC - Do not use for production yet
