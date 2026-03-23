import { describe, it, expect, vi } from "vitest";
import { keysHandlerFactory, digits, withModifier } from "./index";

describe("bind-keys", () => {
  it("binds a single key", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory()
      .add("a", handler)
      .build();

    const event = new KeyboardEvent("keydown", { key: "a" });
    bound(event);
    expect(handler).toHaveBeenCalledTimes(1);
    
    const event2 = new KeyboardEvent("keydown", { key: "b" });
    bound(event2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles modifiers", () => {
    const handler = vi.fn();
    const bound = keysHandlerFactory()
      .add("ctrl+shift+z", handler)
      .build();

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
    const bound = keysHandlerFactory()
      .add("x", handler, { prevent: true })
      .build();

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
    const bound = keysHandlerFactory()
      .add("y", handler, { filterInput: true })
      .build();

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
  });

  it("digits() returns 0-9", () => {
    expect(digits()).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("withModifier() combines modifier and keys", () => {
    expect(withModifier("alt", ["a", "b"])).toEqual(["alt+a", "alt+b"]);
    expect(withModifier("ctrl+shift", digits().slice(0, 3))).toEqual(["ctrl+shift+0", "ctrl+shift+1", "ctrl+shift+2"]);
  });
});

