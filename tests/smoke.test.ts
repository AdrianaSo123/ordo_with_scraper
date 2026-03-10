import { describe, it, expect } from "vitest";

describe("Smoke Test", () => {
    it("should verify that the test environment is working", () => {
        expect(1 + 1).toBe(2);
    });

    it("should verify that jsdom is available", () => {
        const element = document.createElement("div");
        expect(element).toBeDefined();
    });
});
