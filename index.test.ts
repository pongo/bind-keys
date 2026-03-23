import { describe, it, expect, vi } from "vitest";
import { keysHandlerFactory, digits, withModifier, getLayoutIndependentKey } from "./index";

describe("bind-keys", () => {
  it("binds a single key", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("a", handler).build();

    const event = new KeyboardEvent("keydown", { key: "a" });
    bound(event);
    expect(handler).toHaveBeenCalledTimes(1);

    const event2 = new KeyboardEvent("keydown", { key: "b" });
    bound(event2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles modifiers", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("ctrl+shift+z", handler).build();

    bound(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    bound(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles multiple keys as an array", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory()
      .add(["ctrl+c", "ctrl+v"], handler)
      .add(["space", "enter"], handler)
      .build();

    bound(new KeyboardEvent("keydown", { key: "c", ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    bound(new KeyboardEvent("keydown", { key: "v", ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(2);

    bound(new KeyboardEvent("keydown", { key: " " }));
    expect(handler).toHaveBeenCalledTimes(3);

    bound(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(handler).toHaveBeenCalledTimes(4);
  });

  it("applies prevent default and stop propagation", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("x", handler, { prevent: true }).build();

    const event = new KeyboardEvent("keydown", { key: "x" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

    bound(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
  });

  it("filters input elements effectively", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("y", handler, { filterInput: true }).build();

    // Text input
    const input = document.createElement("input");
    input.type = "text";

    // Simulate event from an input element
    const event1 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event1, "target", { value: input, enumerable: true });

    bound(event1);
    expect(handler).toHaveBeenCalledTimes(0);

    // ReadOnly input
    input.readOnly = true;
    bound(event1);
    expect(handler).toHaveBeenCalledTimes(1);

    // Check box (non-text input)
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const event2 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event2, "target", { value: checkbox, enumerable: true });
    bound(event2);
    expect(handler).toHaveBeenCalledTimes(2);

    // TextArea
    const textarea = document.createElement("textarea");
    const event3 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event3, "target", { value: textarea, enumerable: true });
    bound(event3);
    expect(handler).toHaveBeenCalledTimes(2);

    // ReadOnly TextArea
    textarea.readOnly = true;
    bound(event3);
    expect(handler).toHaveBeenCalledTimes(3);

    // Select
    const select = document.createElement("select");
    const event4 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event4, "target", { value: select, enumerable: true });
    bound(event4);
    expect(handler).toHaveBeenCalledTimes(3);

    // ContentEditable
    const div = document.createElement("div");
    Object.defineProperty(div, "isContentEditable", { value: true });
    const event5 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event5, "target", { value: div, enumerable: true });
    bound(event5);
    expect(handler).toHaveBeenCalledTimes(3);

    // Not an HTMLElement (e.g., document or window)
    const event6 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event6, "target", { value: document, enumerable: true });
    bound(event6);
    expect(handler).toHaveBeenCalledTimes(4);

    // Plain HTMLElement (e.g. div without contentEditable)
    const plainDiv = document.createElement("div");
    const event7 = new KeyboardEvent("keydown", { key: "y" });
    Object.defineProperty(event7, "target", { value: plainDiv, enumerable: true });
    bound(event7);
    expect(handler).toHaveBeenCalledTimes(5);
  });

  it("handles all modifiers including meta, cmd, win", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory()
      .add("meta+alt+k", handler)
      .add("cmd+k", handler) // both cmd and win map to meta
      .add("win+k", handler)
      .build();

    bound(new KeyboardEvent("keydown", { key: "k", metaKey: true, altKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    bound(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    // Triggers both cmd+k and win+k bindings
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("handles key aliases", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory()
      .add("up", handler)
      .add("esc", handler)
      .add("pgup", handler)
      .add("space", handler)
      .add("tab", handler)
      .add("backspace", handler)
      .add("delete", handler)
      .add("home", handler)
      .add("end", handler)
      .build();

    bound(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    bound(new KeyboardEvent("keydown", { key: "Escape" }));
    bound(new KeyboardEvent("keydown", { key: "PageUp" }));
    bound(new KeyboardEvent("keydown", { key: " " }));
    bound(new KeyboardEvent("keydown", { key: "Tab" }));
    bound(new KeyboardEvent("keydown", { key: "Backspace" }));
    bound(new KeyboardEvent("keydown", { key: "Delete" }));
    bound(new KeyboardEvent("keydown", { key: "Home" }));
    bound(new KeyboardEvent("keydown", { key: "End" }));

    expect(handler).toHaveBeenCalledTimes(9);
  });

  it("ignores empty keys in add()", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("", handler).add(["a", ""], handler).build();

    bound(new KeyboardEvent("keydown", { key: "a" }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls multiple handlers for the same key", () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const bound = keysHandlerFactory().add("s", h1).add("s", h2).build();

    bound(new KeyboardEvent("keydown", { key: "s" }));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("digits() returns 0-9", () => {
    expect(digits()).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("withModifier() combines modifier and keys", () => {
    expect(withModifier("alt", ["a", "b"])).toEqual(["alt+a", "alt+b"]);
    expect(withModifier("ctrl+shift", digits().slice(0, 3))).toEqual([
      "ctrl+shift+0",
      "ctrl+shift+1",
      "ctrl+shift+2",
    ]);
  });

  it("handles different keyboard layouts (e.g., Russian)", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("q", handler).build();

    // Russian 'й' is on the same physical key as 'q'
    const event = new KeyboardEvent("keydown", {
      key: "й",
      code: "KeyQ",
    });

    bound(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles punctuation in non-English layouts (e.g., Russian 'э' for Quote)", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory().add("'", handler).build();

    // Russian 'э' is on the same physical key as "'"
    const event = new KeyboardEvent("keydown", {
      key: "э",
      code: "Quote",
    });

    bound(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  describe("getLayoutIndependentKey", () => {
    it("returns English letters for various layouts", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "KeyQ" }))).toBe("q");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "KeyA" }))).toBe("a");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "KeyM" }))).toBe("m");
    });

    it("returns top-row digits", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Digit1" }))).toBe("1");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Digit0" }))).toBe("0");
    });

    it("returns numpad keys", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Numpad1" }))).toBe("1");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "NumpadAdd" }))).toBe("+");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "NumpadEnter" }))).toBe("enter");
    });

    it("returns punctuation and symbols", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "BracketLeft" }))).toBe("[");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Quote" }))).toBe("'");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Slash" }))).toBe("/");
    });

    it("returns special keys", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Space" }))).toBe(" ");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Enter" }))).toBe("enter");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "ArrowUp" }))).toBe("arrowup");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "Escape" }))).toBe("escape");
    });

    it("returns function keys", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "F1" }))).toBe("f1");
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "F12" }))).toBe("f12");
    });

    it("returns undefined for unknown codes", () => {
      expect(getLayoutIndependentKey(new KeyboardEvent("keydown", { code: "UnknownCode" }))).toBeUndefined();
    });
  });
});
