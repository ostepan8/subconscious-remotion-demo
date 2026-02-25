"use client";

import { useState, useCallback } from "react";

interface UseChatOptions {
  projectId: string;
}

export function useChat({ projectId }: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [currentThought, setCurrentThought] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      setIsStreaming(true);
      setThoughts([]);
      setCurrentThought(null);

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsStreaming(false);
              setCurrentThought(null);
              return;
            }

            try {
              const event = JSON.parse(data);
              if (event.type === "thought") {
                setThoughts((prev) => [...prev, event.thought]);
                setCurrentThought(event.thought);
              } else if (event.type === "answer") {
                setCurrentThought(null);
              } else if (event.type === "error") {
                console.error("Stream error:", event.message);
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsStreaming(false);
        setCurrentThought(null);
      }
    },
    [projectId]
  );

  return { sendMessage, isStreaming, thoughts, currentThought };
}
