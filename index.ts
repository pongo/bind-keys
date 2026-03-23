/**
 * Returns an array of strings representing digits from "0" to "9".
 * Useful for binding numeric keys.
 *
 * @returns {string[]} An array containing ["0", "1", ..., "9"].
 */
export function digits(): string[] {
  return Array.from({ length: 10 }, (_, i) => i.toString());
}

/**
 * Prepends a modifier key to each key in the provided array.
 *
 * @param modifier - The modifier key to add (e.g., "ctrl", "alt", "shift").
 * @param keys - An array of keys to be modified.
 * @returns {string[]} A new array with keys prefixed by the modifier.
 *
 * @example
 * withModifier("alt", ["1", "2"]) // returns ["alt+1", "alt+2"]
 */
export function withModifier(modifier: string, keys: string[]): string[] {
  return keys.map((key) => `${modifier}+${key}`);
}

/**
 * Options for key binding behavior.
 */
export interface BindOptions {
  /**
   * If true, the handler will not trigger if the event target is a text input,
   * textarea, or contentEditable element (unless it's read-only).
   */
  filterInput?: boolean;
  /**
   * If true, calls `preventDefault()` and `stopPropagation()` on the event.
   */
  prevent?: boolean;
}

/**
 * Function signature for key event handlers.
 */
export type Handler = (event: KeyboardEvent) => void;

interface ParsedBinding {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
  handler: Handler;
  options: BindOptions;
}

const NON_TEXT_INPUT_TYPES = new Set([
  "checkbox",
  "radio",
  "range",
  "button",
  "file",
  "reset",
  "submit",
  "color",
]);

function defaultFilter(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (target.isContentEditable) {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    return target.readOnly || NON_TEXT_INPUT_TYPES.has(target.type);
  }

  if (target instanceof HTMLTextAreaElement) {
    return target.readOnly;
  }

  if (target instanceof HTMLSelectElement) {
    return false;
  }

  return true;
}

const keyAliases: Record<string, string> = {
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  space: " ",
  enter: "enter",
  home: "home",
  end: "end",
  pageup: "pageup",
  pagedown: "pagedown",
  pgup: "pageup",
  pgdown: "pagedown",
  delete: "delete",
  backspace: "backspace",
  esc: "escape",
  escape: "escape",
  tab: "tab",
};

/**
 * Creates a new instance of KeysHandlerBuilder.
 * This is the primary entry point for the library.
 *
 * @returns A new builder instance.
 *
 * @example
 * const handler = keysHandlerFactory()
 *   .add("ctrl+s", (e) => save())
 *   .build();
 */
export function keysHandlerFactory(): KeysHandlerBuilder {
  return new KeysHandlerBuilder();
}

/**
 * Builder class for creating keyboard event handlers with multiple bindings.
 */
export class KeysHandlerBuilder {
  #bindings: ParsedBinding[] = [];

  /**
   * Adds a new key binding to the builder.
   *
   * @param keys - A single key combo string or an array of key combo strings.
   *               Combos use "+" to separate modifiers (e.g., "ctrl+shift+a").
   * @param handler - The function to execute when the keys are pressed.
   * @param options - Optional configuration for this specific binding.
   * @returns The builder instance for chaining.
   */
  add(
    keys: string | string[],
    handler: Handler,
    options: BindOptions = {},
  ): this {
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const k of keyArray) {
      if (!k) continue;
      this.#bindings.push(...this.#parseKey(k, handler, options));
    }
    return this;
  }

  #parseKey(
    combo: string,
    handler: Handler,
    options: BindOptions,
  ): ParsedBinding[] {
    const parts = combo.split("+").map((p) => p.trim().toLowerCase());

    let ctrl = false;
    let shift = false;
    let alt = false;
    let meta = false;
    let mainKey = "";

    for (const part of parts) {
      if (part === "ctrl") ctrl = true;
      else if (part === "shift") shift = true;
      else if (part === "alt") alt = true;
      else if (part === "meta" || part === "cmd" || part === "win") meta = true;
      else mainKey = part;
    }

    if (keyAliases[mainKey]) {
      mainKey = keyAliases[mainKey];
    }

    return [{ ctrl, shift, alt, meta, key: mainKey, handler, options }];
  }

  /**
   * Compiled the added bindings into a single event handler function.
   *
   * @returns A function that should be attached to a "keydown" event listener.
   */
  build(): (event: KeyboardEvent) => void {
    const bindings = this.#bindings;

    return (event: KeyboardEvent) => {
      const keyLower = event.key.toLowerCase();

      for (const binding of bindings) {
        if (
          binding.ctrl === event.ctrlKey &&
          binding.shift === event.shiftKey &&
          binding.alt === event.altKey &&
          binding.meta === event.metaKey &&
          binding.key === keyLower
        ) {
          if (binding.options.filterInput && !defaultFilter(event)) {
            continue;
          }

          if (binding.options.prevent) {
            event.preventDefault();
            event.stopPropagation();
          }

          binding.handler(event);
        }
      }
    };
  }
}
