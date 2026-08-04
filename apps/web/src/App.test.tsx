import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";
import { getFixtureMutationLog, resetFixtureApi } from "./shared/api/fixture";

const alignmentPath = "/alignments/40000000-0000-0000-0000-000000000001";
const exactQuote = "Browser extensions are out of scope for the MVP.";

function renderApp(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetFixtureApi();
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

describe("React desktop product surface", () => {
  test("prioritizes direct conflicts before missing alignment on the dashboard", async () => {
    renderApp("/memory");

    expect(await screen.findByRole("heading", { name: "Project Memory" })).toBeVisible();
    const priorityList = screen.getByLabelText("Alignment priority");
    const items = within(priorityList).getAllByRole("link");

    expect(items[0]).toHaveTextContent("PR #7");
    expect(items[0]).toHaveTextContent("Direct Conflict");
    expect(items[1]).toHaveTextContent("Missing Alignment");
    expect(priorityList).not.toHaveTextContent("Aligned");
  });

  test("reveals exact evidence and the source URL from Alignment Diff", async () => {
    renderApp(alignmentPath);

    expect(await screen.findByRole("heading", { name: "Alignment Diff" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /open original source url/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reveal source evidence" }));

    const sourceLink = await screen.findByRole("link", { name: /open original source url/i });
    expect(sourceLink).toHaveAttribute("href", expect.stringContaining("github.com"));
    expect(sourceLink.closest("div")).toHaveTextContent(exactQuote);
  });

  test("updates the graph detail when a relevant node is selected", async () => {
    renderApp("/graph?focus=50000000-0000-0000-0000-000000000002");

    expect(await screen.findByRole("heading", { name: "Knowledge Graph" })).toBeVisible();
    const taskNode = await screen.findByText("Add extension synchronization");
    fireEvent.click(taskNode);

    expect(await screen.findByRole("heading", { name: "Add extension synchronization" })).toBeVisible();
    expect(screen.getByRole("link", { name: /open alignment diff/i })).toBeVisible();
  });

  test("shows original evidence inside Context Passport only after its toggle", async () => {
    renderApp(alignmentPath);

    const passport = await screen.findByRole("complementary", { name: "Context Passport" });
    expect(within(passport).queryByText(exactQuote)).not.toBeInTheDocument();

    const originalToggle = await within(passport).findByRole("checkbox", {
      name: "Show original evidence in Passport",
    });
    fireEvent.click(originalToggle);

    expect(await within(passport).findByText(exactQuote)).toBeVisible();
  });

  test("submits Handshake and Override through separate forms and requests", async () => {
    renderApp(alignmentPath);

    const handshakeButton = await screen.findByRole("button", { name: "Record Handshake" });
    const overrideButton = screen.getByRole("button", { name: "Submit Override" });
    expect(handshakeButton.closest("form")).not.toBe(overrideButton.closest("form"));

    fireEvent.click(handshakeButton);
    await waitFor(() => expect(getFixtureMutationLog()).toEqual(["handshake"]));
    expect(await screen.findByText(/handshake recorded as append-only evidence/i)).toBeVisible();

    fireEvent.change(screen.getByLabelText(/override reason/i), {
      target: { value: "The proposed change is documentation-only and does not add extension sync." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Override" }));

    await waitFor(() => expect(getFixtureMutationLog()).toEqual(["handshake", "override"]));
    expect(await screen.findByText(/override recorded without deleting prior evidence/i)).toBeVisible();
  });
});
