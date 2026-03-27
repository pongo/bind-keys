// index.ts
function digits() {
  return Array.from({ length: 10 }, (_, i) => i.toString());
}
function withModifier(modifier, keys) {
  return keys.map((key) => `${modifier}+${key}`);
}
var NON_TEXT_INPUT_TYPES = /* @__PURE__ */ new Set([
  "checkbox",
  "radio",
  "range",
  "button",
  "file",
  "reset",
  "submit",
  "color"
]);
var CODE_TO_KEY_ENTRIES = [
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
  ["tab", "tab"]
];
var KEY_ALIASES = new Map(CODE_TO_KEY_ENTRIES);
var KEY_ALIASES_ENTRIES = [
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
  ["F12", "f12"]
];
var CODE_TO_KEY = new Map(KEY_ALIASES_ENTRIES);
function getLayoutIndependentKey(event) {
  return CODE_TO_KEY.get(event.code);
}
function filterInput(event) {
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
function keysHandlerBuilder() {
  return new KeysHandlerBuilder();
}
var KeysHandlerBuilder = class {
  #bindings = [];
  /**
   * Adds a new key binding to the builder.
   *
   * @param keys - A single key combo string or an array of key combo strings.
   * Combos use "+" to separate modifiers (e.g., "ctrl+shift+a").
   * @param handler - The function to execute when the keys are pressed.
   * @param options - Optional configuration for this specific binding.
   * @returns The builder instance for chaining.
   */
  add(keys, handler, options = {}) {
    const keyArray = typeof keys === "string" ? [keys] : keys;
    for (const k of keyArray) {
      if (!k) continue;
      this.#bindings.push(...this.#parseKey(k, handler, options));
    }
    return this;
  }
  #parseKey(combo, handler, options) {
    const parts = combo.split("+").map((p) => p.trim().toLowerCase());
    let ctrl = false, shift = false, alt = false, meta = false, mainKey = "";
    for (const part of parts) {
      if (part === "ctrl") ctrl = true;
      else if (part === "shift") shift = true;
      else if (part === "alt") alt = true;
      else if (part === "meta" || part === "cmd" || part === "win") meta = true;
      else mainKey = part;
    }
    const alias = KEY_ALIASES.get(mainKey);
    if (alias !== void 0) mainKey = alias;
    return [{ ctrl, shift, alt, meta, key: mainKey, handler, options }];
  }
  /**
   * Compiles the added bindings into a single event handler function.
   *
   * @returns A function that should be attached to a "keydown" event listener.
   */
  build() {
    const bindings = this.#bindings;
    return (event) => {
      const keyLower = event.key.toLowerCase();
      const layoutKey = CODE_TO_KEY.get(event.code);
      for (const binding of bindings) {
        const keyMatch = binding.key === keyLower;
        const codeMatch = layoutKey !== void 0 && binding.key === layoutKey;
        if (binding.ctrl === event.ctrlKey && binding.shift === event.shiftKey && binding.alt === event.altKey && binding.meta === event.metaKey && (keyMatch || codeMatch)) {
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
};
export {
  KeysHandlerBuilder,
  digits,
  getLayoutIndependentKey,
  keysHandlerBuilder,
  withModifier
};
