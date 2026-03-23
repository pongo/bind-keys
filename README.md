# bind-keys

A simple, lightweight keyboard shortcut binding library for the browser.

## Features

- **Fluent API**: Builder-based syntax for defining multiple shortcuts.
- **Modifiers**: Full support for `ctrl`, `shift`, `alt`, and `meta` (cmd/win).
- **Aliases**: Common key names like `enter`, `space`, `esc`, `up`, `down`, etc.
- **Input Filtering**: Automatically ignore shortcuts when typing in input fields.
- **Event Control**: Built-in support for `preventDefault()` and `stopPropagation()`.
- **Utilities**: Helper functions for common patterns like numeric keys.

## Installation

This is an internal library. Import it directly from its directory:

```typescript
import { keysHandlerFactory } from "@/lib/bind-keys";
```

## Usage

### Basic Example

```typescript
const handler = keysHandlerFactory()
  .add("ctrl+s", (e) => {
    console.log("Save triggered");
  }, { prevent: true })
  .add(["enter", "space"], () => {
    console.log("Confirmed");
  })
  .build();

window.addEventListener("keydown", handler);
```

### Input Filtering

Use `filterInput: true` to prevent the shortcut from triggering when the user is typing in a text field, textarea, or contentEditable element.

```typescript
const handler = keysHandlerFactory()
  .add("f", () => search(), { filterInput: true })
  .build();
```

### Bulk Bindings and Utilities

You can bind multiple keys at once using an array.

```typescript
import { keysHandlerFactory, digits, withModifier } from "@/lib/bind-keys";

const handler = keysHandlerFactory()
  .add(withModifier("alt", digits()), (e) => {
    const index = parseInt(e.key);
    navigateTo(index);
  })
  .build();
```

## API Reference

### `keysHandlerFactory()`
Creates a new `KeysHandlerBuilder`.

### `KeysHandlerBuilder`

- `.add(keys: string | string[], handler: Handler, options?: BindOptions)`: Adds a binding.
  - `keys`: A combo string like `"ctrl+shift+a"` or an array of such strings.
  - `handler`: `(event: KeyboardEvent) => void`.
  - `options`:
    - `filterInput`: Boolean. If true, ignores events from form inputs/editable elements.
    - `prevent`: Boolean. If true, calls `event.preventDefault()` and `event.stopPropagation()`.
- `.build()`: Returns the compiled `(event: KeyboardEvent) => void` function.

### Utilities

- `digits()`: Returns `["0", "1", ..., "9"]`.
- `withModifier(modifier: string, keys: string[])`: Prefixes all `keys` with the `modifier`.
