//// base ////

use std::collections::HashMap;
extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate serde_derive;

use serde_json::Error;

trait JsBoolConvertable {
    fn toJsBool(&self) -> bool;
}

impl JsBoolConvertable for f64 {
    fn toJsBool(&self) -> bool {
        *self != 0.0
    }
}

impl JsBoolConvertable for bool {
    fn toJsBool(&self) -> bool {
        *self
    }
}

impl JsBoolConvertable for String {
    fn toJsBool(&self) -> bool {
        true
    }
}

impl <T: JsBoolConvertable> JsBoolConvertable for Option<T> {
    fn toJsBool(&self) -> bool {
        match *self {
            None => false,
            Some(x) => x.toJsBool()
        }
    }
}

/* STRUCTS */

#[derive(Debug,Default)]
struct /* NAME */ {
    model: Model,
    funcLib: FuncLib,
    /* MAIN_STRUCT_FIELDS */
}

impl /* NAME */ {
    fn new(model: Model, funcLib: FuncLib) -> /* NAME */ {
        let mut instance = Self{model:model,funcLib:funcLib,..Default::default()};
        {
            instance.recalculate();
        }
        instance
    }
    fn newFromJson(json:&str , funcLib: FuncLib) -> /* NAME */ {
        let model: Model = serde_json::from_str(json).unwrap();
        let mut instance = Self{model:model,funcLib:funcLib,..Default::default()};
        {
            instance.recalculate();
        }
        instance
    }
    /* ALL_EXPRESSIONS */
    fn recalculate(self: &mut Self) -> () {
        /* DERIVED */
    }
}
fn demo()-> Result<(), Error> {
    // Some JSON input data as a &str. Maybe this comes from the user.
    let data = r#"{
                    "todos": {"1":{"blockedBy":null,"done":true}}
                }"#;
    let f: FuncLib = FuncLib{};

    let i: /*NAME*/ = /*NAME*/::newFromJson(data, f);

    // Do things just like with any other Rust data structure.
    println!("Test {:?}", i.model.todos);

    Ok(())
}

fn main() -> () {
       let r = demo();
       match r {
           Result::Ok(()) => println!("ok"),
           Error => println!("error"),
       }
}


//// func ////

fn __/*ID*/(self: &Self/* ARGS */)->/* RETURN */ {
    /*EXPR1*/
}

//// topLevel ////
fn _/*FUNCNAME*/(self: &Self)->/* RETURN */ {
    /*EXPR*/
}