//! Inspired by the [secrecy](https://docs.rs/secrecy/0.8.0/secrecy/) crate,
//! this derives Debug and Display traits that don't display the actual
//! contents.
//!
//! If something tries to display the contents of a type using this derivation,
//! it will show up as `[[SECRET]]` for Display or `Type { SECRET }` for Debug.
//!
//! For example, here's a basic wrapper around a string.
//!
//! ```rust
//! #[derive(simple_secrecy::Debug, simple_secrecy::Display)]
//! /// A wrapper around a string.
//! struct Password(String);
//!
//! let secret_password = Password("correct horse battery staple".to_string());
//!
//! let out = format!("My password: {}", secret_password);
//! assert_eq!(out, "My password: [[SECRET]]");
//!
//! let out_debug = format!("Logging value {:?}", secret_password);
//! assert_eq!(out_debug, "Logging value Password { SECRET }");
//! ```

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};
extern crate proc_macro;

#[proc_macro_derive(Debug)]
pub fn secrecy_debug(tokens: TokenStream) -> TokenStream {
    let input = parse_macro_input!(tokens as DeriveInput);
    let name = input.ident;
    let name_str = format!("{} {{ SECRET }}", name);

    let modified = quote! {
        impl std::fmt::Debug for #name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.debug_struct(#name_str).finish()
            }
        }
    };
    TokenStream::from(modified)
}

#[proc_macro_derive(Display)]
pub fn secrecy_display(tokens: TokenStream) -> TokenStream {
    let input = parse_macro_input!(tokens as DeriveInput);
    let name = input.ident;

    let modified = quote! {
        impl std::fmt::Display for #name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "[[SECRET]]")
            }
        }
    };
    TokenStream::from(modified)
}
