import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import {
  keysHandlerFactory,
  digits,
  withModifier,
  getLayoutIndependentKey,
  type KeyCombo,
  type BaseKey,
} from "./index";

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const ALL_DIGITS = "0123456789".split("");
const F_KEYS = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);

const KEY_CODES = ALL_LETTERS.map((c) => `Key${c.toUpperCase()}`);
const DIGIT_CODES = ALL_DIGITS.map((d) => `Digit${d}`);

const RUSSIAN_LAYOUT: Record<string, string> = {
  KeyQ: "й",
  KeyW: "ц",
  KeyE: "у",
  KeyR: "к",
  KeyT: "е",
  KeyY: "н",
  KeyU: "г",
  KeyI: "ш",
  KeyO: "щ",
  KeyP: "з",
  BracketLeft: "х",
  BracketRight: "ъ",
  KeyA: "ф",
  KeyS: "ы",
  KeyD: "в",
  KeyF: "а",
  KeyG: "п",
  KeyH: "р",
  KeyJ: "о",
  KeyK: "л",
  KeyL: "д",
  Semicolon: "ж",
  Quote: "э",
  KeyZ: "я",
  KeyX: "ч",
  KeyC: "с",
  KeyV: "м",
  KeyB: "и",
  KeyN: "т",
  KeyM: "ь",
  Comma: "б",
  Period: "ю",
  Slash: ".",
  Backquote: "ё",
};
const RUSSIAN_ENTRIES = Object.entries(RUSSIAN_LAYOUT);

type ModifierCombo = {
  combo: string;
  eventInit: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  };
};

const MODIFIER_COMBOS: ModifierCombo[] = [
  { combo: "ctrl", eventInit: { ctrlKey: true } },
  { combo: "alt", eventInit: { altKey: true } },
  { combo: "shift", eventInit: { shiftKey: true } },
  { combo: "meta", eventInit: { metaKey: true } },
  { combo: "ctrl+shift", eventInit: { ctrlKey: true, shiftKey: true } },
  { combo: "ctrl+alt", eventInit: { ctrlKey: true, altKey: true } },
  { combo: "alt+shift", eventInit: { altKey: true, shiftKey: true } },
];
const MODIFIERS = ["ctrl", "alt", "shift", "meta"] as const;

describe("keysHandlerFactory - binding and handling", () => {
  it("binds every latin letter key (a–z) correctly", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEY_CODES), (code) => {
        const key = code.replace("Key", "").toLowerCase();
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler)
          .build();

        bound(new KeyboardEvent("keydown", { key, code }));
        expect(handler).toHaveBeenCalledTimes(1);
      }),
    );
  });

  it("binds every digit key (0–9) correctly", () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIGIT_CODES), (code) => {
        const key = code.replace("Digit", "");
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler)
          .build();

        bound(new KeyboardEvent("keydown", { key, code }));
        expect(handler).toHaveBeenCalledTimes(1);
      }),
    );
  });

  it("every function key (F1-F12) fires its handler", () => {
    fc.assert(
      fc.property(fc.constantFrom(...F_KEYS), (fKey) => {
        const domKey = fKey.toUpperCase();
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(fKey as KeyCombo, handler)
          .build();

        bound(new KeyboardEvent("keydown", { key: domKey, code: domKey }));
        expect(handler).toHaveBeenCalledTimes(1);
      }),
    );
  });

  it("does not trigger handler when an unrelated key is pressed", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEY_CODES),
        fc.constantFrom(...KEY_CODES),
        (boundCode, pressedCode) => {
          fc.pre(boundCode !== pressedCode);
          const boundKey = boundCode.replace("Key", "").toLowerCase();
          const pressedKey = pressedCode.replace("Key", "").toLowerCase();

          const handler = vi.fn();
          const bound = keysHandlerFactory()
            .add(boundKey as KeyCombo, handler)
            .build();

          bound(
            new KeyboardEvent("keydown", {
              key: pressedKey,
              code: pressedCode,
            }),
          );
          expect(handler).not.toHaveBeenCalled();
        },
      ),
    );
  });

  it("calls all N handlers registered for the same key exactly once", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 8 }), fc.constantFrom(...KEY_CODES), (n, code) => {
        const key = code.replace("Key", "").toLowerCase();
        const handlers = Array.from({ length: n }, () => vi.fn());
        let factory = keysHandlerFactory();
        handlers.forEach((h) => {
          factory = factory.add(key as KeyCombo, h);
        });
        const bound = factory.build();

        bound(new KeyboardEvent("keydown", { key, code }));
        handlers.forEach((h) => expect(h).toHaveBeenCalledTimes(1));
      }),
    );
  });

  it("handler receives the original KeyboardEvent as an argument", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_LETTERS), (key) => {
        let received: KeyboardEvent | null = null;
        const handler = vi.fn((e: KeyboardEvent) => {
          received = e;
        });
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler)
          .build();

        const event = new KeyboardEvent("keydown", { key });
        bound(event);

        expect(received).toBe(event);
      }),
    );
  });
});

describe("keysHandlerFactory - modifiers", () => {
  it("triggers handler for every valid modifier+key combination", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_LETTERS),
        fc.constantFrom(...MODIFIER_COMBOS),
        (key, { combo, eventInit }) => {
          const handler = vi.fn();
          const bound = keysHandlerFactory()
            .add(`${combo}+${key}` as KeyCombo, handler)
            .build();

          bound(new KeyboardEvent("keydown", { key, ...eventInit }));
          expect(handler).toHaveBeenCalledTimes(1);
        },
      ),
    );
  });

  it("does not trigger modifier binding when pressed without modifier", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_LETTERS),
        fc.constantFrom(...MODIFIER_COMBOS),
        (key, { combo }) => {
          const handler = vi.fn();
          const bound = keysHandlerFactory()
            .add(`${combo}+${key}` as KeyCombo, handler)
            .build();

          bound(new KeyboardEvent("keydown", { key }));
          expect(handler).not.toHaveBeenCalled();
        },
      ),
    );
  });

  it("does not trigger ctrl binding when only alt/shift/meta is pressed", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_LETTERS), (key) => {
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(`ctrl+${key}` as KeyCombo, handler)
          .build();

        bound(new KeyboardEvent("keydown", { key, altKey: true }));
        expect(handler).not.toHaveBeenCalled();

        bound(new KeyboardEvent("keydown", { key, shiftKey: true }));
        expect(handler).not.toHaveBeenCalled();

        bound(new KeyboardEvent("keydown", { key, metaKey: true }));
        expect(handler).not.toHaveBeenCalled();
      }),
    );
  });
});

describe("keysHandlerFactory - options (prevent, filterInput)", () => {
  it("preventDefault and stopPropagation are called for any key with prevent:true", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEY_CODES), (code) => {
        const key = code.replace("Key", "").toLowerCase();
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler, { prevent: true })
          .build();

        const event = new KeyboardEvent("keydown", { key, code });
        const pd = vi.spyOn(event, "preventDefault");
        const sp = vi.spyOn(event, "stopPropagation");

        bound(event);

        expect(pd).toHaveBeenCalledTimes(1);
        expect(sp).toHaveBeenCalledTimes(1);
      }),
    );
  });

  it("without prevent option, preventDefault and stopPropagation are never called", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_LETTERS), (key) => {
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler)
          .build();

        const event = new KeyboardEvent("keydown", { key });
        const preventSpy = vi.spyOn(event, "preventDefault");
        const stopSpy = vi.spyOn(event, "stopPropagation");

        bound(event);
        expect(preventSpy).not.toHaveBeenCalled();
        expect(stopSpy).not.toHaveBeenCalled();
      }),
    );
  });

  it("filterInput suppresses handler for any key event from a text input", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_LETTERS), (key) => {
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler, { filterInput: true })
          .build();

        const input = document.createElement("input");
        input.type = "text";
        const event = new KeyboardEvent("keydown", { key });
        Object.defineProperty(event, "target", {
          value: input,
          enumerable: true,
        });

        bound(event);
        expect(handler).not.toHaveBeenCalled();
      }),
    );
  });

  it("filterInput allows handler for any key from a readonly textarea", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_LETTERS), (key) => {
        const handler = vi.fn();
        const bound = keysHandlerFactory()
          .add(key as KeyCombo, handler, { filterInput: true })
          .build();

        const textarea = document.createElement("textarea");
        textarea.readOnly = true;
        const event = new KeyboardEvent("keydown", { key });
        Object.defineProperty(event, "target", {
          value: textarea,
          enumerable: true,
        });

        bound(event);
        expect(handler).toHaveBeenCalledTimes(1);
      }),
    );
  });
});

describe("Russian layout handling", () => {
  it("every Russian key triggers handler bound to its physical English key", () => {
    for (const [code, russianChar] of RUSSIAN_ENTRIES) {
      const englishKey = getLayoutIndependentKey(new KeyboardEvent("keydown", { code }));
      if (!englishKey) continue;

      const handler = vi.fn();
      const bound = keysHandlerFactory()
        .add(englishKey as KeyCombo, handler)
        .build();

      bound(new KeyboardEvent("keydown", { key: russianChar, code }));
      expect(handler, `code=${code} (${russianChar} → ${englishKey})`).toHaveBeenCalledTimes(1);
    }
  });

  it("Russian key does NOT fire handler bound to a different physical English key", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RUSSIAN_ENTRIES),
        fc.constantFrom(...RUSSIAN_ENTRIES),
        ([code1, russianChar], [code2]) => {
          fc.pre(code1 !== code2);
          const englishKey2 = getLayoutIndependentKey(
            new KeyboardEvent("keydown", { code: code2 }),
          );
          fc.pre(englishKey2 !== undefined);

          const handler = vi.fn();
          const bound = keysHandlerFactory()
            .add(englishKey2! as KeyCombo, handler)
            .build();

          bound(new KeyboardEvent("keydown", { key: russianChar, code: code1 }));
          expect(handler).not.toHaveBeenCalled();
        },
      ),
    );
  });
});

describe("Helper Functions", () => {
  describe("withModifier", () => {
    it("every generated combo has format 'modifier+key' and length equals input array", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MODIFIERS, "ctrl+shift", "ctrl+alt"),
          fc.array(fc.constantFrom(...ALL_LETTERS), {
            minLength: 1,
            maxLength: 15,
          }),
          (modifier, keys) => {
            const result = withModifier(modifier, keys as BaseKey[]);
            expect(result).toHaveLength(keys.length);

            for (let i = 0; i < result.length; i++) {
              expect(result[i]).toBe(`${modifier}+${keys[i]}`);
            }
          },
        ),
      );
    });
  });

  describe("digits", () => {
    it("contains exactly the strings '0'–'9' in ascending order", () => {
      const d = digits();
      expect(d).toHaveLength(10);
      expect(new Set(d).size).toBe(10);
      d.forEach((digit, i) => {
        expect(digit).toBe(String(i));
      });
    });

    it("withModifier combined with digits() yields 10 properly formatted strings", () => {
      fc.assert(
        fc.property(fc.constantFrom(...MODIFIERS, "ctrl+shift"), (modifier) => {
          const result = withModifier(modifier, digits());
          expect(result).toHaveLength(10);
          result.forEach((item, i) => {
            expect(item).toBe(`${modifier}+${i}`);
          });
        }),
      );
    });
  });

  describe("getLayoutIndependentKey", () => {
    it("always returns lowercase single char for Key* codes", () => {
      fc.assert(
        fc.property(fc.constantFrom(...KEY_CODES), (code) => {
          const result = getLayoutIndependentKey(new KeyboardEvent("keydown", { code }));
          expect(result).toBeDefined();
          expect(result).toHaveLength(1);
          expect(result).toBe(result!.toLowerCase());
        }),
      );
    });

    it("returns correct digit for every Digit0–Digit9 code", () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_DIGITS), (digit) => {
          const code = `Digit${digit}`;
          const result = getLayoutIndependentKey(new KeyboardEvent("keydown", { code }));
          expect(result).toBe(digit);
        }),
      );
    });

    it("calling twice with same code returns same value (pure/deterministic)", () => {
      fc.assert(
        fc.property(fc.constantFrom(...KEY_CODES), (code) => {
          const a = getLayoutIndependentKey(new KeyboardEvent("keydown", { code }));
          const b = getLayoutIndependentKey(new KeyboardEvent("keydown", { code }));
          expect(a).toBe(b);
        }),
      );
    });
  });
});
