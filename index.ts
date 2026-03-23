/**
 * Returns an array of strings representing digits from "0" to "9".
 * Useful for binding numeric keys.
 *
 * @returns An array containing ["0", "1", ..., "9"].
 */
export function digits(): BaseKey[] {
  return Array.from({ length: 10 }, (_, i) => i.toString() as BaseKey);
}

/**
 * Prepends a modifier key to each key in the provided array.
 *
 * @param modifier - The modifier key to add (e.g., "ctrl", "alt", "shift").
 * @param keys - An array of keys to be modified.
 * @returns A new array with keys prefixed by the modifier.
 *
 * @example
 * withModifier("alt", ["1", "2"]) // returns ["alt+1", "alt+2"]
 */
export function withModifier<M extends CombinedModifier, K extends BaseKey>(
  modifier: M,
  keys: K[],
): `${M}+${K}`[] {
  return keys.map((key) => `${modifier}+${key}`) as `${M}+${K}`[];
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

const CODE_TO_KEY_ENTRIES = [
  ["up", "arrowup"],
  ["down", "arrowdown"],
  ["left", "arrowleft"],
  ["right", "arrowright"],
  ["space", " "],
  ["enter", "enter"],
  ["home", "home"],
  ["end", "end"],
  ["pageup", "pageup"],
  ["pagedown", "pagedown"],
  ["pgup", "pageup"],
  ["pgdown", "pagedown"],
  ["delete", "delete"],
  ["backspace", "backspace"],
  ["esc", "escape"],
  ["escape", "escape"],
  ["tab", "tab"],
] as const;

const KEY_ALIASES = new Map<string, string>(CODE_TO_KEY_ENTRIES);

const KEY_ALIASES_ENTRIES = [
  ["KeyA", "a"],
  ["KeyB", "b"],
  ["KeyC", "c"],
  ["KeyD", "d"],
  ["KeyE", "e"],
  ["KeyF", "f"],
  ["KeyG", "g"],
  ["KeyH", "h"],
  ["KeyI", "i"],
  ["KeyJ", "j"],
  ["KeyK", "k"],
  ["KeyL", "l"],
  ["KeyM", "m"],
  ["KeyN", "n"],
  ["KeyO", "o"],
  ["KeyP", "p"],
  ["KeyQ", "q"],
  ["KeyR", "r"],
  ["KeyS", "s"],
  ["KeyT", "t"],
  ["KeyU", "u"],
  ["KeyV", "v"],
  ["KeyW", "w"],
  ["KeyX", "x"],
  ["KeyY", "y"],
  ["KeyZ", "z"],
  // Top-row digits
  ["Digit0", "0"],
  ["Digit1", "1"],
  ["Digit2", "2"],
  ["Digit3", "3"],
  ["Digit4", "4"],
  ["Digit5", "5"],
  ["Digit6", "6"],
  ["Digit7", "7"],
  ["Digit8", "8"],
  ["Digit9", "9"],
  // Punctuation / symbols
  ["Minus", "-"],
  ["Equal", "="],
  ["BracketLeft", "["],
  ["BracketRight", "]"],
  ["Backslash", "\\"],
  ["Semicolon", ";"],
  ["Quote", "'"],
  ["Comma", ","],
  ["Period", "."],
  ["Slash", "/"],
  ["Backquote", "`"],
  // Numpad
  ["Numpad0", "0"],
  ["Numpad1", "1"],
  ["Numpad2", "2"],
  ["Numpad3", "3"],
  ["Numpad4", "4"],
  ["Numpad5", "5"],
  ["Numpad6", "6"],
  ["Numpad7", "7"],
  ["Numpad8", "8"],
  ["Numpad9", "9"],
  ["NumpadAdd", "+"],
  ["NumpadSubtract", "-"],
  ["NumpadMultiply", "*"],
  ["NumpadDivide", "/"],
  ["NumpadDecimal", "."],
  ["NumpadEnter", "enter"],
  // Special keys
  ["Space", " "],
  ["Enter", "enter"],
  ["Tab", "tab"],
  ["Backspace", "backspace"],
  ["Delete", "delete"],
  ["Insert", "insert"],
  ["Home", "home"],
  ["End", "end"],
  ["PageUp", "pageup"],
  ["PageDown", "pagedown"],
  ["ArrowUp", "arrowup"],
  ["ArrowDown", "arrowdown"],
  ["ArrowLeft", "arrowleft"],
  ["ArrowRight", "arrowright"],
  ["Escape", "escape"],
  ["CapsLock", "capslock"],
  // Function keys
  ["F1", "f1"],
  ["F2", "f2"],
  ["F3", "f3"],
  ["F4", "f4"],
  ["F5", "f5"],
  ["F6", "f6"],
  ["F7", "f7"],
  ["F8", "f8"],
  ["F9", "f9"],
  ["F10", "f10"],
  ["F11", "f11"],
  ["F12", "f12"],
] as const;

const CODE_TO_KEY = new Map<string, string>(KEY_ALIASES_ENTRIES);

type CodeKeyValue = (typeof CODE_TO_KEY_ENTRIES)[number][0];
type AliasKeyName = (typeof KEY_ALIASES_ENTRIES)[number][1];

export type BaseKey = CodeKeyValue | AliasKeyName;
export type Modifier = "ctrl" | "shift" | "alt" | "meta" | "cmd" | "win";

export type KeyCombo =
  | BaseKey
  | `${Modifier}+${BaseKey}`
  | `${Modifier}+${Modifier}+${BaseKey}`
  | `${Modifier}+${Modifier}+${Modifier}+${BaseKey}`;

export type CombinedModifier =
  | Modifier
  | `${Modifier}+${Modifier}`
  | `${Modifier}+${Modifier}+${Modifier}`;

/**
 * Returns the English key name associated with the physical key pressed,
 * based on the `event.code` property. This effectively ignores the current
 * keyboard layout of the operating system.
 *
 * @param event - The keyboard event to analyze.
 * @returns The lowercase English key name (e.g., "q", "1", "enter", "[")
 * or `undefined` if the key code is not recognized.
 *
 * @example
 * // If the user presses the 'й' key on a Russian layout (physical 'Q' key):
 * getLayoutIndependentKey(event) // returns "q"
 */
export function getLayoutIndependentKey(event: KeyboardEvent): string | undefined {
  return CODE_TO_KEY.get(event.code);
}

function filterInput(event: KeyboardEvent): boolean {
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
   * Combos use "+" to separate modifiers (e.g., "ctrl+shift+a").
   * @param handler - The function to execute when the keys are pressed.
   * @param options - Optional configuration for this specific binding.
   * @returns The builder instance for chaining.
   */
  add(keys: KeyCombo | readonly KeyCombo[], handler: Handler, options: BindOptions = {}): this {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const k of keyArray) {
      if (!k) continue;
      this.#bindings.push(...this.#parseKey(k, handler, options));
    }
    return this;
  }

  #parseKey(combo: string, handler: Handler, options: BindOptions): ParsedBinding[] {
    const parts = combo.split("+").map((p) => p.trim().toLowerCase());

    let ctrl = false,
      shift = false,
      alt = false,
      meta = false,
      mainKey = "";

    for (const part of parts) {
      if (part === "ctrl") ctrl = true;
      else if (part === "shift") shift = true;
      else if (part === "alt") alt = true;
      else if (part === "meta" || part === "cmd" || part === "win") meta = true;
      else mainKey = part;
    }

    const alias = KEY_ALIASES.get(mainKey);
    if (alias !== undefined) mainKey = alias;

    return [{ ctrl, shift, alt, meta, key: mainKey, handler, options }];
  }

  /**
   * Compiles the added bindings into a single event handler function.
   *
   * @returns A function that should be attached to a "keydown" event listener.
   */
  build(): (event: KeyboardEvent) => void {
    const bindings = this.#bindings;

    return (event: KeyboardEvent) => {
      const keyLower = event.key.toLowerCase();
      const layoutKey = CODE_TO_KEY.get(event.code);

      for (const binding of bindings) {
        const keyMatch = binding.key === keyLower;
        const codeMatch = layoutKey !== undefined && binding.key === layoutKey;

        if (
          binding.ctrl === event.ctrlKey &&
          binding.shift === event.shiftKey &&
          binding.alt === event.altKey &&
          binding.meta === event.metaKey &&
          (keyMatch || codeMatch)
        ) {
          if (binding.options.filterInput && !filterInput(event)) {
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
