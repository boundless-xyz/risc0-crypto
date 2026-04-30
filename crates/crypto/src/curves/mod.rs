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

//! Concrete curve definitions.
//!
//! Each submodule defines the base field, scalar field, and [`CurveConfig`](crate::CurveConfig)
//! for one curve. Use these via [`AffinePoint`](crate::AffinePoint) for arithmetic and
//! [`Signature`](crate::ecdsa::Signature) for ECDSA.

/// Standard curve validation tests. Every curve module should invoke this.
///
/// Assumes the module defines `Config`, `Fq`, `FrConfig`, and `Affine` (all curve modules
/// follow this convention).
#[cfg(test)]
macro_rules! curve_sanity_tests {
    () => {
        #[test]
        fn discriminant_is_nonzero() {
            // 4A³ + 27B² != 0 ensures the curve is non-singular
            let (a, b) = (Config::COEFF_A, Config::COEFF_B);
            let disc = &(&(&(&a * &a) * &a) * &Fq::from_u32(4)) + &(&(&b * &b) * &Fq::from_u32(27));
            assert!(!disc.is_zero());
        }

        #[test]
        fn generator_is_valid() {
            assert!(Affine::GENERATOR.is_on_curve());
            assert!(Affine::GENERATOR.is_in_correct_subgroup());
        }

        #[test]
        fn mul_group_order_is_identity() {
            use crate::FieldConfig as _;
            let order = crate::UnverifiedFp::from_bigint(FrConfig::MODULUS);
            assert!((&Affine::GENERATOR * &order).is_identity());
        }
    };
}

pub mod bls12_381;
pub mod bn254;
pub mod grumpkin;
pub mod secp256k1;
pub mod secp256r1;
pub mod secp384r1;
