import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockMessages = [
  {
    _id: "msg_1",
    role: "assistant",
    content: "Hello! I am your video assistant.",
    timestamp: Date.now() - 60000,
  },
  {
    _id: "msg_2",
    role: "user",
    content: "Create a hero scene",
    timestamp: Date.now() - 30000,
  },
  {
    _id: "msg_3",
    role: "assistant",
    content: "I created a hero scene for you.",
    timestamp: Date.now(),
  },
];

const mockSendMessage = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockMessages),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    chat: { getMessages: "chat:getMessages" },
  },
}));

vi.mock("@/hooks/useChat", () => ({
  useChat: vi.fn(() => ({
    sendMessage: mockSendMessage,
    isStreaming: false,
    thoughts: [] as string[],
    currentThought: null as string | null,
  })),
}));

import ChatSidebar from "@/components/editor/ChatSidebar";
import { useChat } from "@/hooks/useChat";

const defaultProps = {
  projectId: "proj_123",
  internalProjectId: "internal_123" as any,
};

function setupStreamingMock(overrides: Partial<ReturnType<typeof useChat>> = {}) {
  vi.mocked(useChat).mockReturnValue({
    sendMessage: mockSendMessage,
    isStreaming: false,
    thoughts: [],
    currentThought: null,
    ...overrides,
  });
}

describe("ChatSidebar", () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    setupStreamingMock();
  });

  it("renders the Video Assistant header", () => {
    render(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText("Video Assistant")).toBeInTheDocument();
  });

  it("renders the AI badge", () => {
    render(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders chat messages", () => {
    render(<ChatSidebar {...defaultProps} />);
    expect(
      screen.getByText("Hello! I am your video assistant.")
    ).toBeInTheDocument();
    expect(screen.getByText("Create a hero scene")).toBeInTheDocument();
    expect(
      screen.getByText("I created a hero scene for you.")
    ).toBeInTheDocument();
  });

  it("renders the message input textarea", () => {
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    expect(textarea).toBeInTheDocument();
  });

  it("renders the Send button", () => {
    render(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("renders the Media upload button", () => {
    render(<ChatSidebar {...defaultProps} />);
    const mediaButton = screen.getByTitle(/upload images/i);
    expect(mediaButton).toBeInTheDocument();
  });

  it("disables Send button when input is empty", () => {
    render(<ChatSidebar {...defaultProps} />);
    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeDisabled();
  });

  it("enables Send button when input has content", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    await user.type(textarea, "Hello agent");
    const sendButton = screen.getByText("Send");
    expect(sendButton).not.toBeDisabled();
  });

  it("calls sendMessage when Send is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    await user.type(textarea, "Create a video about my app");
    const sendButton = screen.getByText("Send");
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith(
      "Create a video about my app"
    );
  });

  it("clears input after sending a message", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    ) as HTMLTextAreaElement;
    await user.type(textarea, "Test message");
    await user.click(screen.getByText("Send"));

    expect(textarea.value).toBe("");
  });

  it("sends message on Enter key press", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    await user.type(textarea, "Enter message{Enter}");

    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("does not send on Shift+Enter (allows newline)", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    await user.type(textarea, "Line 1{Shift>}{Enter}{/Shift}Line 2");

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("shows 'Working...' indicator when streaming", () => {
    setupStreamingMock({
      isStreaming: true,
      currentThought: "Creating hero scene",
    });

    render(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText("Working...")).toBeInTheDocument();
  });

  it("displays current thought during streaming", () => {
    setupStreamingMock({
      isStreaming: true,
      thoughts: ["Analyzing product"],
      currentThought: "Creating hero scene",
    });

    render(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText("Creating hero scene")).toBeInTheDocument();
  });

  it("disables input during streaming", () => {
    setupStreamingMock({ isStreaming: true });

    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /waiting for response/i
    );
    expect(textarea).toBeDisabled();
  });

  it("does not send empty messages", async () => {
    const user = userEvent.setup();
    render(<ChatSidebar {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      /describe your product/i
    );
    await user.type(textarea, "   ");
    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeDisabled();
  });

  it("renders hidden file input for media upload", () => {
    render(<ChatSidebar {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass("hidden");
  });

  it("file input accepts image, video, and audio", () => {
    render(<ChatSidebar {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput?.accept).toBe("image/*,video/*,audio/*");
  });

  it("file input supports multiple files", () => {
    render(<ChatSidebar {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput?.multiple).toBe(true);
  });
});

describe("ChatSidebar message styling", () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    setupStreamingMock();
  });

  it("renders user messages aligned right", () => {
    render(<ChatSidebar {...defaultProps} />);
    const userMessage = screen.getByText("Create a hero scene");
    const container = userMessage.closest(".flex");
    expect(container?.className).toContain("justify-end");
  });

  it("renders assistant messages aligned left", () => {
    render(<ChatSidebar {...defaultProps} />);
    const assistantMessage = screen.getByText(
      "Hello! I am your video assistant."
    );
    const container = assistantMessage.closest(".flex");
    expect(container?.className).toContain("justify-start");
  });
});
