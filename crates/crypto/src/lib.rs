// Copyright 2026 Boundless Foundation, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#![doc = include_str!("../README.md")]
#![no_std]

pub mod bigint;
pub mod curve;
pub mod curves;
pub mod ecdsa;
pub mod field;
pub mod modexp;

/// Creates a [`BigInt`] from a hex string literal.
///
/// Panics if the value overflows `N` limbs.
///
/// ```
/// # use risc0_crypto::{BigInt, bigint};
/// const ONE: BigInt<8> = bigint!("0x1");
/// ```
#[macro_export]
macro_rules! bigint {
    ($hex:literal) => {
        $crate::BigInt::from_hex($hex)
    };
}

/// Creates an [`Fp`] from a hex string literal.
///
/// Panics if the value is `>= p`.
///
/// ```
/// # use risc0_crypto::{curves::secp256k1::Fq, fp};
/// const A: Fq = fp!("0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc");
/// ```
#[macro_export]
macro_rules! fp {
    ($hex:literal) => {
        match $crate::Fp::from_bigint($crate::bigint!($hex)) {
            Some(fp) => fp,
            None => panic!("field element must be less than the modulus"),
        }
    };
}

/// Number of `u32` limbs for a 256-bit value.
pub const LIMBS_256: usize = 8;
/// Number of `u32` limbs for a 384-bit value.
pub const LIMBS_384: usize = 12;

pub use bigint::BigInt;
pub use curve::{AffinePoint, Coords, CurveConfig, CurveOps, R0VMCurveOps};
pub use field::{FieldConfig, FieldOps, Fp, Fp256, Fp384, R0VMFieldOps, UnverifiedFp};
pub use modexp::{BitAccess, ModMul, modexp};
