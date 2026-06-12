# BlockLang Base Block Rules

These rules are the foundation of BlockLang and must always be upheld in code, UI behavior, validation, compilation, and emulation.

## 1. Everything Is A Block

Every concept is represented as a block: constants, variables, expressions, statements, control flow, function calls, type signatures, and functions.

Smaller blocks may build larger blocks only when the receiving slot accepts that block. Typed value slots must reject mismatches. For example, a `string` value must not be assigned to a `number` variable.

## 2. Nested Blocks Always Use Mini View

When one block is placed inside another block, the nested block must always be shown as a mini block view, no matter how deeply it is nested.

Clicking a mini block view must open that block in the block editor. The full block view is reserved for top-level canvas blocks and the root block currently opened in an editor.

## 3. Value Blocks Fit Compatible Value Slots

Blocks that return a value, such as `number`, `string`, or `boolean`, may be used anywhere that expects that same value type.

The accepted value-returning blocks are constants, variables, expressions, value references, and non-void function calls. Blocks that do not return a value, including `void` function calls, must not be accepted in value slots.

**Constants (primitives)** always fit typed value slots; on attach they coerce to the slot's expected type.

## 4. Return Statement Block

Functions declare a return *type* on the Function block footer (RETURNS type selector). Use **Return** statement blocks inside the function body (including if/else and loop branches) to send values back.

- Multiple Return blocks are allowed; the first one reached during execution wins.
- **Non-void** functions: Return block has a typed value slot (constants, variables, expressions, in-scope refs). Primitives coerce to the function return type.
- **Void** functions: Return block has no value slot and emits `return;`.
- If no Return runs, non-void functions fall back to an implicit default (`0`, `''`, or `false`).
- Expression blocks in a function body do **not** implicitly return.
