# BlockLang — Visual TypeScript Learning System (MVP)

## Overview

BlockLang is a visual programming system designed to teach core programming fundamentals using puzzle-like blocks. It focuses on real TypeScript concepts presented visually, helping beginners understand how code is structured before writing text-based code.

The system is intentionally minimal and includes only:
- numbers
- strings
- booleans
- variables
- expressions
- functions
- control flow

---

## Goal

Help learners understand:
- Data types (`number`, `string`, `boolean`)
- Variables and assignments
- Functions and function calls
- Control flow (if/else, loops)
- Execution flow starting from a main function

All concepts directly map to TypeScript.

---

## Core Concept

- Programs are built using **typed puzzle blocks**
- Blocks only connect if their types match
- Execution always starts from a **Main Function Block**
- Functions connect via **node-based connections**
- A program can be executed using an **Emulate Button**

---

## Key Principles

### 1. Strict Type System

Supported types:
- `number`
- `string`
- `boolean`

Rules:
- Every value has a type
- Type mismatches are not allowed
- Invalid connections are blocked visually

---

### 2. Puzzle-Based Structure

Blocks behave like constrained puzzle pieces:
- Each block has defined input/output slots
- Only compatible types can connect
- No free-form placement is allowed

---

### 3. Node-Based Connections (Functions)

Functions are connected via nodes:
- Inputs → typed parameters
- Outputs → return values
- Connections only allowed if types match

---

### 4. Main Function Block (Entry Point)

Every program must have:


MAIN FUNCTION


Rules:
- Execution always starts here
- Cannot be deleted or nested
- Can call other functions via connections
- Contains program flow

---

### 5. Emulate Button (Execution)

A global **Emulate** button runs the program.

Behavior:
- Starts execution from MAIN FUNCTION
- Executes connected flow step-by-step
- Shows live state updates
- Highlights active block during execution

---

## Block System Design

---

## 1. Primitive Type Blocks

| Block Type | Meaning (TypeScript equivalent) |
|------------|--------------------------------|
| number     | number                         |
| string     | string                         |
| boolean    | boolean                        |

---

## 2. Variable Block

Structure:


[type] [name] = [value]


Example:


number x = 5
string name = "Ali"
boolean isActive = true


Rules:
- Type must be selected first
- Value must match the type
- Name must be valid identifier
- Type mismatch is not allowed

---

## 3. Expression Blocks

Supported operations:
- `+ - * /`
- `== != > <`

Example:


x = a + b


Rules:
- Expressions output a typed value
- Types must match operation rules
- Invalid operations are blocked

---

## 4. Control Flow Blocks

---

### If Block

Structure:


IF (condition)
→ TRUE BLOCK
ELSE
→ FALSE BLOCK (optional)


Rules:
- Condition must always return boolean
- Both branches accept statement blocks
- Execution follows condition result

---

### Loop Blocks

Supported loops:
- for loop
- while loop

#### For Loop Structure


for (number i = 0; i < 10; i++)


Visual structure:
- Initialization (number)
- Condition (boolean)
- Increment (number expression)
- Body (statements)

---

## 5. Function Block

A function is a **single reusable block unit**.

### Structure:


FUNCTION name
INPUTS:
typed parameters
RETURNS:
type (number | string | boolean | void)
BODY:
statements


Example:


function add(number a, number b) -> number
return a + b


Rules:
- Functions are self-contained blocks
- Cannot be nested inside other functions
- Must define input and output types
- Can only be connected via nodes (not embedded inside other blocks)

---

## 6. Function Call Block

Used inside MAIN or other functions:


add(2, 3)


Rules:
- Must match function signature exactly
- Inputs must match parameter types
- Output type is enforced
- Can only connect through nodes or assignments

---

## Connection System

### Node-Based Rules

Each block has:
- Input nodes
- Output nodes

Connections allowed only when:
- Output type == input type
- Direction is strictly output → input

Example:
- number → number allowed
- string → number blocked

---

## Program Execution Flow

Execution always follows:


MAIN FUNCTION
↓
Connected Statements
↓
Function Calls (via nodes)
↓
Return flow


---

## Compilation Model

BlockLang compiles into TypeScript.

### Flow:


Visual Blocks
↓
AST Generation
↓
TypeScript Code
↓
Execution (via emulator)


---

## Example Compilation

### Visual:


number x = 5
number y = 10
number z = add(x, y)


### TypeScript Output:

```ts
let x: number = 5;
let y: number = 10;
let z: number = add(x, y);
Emulation System

The emulator:

Starts from MAIN FUNCTION
Executes node connections step-by-step
Highlights active block
Shows variable state in real-time
Displays function call stack visually
Error System

Errors are shown at block level.

Examples:
Type mismatch (number vs string)
Invalid node connection
Missing return type
Incorrect function signature
UI Behavior:
Block turns red
Connection is prevented
Tooltip explains issue clearly
Learning Stages
Stage 1 — Basics
number, string, boolean
variables
main function execution
Stage 2 — Expressions
arithmetic operations
comparisons
Stage 3 — Control Flow
if/else
loops
Stage 4 — Functions
definition
node-based calling
Technical Architecture
Frontend (React)
Node-based block editor
Drag + snap puzzle system
Type validation engine
Live TypeScript preview
Execution visualizer
Backend (NestJS)
Project storage
Block → AST conversion
TypeScript code generation
Execution engine (emulator support)
Future Extensions (Out of MVP Scope)
Classes / OOP
AI-assisted block generation
Multiplayer collaboration
Advanced debugging tools
Core Vision

BlockLang teaches real programming fundamentals using a visual system that mirrors TypeScript exactly.

Learners understand:

real types (number, string, boolean)
real functions and parameters
real execution flow starting from MAIN
real code structure via visual blocks

before ever writing text-based TypeScript.

The goal is not abstraction — it is visual understanding of real code.