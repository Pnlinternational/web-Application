import { cleanup } from "@testing-library/react";
import { afterEach } from "vite-plus/test";

afterEach(() => {
  cleanup();
});

// jsdom has no pointer capture; sonner calls it when a toast (e.g. its Undo button) is pressed.
if (typeof Element !== "undefined" && typeof Element.prototype.setPointerCapture !== "function") {
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.hasPointerCapture = () => false;
}
