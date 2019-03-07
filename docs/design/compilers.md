---
id: compilers
title: Compilers
sidebar_label: Compilers
---

1.  Optimizing - This is the default compiler, hoists shared sub-expressions and all computation is incremental.
2.  Simple - Hoists shared-subexpressions but all computation is done from scratch on each change in the state. Very
    useful for Server Side Rendering.
3.  Naive - Maintains a 1:1 mapping of your model to the code generated but has horrible performance
4.  Flow - Based on the simple compiler and adds flow-type annotations only used for generating code for compilers that
    are typed like the Rust compiler
5.  Rust - Right now this compiler is just an experiment I used to verify that it is feasible in the future to generate
    Rust code out of the same models, only created to put my mind at rest that if/when in the future we'll need to
    switch to WASM it would be possible
