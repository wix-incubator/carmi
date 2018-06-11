//// base ////

use std::io::{self, Read};
use std::collections::HashMap;
extern crate serde;
extern crate serde_json;
extern crate string_interner;
use string_interner::StringInterner;
use string_interner::Symbol;
use serde_json::Error;
use std::cmp::Ordering;

#[derive(PartialEq,PartialOrd,Copy,Eq,Clone,Ord,Hash,Debug,Deserialize,Serialize)]
struct StringSymbol(usize);

impl Symbol for StringSymbol {
    fn from_usize(val: usize) -> Self {
        StringSymbol(val)
    }
    fn to_usize(self) -> usize {
        (self.0)
    }
}

#[macro_use]
extern crate serde_derive;

trait JsConvertable {
    fn toJsBool(&self) -> bool;
}

impl JsConvertable for f64 {
    fn toJsBool(&self) -> bool {
        *self != 0.0
    }
}

impl JsConvertable for bool {
    fn toJsBool(&self) -> bool {
        *self
    }
}

impl JsConvertable for StringSymbol {
    fn toJsBool(&self) -> bool {
        self.0 != 0
    }
}

impl <T: JsConvertable> JsConvertable for Option<T> {
    fn toJsBool(&self) -> bool {
        match *self {
            None => false,
            Some(ref x) => x.toJsBool()
        }
    }
}

/* STRUCTS */

#[derive(Debug, Serialize, Deserialize, Default)]
struct TopLevel {
    /* MAIN_STRUCT_FIELDS */
}

#[derive(Debug)]
struct /* NAME */ {
    model: Model,
    funcLib: FuncLib,
    topLevel: TopLevel,
    interner:StringInterner<StringSymbol>,
}

impl /* NAME */ {
    fn new(model: Model, funcLib: FuncLib) -> /* NAME */ {
        let topLevel = TopLevel::default();
        let interner:StringInterner<StringSymbol>  = StringInterner::<StringSymbol>::new();
        let mut instance = Self{model:model,funcLib:funcLib,interner:interner,topLevel:topLevel};
        {
            instance.recalculate();
        }
        instance
    }
    fn newFromJson(json:&str , funcLib: FuncLib) -> /* NAME */ {
        let model: Model = serde_json::from_str(json).unwrap();
        let topLevel = TopLevel::default();
        let interner:StringInterner<StringSymbol>  = StringInterner::<StringSymbol>::new();
        let mut instance = Self{model:model,funcLib:funcLib,interner:interner,topLevel:topLevel};
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
                    "todos": 
                        {
                            "1":{"blockedBy":null,"done":true},
                            "x":{"blockedBy":null,"done":true},
                            "y":{"blockedBy":null,"done":true},
                            "2":{"blockedBy":null,"done":true}
                        }
                }"#;
    let f: FuncLib = FuncLib{};

    let i: /*NAME*/ = /*NAME*/::newFromJson(data, f);

    // Do things just like with any other Rust data structure.
    println!("Test {:?}", i.model.todos);

    Ok(())
}/*,
                            "2":{"blockedBy":"1","done":false},
                            "3":{"blockedBy":"2","done":false}*/

fn main() -> () {
       let r = demo();
       match r {
           Result::Ok(()) => println!("ok"),
           Error => println!("error"),
       }
}


//// func ////

fn __/*ID*/(model: &Model,topLevel: &TopLevel,funcLib: &FuncLib,interner: &mut StringInterner<StringSymbol>/* ARGS */)->/* RETURN */ {
    /*EXPR1*/
}

//// topLevel ////
fn _/*FUNCNAME*/(model: &Model,topLevel: &TopLevel,funcLib: &FuncLib,interner: &mut StringInterner<StringSymbol>)->/* RETURN */ {
    /*EXPR*/
}