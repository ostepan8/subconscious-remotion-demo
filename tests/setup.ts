import "@testing-library/jest-dom/vitest";

// jsdom doesn't support scrollIntoView
Element.prototype.scrollIntoView = () => {};
