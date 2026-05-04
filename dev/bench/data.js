window.BENCHMARK_DATA = {
  "lastUpdate": 1777902743410,
  "repoUrl": "https://github.com/boundless-xyz/risc0-crypto",
  "entries": {
    "risc0-crypto benchmarks": [
      {
        "commit": {
          "author": {
            "email": "welzwo@gmail.com",
            "name": "Wolfgang Welz",
            "username": "Wollac"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3539b39cfa82fd353f0d4fa84c31a34e3a10723f",
          "message": "Add CI benchmarks for cycle counting (#16)\n\n* Add CI benchmarks for cycle counting (#13)\n\nCheck in the benchmark harness and add a CI job that tracks cycle\ncounts using github-action-benchmark. The host binary now supports\n--json <path> to emit results in customSmallerIsBetter format.\n\n* Install r0vm in bench CI job\n\nThe risc0-zkvm executor needs the r0vm binary at runtime to execute\nthe guest ELF.\n\n* Clean working tree before github-action-benchmark\n\ncargo run modifies bench/Cargo.lock during the build, which prevents\nthe action from switching to the gh-pages branch.\n\n* Update lockfiles and use --locked in CI\n\nRegenerate bench/Cargo.lock and bench/guest/Cargo.lock so they match\ncurrent crates.io state. Use --locked in CI to fail fast if they\ndrift.\n\n* Grant write permissions to bench job for gh-pages push\n\nThe github-action-benchmark action needs contents:write to push\nbenchmark data to the gh-pages branch.\n\n* Consolidate benchmarks by removing redundant entries\n\nRemove 10 benchmarks that duplicate existing ones:\n- field add_assign/mul_assign: same backend as add/mul (just += and *= syntax)\n- ec is_on_curve: cheap validation check, not a hot path\n- ec point_add_assign: same backend as point_add (just += syntax)\n- ecdsa rsign: nearly identical to sign; recovery path already covered by ecrecover\n\nReduces total benchmark count from ~35 to ~25 while keeping all\ndistinct operations: field (add, mul, inverse), EC (double, add,\nscalar_mul), ECDSA (sign, verify, recover), EIP comparisons, and modexp.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Restore ec/*/is_on_curve benchmark\n\nThis benchmark is sensitive to performance regressions and worth\ntracking as a stability indicator.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Reduce bench dependencies by disabling unused features\n\nHost:\n- risc0-zkvm: drop `bonsai` feature (remote proving not needed for local\n  benchmarks), removing reqwest and ~100 transitive packages\n- regex: set default-features = false, features = [\"std\", \"perf\"]\n  (bench regex is ASCII-only; unicode features are still unified in by\n  lazy-regex, but explicit is cleaner)\n- tabular: drop unicode-width (bench names are ASCII)\n\nGuest:\n- risc0-zkvm: set default-features = false (host-only features like\n  client/bonsai are already cfg'd out on the zkvm target, but this\n  keeps the lockfile lean)\n\nTotal packages: 370 -> 268 (host), lockfiles shrink by ~3,200 lines.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Simplify and fix benchmark code after review\n\n- Fix bls12_381_g1_add_risc0 to use new_in_subgroup (EIP-2537 requires\n  subgroup checks; the add benchmark was understating cycle cost)\n- Fix point_add benchmark to use a distinct point (GENERATOR.double())\n  instead of adding G+G which exercises the doubling special case\n- Rename FIELD_ITERS -> BENCH_ITERS (used for both field and EC benchmarks)\n- Remove unnecessary manual padding in read_scalar_risc0\n  (BigInt::from_be_bytes already handles short inputs)\n- Assert ecdsa_verify result to catch silent failures\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Pre-format cycle markers outside timed regions\n\nformat!() allocates on the heap, adding measurement noise when called\ninside the timed span (between cycle-start and cycle-end markers).\nMove all format!() calls before the timed region in bench_field,\nbench_ec, bench_ecdsa macros, and the MSM loop.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Revert bls12_381_g1_add_risc0 subgroup check back to on-curve only\n\nThe add benchmark measures point addition cost, not input validation.\nThe subgroup check (new_in_subgroup) adds two 255-bit scalar muls to\nthe timed region, dominating the measurement. The MSM benchmark already\nuses new_in_subgroup where EIP-2537 requires it.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Revert guest risc0-zkvm default-features change\n\nThe default-features = false on the guest's risc0-zkvm was cosmetic\n(host code is cfg-gated out on the zkvm target) but caused a full\nlockfile regeneration that changed dependency versions. Restore the\noriginal guest Cargo.toml and Cargo.lock to match the known-working\nstate.\n\nhttps://claude.ai/code/session_01P1ZS7kqPxKDmQwAVPtwLVk\n\n* Revert \"Pre-format cycle markers outside timed regions\"\n\nThis reverts commit 7e867ded2e16db3e1a6b5df0641e5b5be401bd0a.\n\n* Remove patched-crate comparisons from benchmarks\n\nDrop k256, substrate-bn, and blst comparison benchmarks and their\ndependencies. Precompile comparisons can be added in a follow-up PR.\n\n* Format MSM benchmark topic names\n\nUse underscore separator (msm_1, msm_128) instead of path separator\nto avoid an extra grouping level in the output table.\n\n* Drop point_double and 4096-bit full-exponent benchmarks\n\npoint_double is covered by scalar_mul (~256 doubles per run).\n4096-bit full-width exponents don't occur on-chain - real modexp\ncalls at that size use tiny exponents (e=65537 for RSA verify),\nwhich we already benchmark.\n\n* Only push benchmark data on main, always comment on PRs\n\nauto-push only on main avoids writing intermediate data from PR\nbranches. comment-always on PRs shows the benchmark comparison\neven when there is no regression.\n\n* Move GITHUB_PATH setup into rzup install step\n\nAdd ~/.risc0/bin to GITHUB_PATH right after installing rzup, so\nsubsequent steps can find it without a redundant export.\n\n* Apply same rzup PATH fix to Guest Test job\n\n* Grant pull-requests:write for benchmark PR comments\n\n* Reduce bench timeout to 30 minutes\n\n* Remove explicit bench timeout, use GitHub default\n\n* Refactor bench guest: real mainnet data, bench! macro, cleanup\n\n- Add bench! macro that pre-formats cycle markers before the timed\n  region, avoiding formatting cycles in measurements\n- Replace synthetic test inputs with real Ethereum mainnet precompile\n  call data (ecrecover, EIP-196, EIP-2537, modexp) sourced via Dune\n- Use hex-literal crate for readable inline test vectors\n- Extract shared decode/encode helpers for BN254 and BLS12-381\n- Remove setup functions, asserts, and redundant black_box on inputs\n- Shrink modexp exponent types to minimum required size\n\n* Clean up bench: add timeout, trim comments, scope BLS types\n\n* Restore doc comments on bench helper functions\n\n* Remove redundant ecrecover doc comment and EC curve list\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-04-14T15:07:09+02:00",
          "tree_id": "6148104ff31ebffa46aa41ec6e817fbe79ce3206",
          "url": "https://github.com/Wollac/risc0-crypto/commit/3539b39cfa82fd353f0d4fa84c31a34e3a10723f"
        },
        "date": 1776172219017,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "ecrecover",
            "value": 119233,
            "unit": "cycles"
          },
          {
            "name": "eip196/add",
            "value": 2357,
            "unit": "cycles"
          },
          {
            "name": "eip196/mul",
            "value": 71200,
            "unit": "cycles"
          },
          {
            "name": "eip2537/add",
            "value": 3207,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_1",
            "value": 184186,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_128",
            "value": 17981471,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/add",
            "value": 85,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/mul",
            "value": 93,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/inverse",
            "value": 101,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/add",
            "value": 152,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/mul",
            "value": 170,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/inverse",
            "value": 179,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/is_on_curve",
            "value": 355,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/point_add",
            "value": 350,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/scalar_mul",
            "value": 68230,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_sign",
            "value": 67421,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_verify",
            "value": 83743,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_recover",
            "value": 103904,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/is_on_curve",
            "value": 445,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/point_add",
            "value": 464,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/scalar_mul",
            "value": 107264,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_sign",
            "value": 105758,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_verify",
            "value": 167583,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_recover",
            "value": 227239,
            "unit": "cycles"
          },
          {
            "name": "modexp/256bit",
            "value": 26891,
            "unit": "cycles"
          },
          {
            "name": "modexp/384bit",
            "value": 49215,
            "unit": "cycles"
          },
          {
            "name": "modexp/4096bit_e65537",
            "value": 10370,
            "unit": "cycles"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "welzwo@gmail.com",
            "name": "Wolfgang Welz",
            "username": "Wollac"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "320a9dfe61fe0ffc1ff2f732d894dfa9647a188c",
          "message": "Link to live benchmark dashboard in README (#17)",
          "timestamp": "2026-04-14T19:23:37+02:00",
          "tree_id": "943fcaeb64d9c43ab5a8df212c932cc06bb4aaa2",
          "url": "https://github.com/Wollac/risc0-crypto/commit/320a9dfe61fe0ffc1ff2f732d894dfa9647a188c"
        },
        "date": 1776187635780,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "ecrecover",
            "value": 119233,
            "unit": "cycles"
          },
          {
            "name": "eip196/add",
            "value": 2357,
            "unit": "cycles"
          },
          {
            "name": "eip196/mul",
            "value": 71200,
            "unit": "cycles"
          },
          {
            "name": "eip2537/add",
            "value": 3207,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_1",
            "value": 184186,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_128",
            "value": 17981471,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/add",
            "value": 85,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/mul",
            "value": 93,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/inverse",
            "value": 101,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/add",
            "value": 152,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/mul",
            "value": 170,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/inverse",
            "value": 179,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/is_on_curve",
            "value": 355,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/point_add",
            "value": 350,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/scalar_mul",
            "value": 68230,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_sign",
            "value": 67421,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_verify",
            "value": 83743,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_recover",
            "value": 103904,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/is_on_curve",
            "value": 445,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/point_add",
            "value": 464,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/scalar_mul",
            "value": 107264,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_sign",
            "value": 105758,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_verify",
            "value": 167583,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_recover",
            "value": 227239,
            "unit": "cycles"
          },
          {
            "name": "modexp/256bit",
            "value": 26891,
            "unit": "cycles"
          },
          {
            "name": "modexp/384bit",
            "value": 49215,
            "unit": "cycles"
          },
          {
            "name": "modexp/4096bit_e65537",
            "value": 10370,
            "unit": "cycles"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "welzwo@gmail.com",
            "name": "Wolfgang Welz",
            "username": "Wollac"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b344243f4c6d08d1a9efe8d46ebaa9393d02e2f7",
          "message": "Migrate from Wollac/risc0-crypto (#1)\n\n* Initial commit\n\n* add project source and CI\n\n* fix links in README\n\n* Introduce Unreduced<P, N> type for unchecked field arithmetic (#1)\n\n* improve abstraction\n\n* cleanups\n\n* cleanup casts\n\n* missing SubAssign\n\n* refactor Unreduced: unify operator impls via AsRef, move reduce logic\n\n- Unify duplicated Unreduced operator impls (separate &Self and &Fp\n  variants) into single generic impls via T: AsRef<Unreduced<P, N>>\n- Move reduce_in_place/reduce from Fp to Unreduced where they belong\n- Add reduce_in_place returning &Fp for zero-copy in-place reduction\n- Avoid constructing potentially-invalid Fp in from_bigint\n- Downgrade BigInt::partial_cmp from inline(always) to inline\n- Fix doc link style to match stdlib convention\n\n* move canonicality check from Fp::is_valid to Unreduced::is_canonical\n\nFp's type invariant guarantees values are always in [0, p), making\nis_valid() tautologically true. The check belongs on Unreduced, which\nmay hold non-canonical values.\n\n* make CHUNK_BASE an Unreduced since it may be >= p\n\n* tighten Fp/Unreduced type boundary and clean up API\n\n- Make Unreduced own its fields (BigInt + PhantomData) instead of wrapping Fp,\n  with derived TransparentWrapper\n- Make Fp::from_bigint_unchecked unsafe (type invariant: inner < p)\n- Move is_valid from Fp to Unreduced::is_canonical\n- Move reduce/reduce_in_place from public Fp to private Unreduced\n- Unify Unreduced operator impls via generic T: AsRef<Unreduced>\n- Scalar mul accepts Unreduced<ScalarFieldConfig> instead of requiring Fp\n- Replace unsafe from_bigint_unchecked in tests with Unreduced::from_bigint\n- Add AsRef<[u32; N]> to BigInt, remove as_limbs/to_limbs from Fp/Unreduced\n- Add From<BigInt> and to_bigint for Unreduced\n- Standardize section comments and code organization\n- Add comprehensive Unreduced tests\n\n* remove Unreduced::as_bigint_mut and update CLAUDE.md docs\n\nRemove unused as_bigint_mut - no realistic use case for in-place BigInt\nmutation on Unreduced (callers build BigInt first, then wrap). Update\nCLAUDE.md to reflect the Unreduced/Fp type split and current trait names.\n\n* Add BigInt::bit_len() and MODULUS_BIT_LEN const (#2)\n\n* Add BigInt::bit_len() and MODULUS_BIT_LEN const\n\nIntroduce a const fn on BigInt that returns the minimum number of bits\nneeded to represent the value. Use it to auto-compute MODULUS_BIT_LEN\non R0FieldConfig, forwarded through FpConfig and exposed on Fp.\n\n* Use MODULUS_BIT_LEN to optimize Fp::from_u32, deduplicate BitAccess::bits()\n\n- Fp::from_u32: skip bounds check when MODULUS_BIT_LEN > 32 (all real fields)\n- BitAccess::bits(): delegate to BigInt::bit_len() instead of duplicating logic\n- BigInt::bit_len(): use cleaner (i+1)*LIMB_BITS - leading_zeros form\n- Remove redundant bigint_bits test (covered by bigint::tests::bit_len)\n\n* Add secp384r1 (NIST P-384) curve (#4)\n\n* Use limb-by-limb equality for BigInt instead of derived memcmp (#5)\n\nThe derived PartialEq uses memcmp which has overhead in the R0VM. Manual\nlimb comparison via const_eq is cheaper.\n\n* Direct EC FFI with pluggable CurveOps backend (#6)\n\n* Replace risc0_bigint2::ec with direct FFI to bigint2 syscalls\n\nReplace the ec::AffinePoint / CurveBridge abstraction with a direct FFI\nlayer that calls raw bigint2 circuits via precompiled blobs. This gives\nfull control over point arithmetic and removes the transmute-based\nconst construction workaround.\n\nKey changes:\n- AffinePoint now stores Option<[BigInt<N>; 2]> instead of wrapping\n  ec::AffinePoint\n- New src/curve/ffi.rs with ec_add_raw / ec_double_raw wrappers\n- build.rs copies EC blobs from risc0-bigint2 into OUT_DIR\n- Scalar multiplication uses explicit double-and-add loop\n- Add Neg / Sub / SubAssign for AffinePoint (delegates to Add + negate y)\n- Add Hash impl for BigInt (consistent with custom PartialEq)\n- Export Double / DoubleAssign traits\n- mul_into is now pub(crate) taking &BigInt<N> directly\n- Remove Unreduced BitAccess impl (callers use .as_bigint())\n\n* update CLAUDE.md\n\n* minor cleanups\n\n* Reorganize curve module, improve docs and code clarity\n\n- Merge curve/ffi.rs into curve/ops.rs (mirrors field/ops.rs structure):\n  mod.rs has types + traits + operators (backend-agnostic),\n  ops.rs has FFI + blanket impl (backend-specific, swap to retarget)\n- Rename RawAffine -> RawCoords (coordinate pair, not a full point)\n- Reorder traits: R0CurveConfig before SWCurveConfig (matches field)\n- Reorder operators: Add, Sub, Mul, Neg, then assigns (matches field)\n- Add SAFETY comments to all unsafe blocks in curve module\n- Rewrite Add/AddAssign as match expressions with single x-guard\n- Add xy_unreduced() for efficient coordinate access without .check()\n- Add EC aliasing tests in curve/ops.rs using secp256k1 test vectors\n- Document AffinePoint unreduced coordinates, scalar_mul semantics\n- Document build.rs blob-copying workaround for risc0-bigint2 EC API\n- Use consistent naming: coords (read-only), a_xy/b_xy (arithmetic)\n\n* update CLAUDE.md\n\n* minor cleanups\n\n* Enforce on-curve invariant for AffinePoint\n\nSplit constructors into three tiers:\n- new(x, y): checks on-curve, returns Option (public)\n- new_in_subgroup(x, y): checks on-curve + subgroup (public)\n- new_unchecked(x, y): unsafe, for external curve implementors\n- from_xy(x, y): pub(crate), used by internal code and generators\n\nSubgroup membership is deliberately not enforced at the type level -\naddition is well-defined on the full curve group and use cases like\nEIP-2537 require it.\n\n* Document on-curve invariant, clean up public vs internal docs\n\n* Add TODO: y == 0 check is redundant when cofactor is odd\n\n* Make curve::ops module private\n\nThe ops module only provides a blanket impl - nothing outside curve/\nreferences it by name.\n\n* Update CLAUDE.md with on-curve invariant and constructor tiers\n\n* Fix dishonest prover exploit in AffinePoint equality and coordinate comparisons\n\nA dishonest prover returning unreduced coordinates (e.g. y+p instead of y)\ncould forge [2]P = O by making equal y-coords look different in the same-x\nbranch of point addition.\n\n- Replace derived PartialEq/Hash with manual impls that assert canonical coords\n- Add Unreduced::check_is_eq() for efficient checked field equality (~6% faster\n  is_on_curve via avoiding Fp copies)\n- Use check_is_eq for y-coord comparison in Add/AddAssign same-x branch\n- Document self-correcting properties of x-coord and y==0 checks\n- Add TODO for using Unreduced type in RawCoords to prevent raw BigInt comparisons\n\n* Add discriminant_is_nonzero test to all curves\n\nVerify 4A³ + 27B² != 0 (mod p) for each curve config, ensuring the\ncurve is non-singular. Also simplify checked_coords using xy_unreduced.\n\n* Refactor EC architecture: fat CurveConfig trait with pluggable CurveOps backend\n\nDelete R0CurveConfig and consolidate into CurveConfig (renamed from SWCurveConfig).\nEC operations are delegated to an associated CurveOps type, with R0VMCurveOps as the\nR0VM backend. This breaks the trait-resolution cycle and moves all unsafe FFI into\nops.rs behind safe CurveOps methods.\n\nKey changes:\n- CurveConfig is the sole trait for defining curves (type Ops selects the backend)\n- CurveOps trait with add/add_assign/double/double_assign (safe, default assign impls)\n- R0VMCurveOps (empty enum) implements CurveOps via sys_bigint2 FFI\n- Coords<C, N> is now [Unreduced; 2] (typed coordinates, not raw BigInt)\n- AffinePoint stores Option<Coords<C, N>> directly (no PhantomData needed)\n- All unsafe removed from AffinePoint methods\n- Unreduced gains raw_eq() for self-correcting limb comparisons\n- TransparentWrapper-guarded pointer casts (cast_coords/cast_coords_mut)\n- CurveParams helper trait for compile-time [modulus, a, b]\n- LIMBS_256/LIMBS_384 constants replace raw 8/12 in curve definitions\n- Consistent trait bound order: Sized + Send + Sync + 'static\n- Tightened visibility: field::ops and Fp::as_unreduced_mut now private\n\n* Add zero-copy xy_ref() accessor for AffinePoint\n\nAdd Unreduced::check_ref() which asserts canonical and returns &Fp via a\nlayout-guarded pointer cast (const size_of/align_of assertions). Use this\nin new AffinePoint::xy_ref() to return Option<(&Fp, &Fp)> without copying.\n\nPartialEq and Hash now use xy_ref() for zero-copy comparisons. The existing\nxy() method is unchanged (returns owned values) for caller ergonomics.\n\nAlso inlines is_in_correct_subgroup default using wrap_ref to avoid a copy,\nand promotes xy/check/is_canonical to #[inline(always)].\n\n* Refactor Unreduced: check-vs-reduce semantics, add fp_reduce\n\nReframe Unreduced around two explicit strategies for leaving the struct:\n- check (assert canonical): check, check_ref, check_is_eq\n- reduce (force canonical): reduce, reduce_in_place\n\nKey changes:\n- Add FpConfig::fp_reduce for backend-provided canonical reduction\n- Add reduce_in_place(&mut self) -> &Fp with MSB fast path\n- Remove Unreduced::is_zero (use reduce().is_zero() instead)\n- Remove dishonest-prover framing from all docs\n- Make raw_eq pub(crate), reorder methods by category\n- Consolidate and expand tests for check/reduce coverage\n\n* update CLAUDE.md\n\n* Clean up AffinePoint: shared test macro, reorder impl blocks\n\n- Extract duplicated curve sanity tests (discriminant_is_nonzero,\n  generator_is_valid, mul_group_order_is_identity) into a\n  curve_sanity_tests!() macro in curves/mod.rs\n- Merge split impl blocks into a single inherent impl for AffinePoint\n- Reorder: std trait impls (Debug, PartialEq, Hash) before operator\n  impls, matching field/mod.rs and field/unreduced.rs conventions\n- Pair operator impls by operation (Add/AddAssign, Sub/SubAssign, etc.)\n- Use inline(always) only on xy/xy_ref/xy_unreduced accessors where\n  the compiler demonstrably failed to inline\n- Add #[inline] to PartialEq::eq and Hash::hash to match derive behavior\n- Make check_ref and xy_ref const\n\n* update CLAUDE.md\n\n* Add COFACTOR to CurveConfig, clear_cofactor, and cofactor-aware doubling\n\nAdd COFACTOR as a &'static [u32] LE slice to CurveConfig (same rationale\nas arkworks: avoids const generic proliferation for a variable-width\nnon-field integer). Default is_in_correct_subgroup now checks cofactor\nat compile time - cofactor-1 curves no longer need manual overrides.\n\nAdd AffinePoint::clear_cofactor() computing [h]P, with cofactor-1 no-op.\nPrivate cofactor module holds is_one/is_odd helpers and a Bits newtype\nthat implements BitAccess without a public impl on [u32].\n\nOptimize double/double_assign: skip y==0 check when cofactor is odd\n(no 2-torsion). For even cofactor, raw is_zero() suffices since an\nhonest prover returns reduced outputs and ec_double panics on y ≡ 0.\n\n* Use explicit ptr::from_ref in field aliasing tests\n\n* update CLAUDE.md\n\n* Expand BLS12-381 clear_cofactor test with mixed-order point\n\n* Pluggable FieldOps backend with UnverifiedFp security boundary (#7)\n\n* Pluggable FieldOps backend with UnverifiedFp security boundary\n\nRefactor field arithmetic to mirror the CurveOps pattern:\n\n- Replace R0FieldConfig + FpConfig with FieldConfig (defines MODULUS + type Ops)\n  and FieldOps (safe backend trait for field arithmetic)\n- Rename Unreduced<P,N> to UnverifiedFp<P,N> to reflect its role as a ZK\n  security boundary for under-constrained VM operations\n- Encapsulate all unsafe FFI in R0VMFieldOps - UnverifiedFp operators are now\n  fully safe, delegating to P::Ops methods\n- Remove reduce()/reduce_in_place() from UnverifiedFp; add Fp::reduce_from_bigint()\n  as the explicit reduction entry point\n- In both FieldOps and CurveOps, _assign variants are the required primitives;\n  non-assign methods have default implementations that copy and delegate\n\n* Standardize FFI dispatch with FieldFfi and CurveFfi traits\n\nReplace runtime match-on-N dispatching in curve ops with compile-time\ntrait bounds, matching the field ops pattern:\n\n- Rename SysFieldOps to FieldFfi\n- Introduce CurveFfi trait on BigInt<N> with sys_ec_add/sys_ec_double\n- Remove ec_add_raw/ec_double_raw generic functions with match N panics\n- Both R0VMFieldOps and R0VMCurveOps now use `where BigInt<N>: *Ffi`\n  bounds for compile-time width dispatch\n- Consistent #[inline(always)] on FFI wrappers, #[inline] on backends\n- Consistent safety docs, test style, and pointer handling\n\n* minor cleanups\n\n* Add CI guest test job (#8)\n\n* Add CI guest test job with risc0 v3 toolchain\n\n* Pass GITHUB_TOKEN to rzup to avoid API rate limits\n\n* Pin r0vm to 3.0.5 to match cargo-risczero branch\n\n* Add concurrency group and 60-minute timeout to CI\n\n* Cache cargo-risczero binary to skip 37-min build on hits\n\n* Remove redundant rzup install r0vm (cargo install provides it)\n\n* Add Wycheproof scalar multiplication tests (#10)\n\n* Add Wycheproof scalar multiplication tests\n\nUse ECDH EcPoint test vectors from the wycheproof crate to test scalar\nmultiplication for secp256r1 (355 vectors) and secp384r1. Tests cover\nvalid points, invalid/off-curve points, compressed encodings (rejected),\nand edge-case scalars.\n\n\n* Strip leading zero bytes from ECDH private key before parsing\n\nWycheproof encodes private keys as unsigned big-endian integers, which\nmay include a leading 0x00 byte when the high bit is set. This caused\n33-byte keys to be rejected for 256-bit curves.\n\n\n* Add TODO for compressed point support in parse_point\n\n\n* Simplify test result handling and fix doc comment\n\n- Use must_fail() instead of four-arm match on TestResult\n- Move expected_x computation inside the branch that uses it\n- Fix parse_point doc to mention off-curve rejection\n- Drop redundant inline comment\n\n\n---------\n\n* Add bare-bones ECDSA module (#3)\n\n* Add bare-bones ECDSA signing and verification module\n\nIntroduces `ecdsa::Signature<C, N>` generic over any `SWCurveConfig` curve:\n- `sign(d, k, hash)` - signs a big-endian hash digest with private key and nonce\n- `verify(pubkey, hash)` - verifies against a public key and hash\n- `new(r, s)` / `r()` / `s()` / `into_parts()` - construction and accessors\n\nDesign decisions:\n- No hash functions or RNG - caller provides pre-hashed digest bytes and nonce\n- Panics on invalid inputs (d=0, k=0); returns None for retry conditions (r=0, s=0)\n- Compile-time assertion that scalar and base field bit lengths match (ECDSA\n  requires p < 2n for soundness)\n- Uses Unreduced arithmetic in sign() to minimize canonicality checks on R0VM\n- Not Copy (signature is a credential, not a casual value)\n\n* update CLAUDE.md\n\n* Improve ECDSA module: docs, compile-time curve check, allow zero private key\n\n- Add module-level doc examples for sign/verify and compile_fail test for\n  unsupported curves (bit_len(n) < bit_len(p))\n- Remove assert on zero private key (valid edge case, produces r=0 -> None)\n- Use unsafe unwrap_unchecked for [k]G (cannot be identity for nonzero k)\n- Simplify s_inv: call .inverse() directly on Fp instead of going through\n  Unreduced\n- Add test for signing with zero private key\n- Update CLAUDE.md to document compile-time curve compatibility check\n\n* update README\n\n* Fix ECDSA module for post-rebase renames\n\nUpdate references after rebasing onto main: SWCurveConfig -> CurveConfig,\nUnreduced -> UnverifiedFp/Fp, as_unreduced -> as_unverified,\nUnreduced::from_bigint().reduce() -> Fp::reduce_from_bigint().\n\n* update CLAUDE.md\n\n* minor cleanups\n\n* update README\n\n* Add low-S normalization, optimize field negation\n\n- Add normalize_s/normalized_s for BIP-62 low-S signature form\n- Replace Fp negation syscall with direct p - x subtraction\n- Derive Debug via educe instead of manual impl\n- Use UnverifiedFp in verify() to skip unnecessary canonicality checks\n- Reorder methods and tests for better readability\n\n* update CLAUDE.md\n\n* minor cleanups\n\n* Add ECDSA recovery support with hint-based verification\n\nAdd RecoveryId (2-bit type: y_odd + x_reduced) and RecoverableSignature\nthat wraps Signature + RecoveryId. RecoverableSignature::sign auto-applies\nlow-S normalization. RecoverableSignature::verify checks both the ECDSA\nsignature and recovery ID against a provided public key hint - no point\ndecompression (sqrt) needed.\n\nAlso adds BigInt::is_even/is_odd, extracts Signature::reconstruct_r as\nshared helper for verify and recovery verify.\n\n* Extract sign_raw helper to deduplicate signing logic\n\nUnify the shared ECDSA signing computation between Signature::sign and\nRecoverableSignature::sign into a single sign_raw helper. Update CLAUDE.md\nto document RecoverableSignature and RecoveryId.\n\n* Add field pow/sqrt and const BigInt helpers\n\nBigInt: add const_add_u32, const_shr, and #[doc(hidden)] all const_\nhelpers. Reorder: comparisons first, then arithmetic.\n\nFieldConfig: add MODULUS_PLUS_ONE_DIV_FOUR with compile-time p % 4 == 3\nassert, computed automatically from MODULUS.\n\nUnverifiedFp: add square_in_place, pow (generic over BitAccess), sqrt.\nFp: add pow and sqrt wrappers.\n\nAlso replace runtime const_lt calls with < in assign ops.\n\n* Add Fp::is_high() and FieldConfig::HALF_MODULUS\n\nPrecompute floor(p/2) as a const on FieldConfig and expose\nFp::is_high() for checking whether a field element is in the\nupper half. Simplifies normalize_s to use is_high() instead of\ncomputing -s first for comparison.\n\n* Add ECDSA recovery, point decompression, and field improvements\n\n- RecoverableSignature::recover() - full public key recovery from\n  (r, s, v, hash) with proper overflow handling for is_x_reduced\n- AffinePoint::decompress() and ys_from_x() for point decompression,\n  returning (y_even, y_odd) per SEC 1 convention\n- Fp::is_high() for low-S normalization (BIP-62)\n- Generalize Fp AddAssign/SubAssign/MulAssign to accept &UnverifiedFp\n- Add BigInt Add/Sub (non-assign) operators\n- From<Fp> for BigInt conversion\n- Simplify check_is_eq to use raw_eq fast path\n- Remove auto-normalization from RecoverableSignature::sign\n- Add Ethereum/EIP-2 usage example in module docs\n\n* Refactor curve RHS computation and field ops\n\n- Replace `curve_rhs` helper with `add_a` method to avoid return-value\n  copies that RISC-V backend doesn't elide across scope boundaries\n- Move `neg_in_place` and `square_in_place` to default methods on\n  `FieldOps` trait with R0VM overrides for in-place FFI\n- Restore asymmetric `check_is_eq` (only assert the larger value)\n- Make `square_in_place` public on `UnverifiedFp`\n\n* Forbid input/output aliasing in EC and field inverse FFI\n\nThe bigint2 verify program for EC circuits has multiple EqualZeroOp\nconstraints. During proving, a kWrite to the output arena in an earlier\nconstraint corrupts subsequent kReads from an aliased input arena,\ncausing \"Bad carry\" errors. Field inverse has the same multi-constraint\nstructure but happens to be safe due to operand ordering in the zirgen\nFlattener - a coincidental property, not a structural guarantee.\n\nChanges:\n- CurveFfi: inputs are now &[Self; 2] references (were *const), output\n  stays *mut for MaybeUninit. Rust borrow rules enforce non-aliasing.\n- CurveOps: replace add_assign/double_assign with add_into/double_into\n  that write into &mut Coords. add/double kept as by-value defaults.\n- AffinePoint: change from Option<Coords> to Coords + bool for identity,\n  enabling direct writes into coords buffer without match/allocation.\n  Add double_into/add_into methods with double-buffered scalar_mul.\n- FieldFfi::sys_inv: input is now &Self (was *const Self).\n- Remove aliasing tests; add non-aliased equivalents.\n\n* Extract canonical_panic to reduce code size at check sites\n\nMove the panic formatting for canonicality assertions into a shared\n#[cold] #[inline(never)] function. This deduplicates the panic code\nacross check(), check_ref(), check_is_eq(), and the Fp assign ops,\nshrinking check_is_eq by ~25% (472 -> 352 bytes for P-256).\n\n* Mark AffinePoint::add #[inline(always)]\n\nThe private add() method is just the operator body extracted into a named\nmethod. Force-inlining restores the same single-function context LLVM had\nwhen the logic lived directly in the Add impl.\n\n* update CLAUDE.md\n\n* Document why AffinePoint::add duplicates add_into logic\n\n* Add double_scalar_mul (Shamir's trick) and use in ECDSA verify/recover\n\n- Add AffinePoint::double_scalar_mul for computing [a]P + [b]Q via\n  interleaved double-and-add, saving ~n doublings vs two scalar muls\n- Use double_scalar_mul in Signature::reconstruct_r and\n  RecoverableSignature::recover with check_ref for zero-cost canonical\n  checks on the scalar operands\n- In recover, use neg_in_place on the scalar rather than separate\n  scalar muls with subtraction\n- Add comment explaining scalar_mul's n-1 loop range (MSB always 1)\n- Add exhaustive and edge case tests for double_scalar_mul\n- Add EVM precompile benchmark table to README\n\n* Fix rustfmt: remove extra alignment spaces in comments\n\n* Add Wycheproof ECDSA P1363 verification tests (#9)\n\n* Add Wycheproof ECDSA P1363 verification tests\n\nAdds 764 test vectors from Google's Wycheproof project covering ECDSA\nsignature verification for secp256k1 (SHA-256), secp256r1 (SHA-256),\nand secp384r1 (SHA-384) using P1363 encoding. Tests cover valid\nsignatures, invalid signatures, edge cases (arithmetic errors, point\nduplication, modular inverse), and malleability checks.\n\n\n* Remove unnecessary sanity assertions on static test data\n\n\n* Replace stringly-typed test result with a serde enum\n\n\n* Remove unused Acceptable variant from test result enum\n\nNone of the three P1363 test sets contain \"acceptable\" results.\nThe enum will reject unknown values at parse time anyway.\n\n\n* Use super::* import in wycheproof test module\n\n\n* Simplify public key parsing: unwrap instead of defensive checks\n\nAll Wycheproof test groups have well-formed uncompressed public keys.\n\n\n* Unwrap hex::decode for sig: no malformed hex in test data\n\nWrong-length sigs, out-of-range r/s, and zero r/s all occur and are\nstill handled; only the hex decode error path was dead.\n\n\n* Extract parse_sig helper for P1363 signature parsing\n\n\n* Use new_in_subgroup for public key construction\n\n\n* Switch from vendored JSON to wycheproof crate\n\nReplace 700KB of checked-in test vectors and custom serde structs with\nthe wycheproof crate, which bundles and deserializes the same data.\nRemoves hex, serde, and serde_json dev-dependencies.\n\n\n* Minor cleanup: lazy hash, doc style, inline field_len\n\n- Defer hash computation until after signature parsing succeeds\n- Fix doc comment to match project style (lowercase, bullet-point)\n- Inline N * 4 instead of aliasing to field_len\n\n\n* Capitalize and condense parse_sig doc comment\n\n\n---------\n\n\n* Support compressed point parsing in Wycheproof tests\n\nHandle SEC1 compressed points (02/03 prefix) in the test point parser\nusing AffinePoint::decompress, which is now available.\n\n\n* Clean up tests and add BigInt::as_u32\n\n- Add BigInt::as_u32() for extracting small values with overflow check\n- Enforce subgroup membership in Wycheproof ECDH point parsing\n- Remove redundant ECDSA tests covered by Wycheproof suites\n- Make toy curve tests exhaustive and consistent using shared GROUP const\n- Remove trivial clear_cofactor test for cofactor-1 curve\n\n* Document hash-to-scalar conversion semantics in ECDSA module\n\n* Add CI benchmarks for cycle counting (#16)\n\n* Add CI benchmarks for cycle counting (#13)\n\nCheck in the benchmark harness and add a CI job that tracks cycle\ncounts using github-action-benchmark. The host binary now supports\n--json <path> to emit results in customSmallerIsBetter format.\n\n* Install r0vm in bench CI job\n\nThe risc0-zkvm executor needs the r0vm binary at runtime to execute\nthe guest ELF.\n\n* Clean working tree before github-action-benchmark\n\ncargo run modifies bench/Cargo.lock during the build, which prevents\nthe action from switching to the gh-pages branch.\n\n* Update lockfiles and use --locked in CI\n\nRegenerate bench/Cargo.lock and bench/guest/Cargo.lock so they match\ncurrent crates.io state. Use --locked in CI to fail fast if they\ndrift.\n\n* Grant write permissions to bench job for gh-pages push\n\nThe github-action-benchmark action needs contents:write to push\nbenchmark data to the gh-pages branch.\n\n* Consolidate benchmarks by removing redundant entries\n\nRemove 10 benchmarks that duplicate existing ones:\n- field add_assign/mul_assign: same backend as add/mul (just += and *= syntax)\n- ec is_on_curve: cheap validation check, not a hot path\n- ec point_add_assign: same backend as point_add (just += syntax)\n- ecdsa rsign: nearly identical to sign; recovery path already covered by ecrecover\n\nReduces total benchmark count from ~35 to ~25 while keeping all\ndistinct operations: field (add, mul, inverse), EC (double, add,\nscalar_mul), ECDSA (sign, verify, recover), EIP comparisons, and modexp.\n\n\n* Restore ec/*/is_on_curve benchmark\n\nThis benchmark is sensitive to performance regressions and worth\ntracking as a stability indicator.\n\n\n* Reduce bench dependencies by disabling unused features\n\nHost:\n- risc0-zkvm: drop `bonsai` feature (remote proving not needed for local\n  benchmarks), removing reqwest and ~100 transitive packages\n- regex: set default-features = false, features = [\"std\", \"perf\"]\n  (bench regex is ASCII-only; unicode features are still unified in by\n  lazy-regex, but explicit is cleaner)\n- tabular: drop unicode-width (bench names are ASCII)\n\nGuest:\n- risc0-zkvm: set default-features = false (host-only features like\n  client/bonsai are already cfg'd out on the zkvm target, but this\n  keeps the lockfile lean)\n\nTotal packages: 370 -> 268 (host), lockfiles shrink by ~3,200 lines.\n\n\n* Simplify and fix benchmark code after review\n\n- Fix bls12_381_g1_add_risc0 to use new_in_subgroup (EIP-2537 requires\n  subgroup checks; the add benchmark was understating cycle cost)\n- Fix point_add benchmark to use a distinct point (GENERATOR.double())\n  instead of adding G+G which exercises the doubling special case\n- Rename FIELD_ITERS -> BENCH_ITERS (used for both field and EC benchmarks)\n- Remove unnecessary manual padding in read_scalar_risc0\n  (BigInt::from_be_bytes already handles short inputs)\n- Assert ecdsa_verify result to catch silent failures\n\n\n* Pre-format cycle markers outside timed regions\n\nformat!() allocates on the heap, adding measurement noise when called\ninside the timed span (between cycle-start and cycle-end markers).\nMove all format!() calls before the timed region in bench_field,\nbench_ec, bench_ecdsa macros, and the MSM loop.\n\n\n* Revert bls12_381_g1_add_risc0 subgroup check back to on-curve only\n\nThe add benchmark measures point addition cost, not input validation.\nThe subgroup check (new_in_subgroup) adds two 255-bit scalar muls to\nthe timed region, dominating the measurement. The MSM benchmark already\nuses new_in_subgroup where EIP-2537 requires it.\n\n\n* Revert guest risc0-zkvm default-features change\n\nThe default-features = false on the guest's risc0-zkvm was cosmetic\n(host code is cfg-gated out on the zkvm target) but caused a full\nlockfile regeneration that changed dependency versions. Restore the\noriginal guest Cargo.toml and Cargo.lock to match the known-working\nstate.\n\n\n* Revert \"Pre-format cycle markers outside timed regions\"\n\nThis reverts commit 7e867ded2e16db3e1a6b5df0641e5b5be401bd0a.\n\n* Remove patched-crate comparisons from benchmarks\n\nDrop k256, substrate-bn, and blst comparison benchmarks and their\ndependencies. Precompile comparisons can be added in a follow-up PR.\n\n* Format MSM benchmark topic names\n\nUse underscore separator (msm_1, msm_128) instead of path separator\nto avoid an extra grouping level in the output table.\n\n* Drop point_double and 4096-bit full-exponent benchmarks\n\npoint_double is covered by scalar_mul (~256 doubles per run).\n4096-bit full-width exponents don't occur on-chain - real modexp\ncalls at that size use tiny exponents (e=65537 for RSA verify),\nwhich we already benchmark.\n\n* Only push benchmark data on main, always comment on PRs\n\nauto-push only on main avoids writing intermediate data from PR\nbranches. comment-always on PRs shows the benchmark comparison\neven when there is no regression.\n\n* Move GITHUB_PATH setup into rzup install step\n\nAdd ~/.risc0/bin to GITHUB_PATH right after installing rzup, so\nsubsequent steps can find it without a redundant export.\n\n* Apply same rzup PATH fix to Guest Test job\n\n* Grant pull-requests:write for benchmark PR comments\n\n* Reduce bench timeout to 30 minutes\n\n* Remove explicit bench timeout, use GitHub default\n\n* Refactor bench guest: real mainnet data, bench! macro, cleanup\n\n- Add bench! macro that pre-formats cycle markers before the timed\n  region, avoiding formatting cycles in measurements\n- Replace synthetic test inputs with real Ethereum mainnet precompile\n  call data (ecrecover, EIP-196, EIP-2537, modexp) sourced via Dune\n- Use hex-literal crate for readable inline test vectors\n- Extract shared decode/encode helpers for BN254 and BLS12-381\n- Remove setup functions, asserts, and redundant black_box on inputs\n- Shrink modexp exponent types to minimum required size\n\n* Clean up bench: add timeout, trim comments, scope BLS types\n\n* Restore doc comments on bench helper functions\n\n* Remove redundant ecrecover doc comment and EC curve list\n\n---------\n\n* Link to live benchmark dashboard in README (#17)\n\n* Add risc0-crypto-evm crate and restructure as workspace (#18)\n\n* Add risc0-crypto-evm crate and restructure as workspace\n\n- Introduce `crates/evm/` (`risc0-crypto-evm`): EVM-ABI wrappers over the\n  primitives (BN254 G1 add/mul, modexp, P-256 verify, ecrecover, SHA-256).\n  Ported from boundless-xyz/zeth#232. No revm dependency so zeth and kailua\n  can share precompile primitives across different revm versions.\n- Move the primitives into `crates/crypto/`; root becomes a virtual workspace.\n  `bench/` stays standalone via its own `[workspace]` table.\n- CI flags updated for the workspace layout; README split into a short root\n  index and the existing library walkthrough under the crate.\n\n* Hoist workspace lints, trim comments, shrink modexp allocs\n\n- Move duplicated [lints.*] blocks to root [workspace.lints], use lints.workspace = true in members\n- Drop WHAT comments in secp256k1/secp256r1/modexp that restated the doc comments\n- modexp_n: write the BigInt via a stack scratch so only the modulus.len()-sized\n  output hits the heap (was two heap allocs)\n\n* Migrate CI to boundless-xyz conventions\n\n- Replace Swatinem/rust-cache with boundless-xyz/boundless sccache action\n- Move heavy jobs (test, bench) to self-hosted runners\n- Keep lightweight jobs (check/clippy/fmt/doc) on ubuntu-latest\n- Swap benchmark-action to risc0/github-action-benchmark\n- Add id-token: write on jobs that use sccache OIDC\n\n* Pin dtolnay/rust-toolchain to org-allowlisted SHA\n\nThe org-level actions policy only permits dtolnay/rust-toolchain at a\nspecific SHA; @stable and @nightly tags are rejected. Pin to the allowed\nSHA and pass the toolchain name via the 'toolchain' input instead.\n\n* Run benchmark job on ubuntu-latest without sccache\n\nThe bench harness is small and runs infrequently (PR + merge-to-main);\nsccache + self-hosted is overkill. Keep guest tests on self-hosted with\nsccache since their builds are heavy.\n\n* Untrack CLAUDE.md to match boundless-xyz convention\n\nMatches the pattern in boundless-xyz/boundless: CLAUDE.md and AGENTS.md\nare developer-local only, never committed. The file stays on each\ncontributor's disk; the gitignore entry keeps it from being re-added.\n\n* Align CI with boundless-xyz conventions and simplify runners\n\n- Add merge_group trigger for GitHub merge queue compatibility\n- Scope concurrency by PR number so updates cancel prior PR runs\n- Set default shell to bash (-eo pipefail) so piped commands fail loudly\n- Export RUST_BACKTRACE=full for better panic diagnostics\n- Move guest test back to ubuntu-latest and drop sccache: avoids the\n  self-hosted runner access / OIDC config requirement for this repo\n\n* Add cargo sort check job\n\nRuns cargo sort --workspace --grouped --check on every push/PR to keep\nCargo.toml dependency ordering consistent. Does not cover bench/ since\nit is a separate workspace.\n\n* Bump cargo-sort to 2.1 and reformat crypto Cargo.toml\n\ncargo-sort 2.x enforces a stricter section order (metadata before deps,\nbuild-dependencies before dependencies) and collapses short arrays onto\none line. Reformat crates/crypto/Cargo.toml to match.\n\n* Fold check job into clippy and pin benchmark action SHA\n\nDrop the standalone Check job; broaden Clippy to --workspace --all-targets\nso it lints lib, bins, tests, benches, and examples in one pass. With\nrust-cache removed, this saves a from-scratch compile per PR and brings\nCI in line with the local dev workflow.\n\nPin risc0/github-action-benchmark to a SHA for consistency with the other\nSHA-pinned third-party actions in this workflow.\n\n* Adopt boundless-xyz license convention\n\nAdd Apache-2.0 file headers attributed to Boundless Foundation, Inc. on\nall tracked .rs sources, vendor the signal-xrpl-style license-check.py,\nand wire it into CI. Lift version, edition, license, homepage, and\nrepository into [workspace.package] so both crates inherit them.\n\n* Prepare crates for crates.io publish\n\nPer-crate LICENSE and README polish (zkVM-only banner, Security section,\nEIP/RIP links, refreshed perf table). Doc consistency pass (third-person\nsummaries, module-level docs, doc_cfg wiring). New workspace CHANGELOG.\nCI gates for doctests and docs.rs simulation on pinned nightly.\n\n* Tighten license-check.py and drop CI/README redundancies\n\n- license-check.py: empty/short files no longer pass the header check\n  trivially - zip silently truncated to the shorter sequence. Cache\n  repo_root instead of shelling out git rev-parse per file.\n- ci.yml: drop redundant --tests from clippy (--all-targets implies it).\n- README.md: drop dead \"Live benchmark tracking\" link to a stale fork.",
          "timestamp": "2026-05-04T14:51:11+02:00",
          "tree_id": "2d013e8448ac950dd8472a52c12bd533396fd2d7",
          "url": "https://github.com/boundless-xyz/risc0-crypto/commit/b344243f4c6d08d1a9efe8d46ebaa9393d02e2f7"
        },
        "date": 1777899264466,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "ecrecover",
            "value": 119233,
            "unit": "cycles"
          },
          {
            "name": "eip196/add",
            "value": 2357,
            "unit": "cycles"
          },
          {
            "name": "eip196/mul",
            "value": 71200,
            "unit": "cycles"
          },
          {
            "name": "eip2537/add",
            "value": 3207,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_1",
            "value": 184186,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_128",
            "value": 17981471,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/add",
            "value": 85,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/mul",
            "value": 93,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/inverse",
            "value": 101,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/add",
            "value": 152,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/mul",
            "value": 170,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/inverse",
            "value": 179,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/is_on_curve",
            "value": 355,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/point_add",
            "value": 350,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/scalar_mul",
            "value": 68230,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_sign",
            "value": 67421,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_verify",
            "value": 83743,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_recover",
            "value": 103904,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/is_on_curve",
            "value": 445,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/point_add",
            "value": 464,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/scalar_mul",
            "value": 107264,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_sign",
            "value": 105758,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_verify",
            "value": 167583,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_recover",
            "value": 227239,
            "unit": "cycles"
          },
          {
            "name": "modexp/256bit",
            "value": 26891,
            "unit": "cycles"
          },
          {
            "name": "modexp/384bit",
            "value": 49215,
            "unit": "cycles"
          },
          {
            "name": "modexp/4096bit_e65537",
            "value": 10370,
            "unit": "cycles"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "welzwo@gmail.com",
            "name": "Wolfgang Welz",
            "username": "Wollac"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "da6cca298767ed08f31eb582ffc80f25793d7e77",
          "message": "ci: add crates.io trusted-publishing release workflow (#3)",
          "timestamp": "2026-05-04T15:49:13+02:00",
          "tree_id": "42fa80f4c93133aa16e61aa1b68c7afb50d122f3",
          "url": "https://github.com/boundless-xyz/risc0-crypto/commit/da6cca298767ed08f31eb582ffc80f25793d7e77"
        },
        "date": 1777902742777,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "ecrecover",
            "value": 119233,
            "unit": "cycles"
          },
          {
            "name": "eip196/add",
            "value": 2357,
            "unit": "cycles"
          },
          {
            "name": "eip196/mul",
            "value": 71200,
            "unit": "cycles"
          },
          {
            "name": "eip2537/add",
            "value": 3207,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_1",
            "value": 184186,
            "unit": "cycles"
          },
          {
            "name": "eip2537/msm_128",
            "value": 17981471,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/add",
            "value": 85,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/mul",
            "value": 93,
            "unit": "cycles"
          },
          {
            "name": "field/secp256r1/inverse",
            "value": 101,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/add",
            "value": 152,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/mul",
            "value": 170,
            "unit": "cycles"
          },
          {
            "name": "field/secp384r1/inverse",
            "value": 179,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/is_on_curve",
            "value": 355,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/point_add",
            "value": 350,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/scalar_mul",
            "value": 68230,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_sign",
            "value": 67421,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_verify",
            "value": 83743,
            "unit": "cycles"
          },
          {
            "name": "ec/secp256r1/ecdsa_recover",
            "value": 103904,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/is_on_curve",
            "value": 445,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/point_add",
            "value": 464,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/scalar_mul",
            "value": 107264,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_sign",
            "value": 105758,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_verify",
            "value": 167583,
            "unit": "cycles"
          },
          {
            "name": "ec/secp384r1/ecdsa_recover",
            "value": 227239,
            "unit": "cycles"
          },
          {
            "name": "modexp/256bit",
            "value": 26891,
            "unit": "cycles"
          },
          {
            "name": "modexp/384bit",
            "value": 49215,
            "unit": "cycles"
          },
          {
            "name": "modexp/4096bit_e65537",
            "value": 10370,
            "unit": "cycles"
          }
        ]
      }
    ]
  }
}