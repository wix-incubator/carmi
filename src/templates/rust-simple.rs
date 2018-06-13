//// base ////
use std::io::{self, Read};
use std::collections::HashMap;
extern crate string_interner;
extern crate serde_json;
extern crate serde_state as serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_derive_state;
use string_interner::StringInterner;
use string_interner::Symbol;
use serde_json::Error;
use std::cmp::Ordering;
use serde::de::{Deserialize, Deserializer, DeserializeState};
use std::borrow::BorrowMut;

#[derive(PartialEq,PartialOrd,Copy,Eq,Clone,Ord,Hash,Debug)]
struct StringSymbol(usize);

impl Symbol for StringSymbol {
    fn from_usize(val: usize) -> Self {
        StringSymbol(val)
    }
    fn to_usize(self) -> usize {
        (self.0)
    }
}

trait ToSymbol {
    fn toSymbol(&mut self, source: String) -> StringSymbol;
}

impl ToSymbol for StringInterner<StringSymbol> {
    fn toSymbol(&mut self, source: String) -> StringSymbol {
        self.get_or_intern(source)
    }
}

impl<'de, S> DeserializeState<'de, S> for StringSymbol where S: ToSymbol {
    fn deserialize_state<D>(seed: &mut S, deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        Ok(seed.toSymbol( String::deserialize(deserializer).unwrap()))
    }
}

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
        let mut interner:StringInterner<StringSymbol>  = StringInterner::<StringSymbol>::new();
        let mut deserializer = serde_json::Deserializer::from_str(json);
        interner.get_or_intern("".to_string());
        let model: Model = Model::deserialize_state(&mut interner,&mut deserializer).unwrap();
        let topLevel = TopLevel::default();
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
                            "2":{"blockedBy":"1","done":false},
                            "3":{"blockedBy":null,"done":true},
                            "4":{"blockedBy":"2","done":false}
                        }
                }"#;
    let f: FuncLib = FuncLib{};

    let i: /*NAME*/ = /*NAME*/::newFromJson(data, f);

    // Do things just like with any other Rust data structure.
    println!("Test {:?}", i.topLevel);

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