---
id: intro
title: Intro
sidebar_label: Intro
---

## Exports

CARMI exports only several APIs:

1.  compile(model, {compiler,name,output}) - takes a model (a plain JS object with two types of properties - either state derivations or a setter) and generates the source code for a function which receives two parameters - the actual initial state and an optional function library, and returns an object with the defined derivations and setters. Whenever you trigger a setter the derivations update incrementally.
2.  root - a token which represents the root of your state, which is used to create your derived state.
3.  [`chain(t)`](External.html#chaint) - wrap a native JS object with the declarative APIs that are available on root & every derivation from root.
4.  [`and(a)`](External.html#anda)/[`or(a, b)`](External.html#ora-b) - logical operands for your state derivations.
5.  [`setter(path)`](External.html#setterpath) - declare actions which can be triggered on your state to change it (use arg0/arg1/arg2 - to define placeholders in the path)

## Deriving state DSL

Every piece of state `root` [`chain(t)`](External.html#chaint) and everything derived from them using these APIs out of them has the following APIs, these are inspired by lodash to make transition to CARMI easier for developers with frontend experience.
All of them return objects which represent the computation - remember there are no values in compile time.
