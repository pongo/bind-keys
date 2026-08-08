# bind-keys

A simple keyboard shortcut binding library. Zero dependencies.

## Installation

```bash
npm install pongo/bind-keys
```

## Usage

```typescript
import { keysHandlerBuilder } from "bind-keys";

const handler = keysHandlerBuilder()
  .add(
    "ctrl+s",
    (e) => {
      console.log("Save triggered");
    },
    { prevent: true }, // calls event.preventDefault() and event.stopPropagation()
  )
  .add(["enter", "space"], (e) => {
    e.preventDefault();
    console.log("Confirmed");
  })
  .add("f", () => search(), { filterInput: true }) // ignores events from text inputs
  .build();

window.addEventListener("keydown", handler);
```

## API Reference

### `keysHandlerBuilder(defaultOptions?)`

Creates a new `KeysHandlerBuilder`. The optional `defaultOptions` object accepts
`filterInput` and `prevent` and applies them to every binding. Options passed to
`.add()` override individual defaults, including with an explicit `false`.

### `KeysHandlerBuilder`

- `.add(keys, handler, options)`: Adds a binding.
  - `keys`: A combo string like `"ctrl+shift+a"` or an array of such strings.
  - `handler`: `(event: KeyboardEvent) => void`.
  - `options`:
    - `filterInput`: Boolean. If true, ignores events from form inputs/editable elements.
    - `prevent`: Boolean. If true, calls `event.preventDefault()` and `event.stopPropagation()`.
- `.build()`: Returns the compiled `(event: KeyboardEvent) => void` function.

### Utilities

```typescript
digits(); // ["0", "1", ..., "9"]

withModifier("alt", digits()); // ["alt+0", "alt+1", ..., "alt+9"]

getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "KeyQ" })); // "q"
```
