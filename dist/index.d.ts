/**
 * Returns an array of strings representing digits from "0" to "9".
 * Useful for binding numeric keys.
 *
 * @returns An array containing ["0", "1", ..., "9"].
 */
declare function digits(): BaseKey[];
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
declare function withModifier<M extends CombinedModifier, K extends BaseKey>(modifier: M, keys: K[]): `${M}+${K}`[];
/**
 * Options for key binding behavior.
 */
interface BindOptions {
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
type Handler = (event: KeyboardEvent) => void;
declare const CODE_TO_KEY_ENTRIES: readonly [readonly ["up", "arrowup"], readonly ["down", "arrowdown"], readonly ["left", "arrowleft"], readonly ["right", "arrowright"], readonly ["space", " "], readonly ["enter", "enter"], readonly ["home", "home"], readonly ["end", "end"], readonly ["pageup", "pageup"], readonly ["pagedown", "pagedown"], readonly ["pgup", "pageup"], readonly ["pgdown", "pagedown"], readonly ["delete", "delete"], readonly ["backspace", "backspace"], readonly ["esc", "escape"], readonly ["escape", "escape"], readonly ["tab", "tab"]];
declare const KEY_ALIASES_ENTRIES: readonly [readonly ["KeyA", "a"], readonly ["KeyB", "b"], readonly ["KeyC", "c"], readonly ["KeyD", "d"], readonly ["KeyE", "e"], readonly ["KeyF", "f"], readonly ["KeyG", "g"], readonly ["KeyH", "h"], readonly ["KeyI", "i"], readonly ["KeyJ", "j"], readonly ["KeyK", "k"], readonly ["KeyL", "l"], readonly ["KeyM", "m"], readonly ["KeyN", "n"], readonly ["KeyO", "o"], readonly ["KeyP", "p"], readonly ["KeyQ", "q"], readonly ["KeyR", "r"], readonly ["KeyS", "s"], readonly ["KeyT", "t"], readonly ["KeyU", "u"], readonly ["KeyV", "v"], readonly ["KeyW", "w"], readonly ["KeyX", "x"], readonly ["KeyY", "y"], readonly ["KeyZ", "z"], readonly ["Digit0", "0"], readonly ["Digit1", "1"], readonly ["Digit2", "2"], readonly ["Digit3", "3"], readonly ["Digit4", "4"], readonly ["Digit5", "5"], readonly ["Digit6", "6"], readonly ["Digit7", "7"], readonly ["Digit8", "8"], readonly ["Digit9", "9"], readonly ["Minus", "-"], readonly ["Equal", "="], readonly ["BracketLeft", "["], readonly ["BracketRight", "]"], readonly ["Backslash", "\\"], readonly ["Semicolon", ";"], readonly ["Quote", "'"], readonly ["Comma", ","], readonly ["Period", "."], readonly ["Slash", "/"], readonly ["Backquote", "`"], readonly ["Numpad0", "0"], readonly ["Numpad1", "1"], readonly ["Numpad2", "2"], readonly ["Numpad3", "3"], readonly ["Numpad4", "4"], readonly ["Numpad5", "5"], readonly ["Numpad6", "6"], readonly ["Numpad7", "7"], readonly ["Numpad8", "8"], readonly ["Numpad9", "9"], readonly ["NumpadAdd", "+"], readonly ["NumpadSubtract", "-"], readonly ["NumpadMultiply", "*"], readonly ["NumpadDivide", "/"], readonly ["NumpadDecimal", "."], readonly ["NumpadEnter", "enter"], readonly ["Space", " "], readonly ["Enter", "enter"], readonly ["Tab", "tab"], readonly ["Backspace", "backspace"], readonly ["Delete", "delete"], readonly ["Insert", "insert"], readonly ["Home", "home"], readonly ["End", "end"], readonly ["PageUp", "pageup"], readonly ["PageDown", "pagedown"], readonly ["ArrowUp", "arrowup"], readonly ["ArrowDown", "arrowdown"], readonly ["ArrowLeft", "arrowleft"], readonly ["ArrowRight", "arrowright"], readonly ["Escape", "escape"], readonly ["CapsLock", "capslock"], readonly ["F1", "f1"], readonly ["F2", "f2"], readonly ["F3", "f3"], readonly ["F4", "f4"], readonly ["F5", "f5"], readonly ["F6", "f6"], readonly ["F7", "f7"], readonly ["F8", "f8"], readonly ["F9", "f9"], readonly ["F10", "f10"], readonly ["F11", "f11"], readonly ["F12", "f12"]];
type CodeKeyValue = (typeof CODE_TO_KEY_ENTRIES)[number][0];
type AliasKeyName = (typeof KEY_ALIASES_ENTRIES)[number][1];
type BaseKey = CodeKeyValue | AliasKeyName;
type Modifier = "ctrl" | "shift" | "alt" | "meta" | "cmd" | "win";
type KeyCombo = BaseKey | `${Modifier}+${BaseKey}` | `${Modifier}+${Modifier}+${BaseKey}` | `${Modifier}+${Modifier}+${Modifier}+${BaseKey}`;
type CombinedModifier = Modifier | `${Modifier}+${Modifier}` | `${Modifier}+${Modifier}+${Modifier}`;
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
declare function getLayoutIndependentKey(event: KeyboardEvent): string | undefined;
/**
 * Creates a new instance of KeysHandlerBuilder.
 * This is the primary entry point for the library.
 *
 * @param defaultOptions - Default configuration applied to every binding.
 * Individual binding options override these values.
 * @returns A new builder instance.
 *
 * @example
 * const handler = keysHandlerBuilder()
 *   .add("ctrl+s", (e) => save())
 *   .build();
 */
declare function keysHandlerBuilder(defaultOptions?: BindOptions): KeysHandlerBuilder;
/**
 * Builder class for creating keyboard event handlers with multiple bindings.
 */
declare class KeysHandlerBuilder {
    #private;
    constructor(defaultOptions?: BindOptions);
    /**
     * Adds a new key binding to the builder.
     *
     * @param keys - A single key combo string or an array of key combo strings.
     * Combos use "+" to separate modifiers (e.g., "ctrl+shift+a").
     * @param handler - The function to execute when the keys are pressed.
     * @param options - Optional configuration for this specific binding.
     * @returns The builder instance for chaining.
     */
    add(keys: KeyCombo | readonly KeyCombo[], handler: Handler, options?: BindOptions): this;
    /**
     * Compiles the added bindings into a single event handler function.
     *
     * @returns A function that should be attached to a "keydown" event listener.
     */
    build(): (event: KeyboardEvent) => void;
}

export { type BaseKey, type BindOptions, type CombinedModifier, type Handler, type KeyCombo, KeysHandlerBuilder, type Modifier, digits, getLayoutIndependentKey, keysHandlerBuilder, withModifier };
