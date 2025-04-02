
import React, { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md text-sm font-semibold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-r from-ai-purple to-ai-blue text-white"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 space-y-2">
        <div className="prose dark:prose-invert">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={line.trim() === "" ? "h-4" : "mb-2"}>
              {line}
            </p>
          ))}
        </div>
        {message.image && (
          <div className="mt-3">
            <img
              src={message.image.url}
              alt={message.image.caption || "Image"}
              className="rounded-md max-w-full max-h-[400px] object-contain border"
            />
            {message.image.caption && (
              <p className="text-sm text-muted-foreground mt-1">
                {message.image.caption}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatMessages: React.FC = () => {
  const { messages, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-gradient-to-r from-ai-purple to-ai-blue text-white p-6 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Visual ChatGPT</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            I can generate images from text, analyze uploaded images, and answer questions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/50 p-3 rounded-md">
              "Create a futuristic cityscape at sunset"
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              "Generate an image of a cosmic jellyfish"
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              "What can you tell me about this image?" (with upload)
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              "Make a painting of mountains in the style of Van Gogh"
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex gap-3 p-4 bg-background">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-gradient-to-r from-ai-purple to-ai-blue text-white text-sm font-semibold">
                AI
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
