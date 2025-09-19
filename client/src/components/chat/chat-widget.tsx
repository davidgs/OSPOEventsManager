import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  results?: any[];
  count?: number;
}

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResultsInApp, setShowResultsInApp] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 384, height: 500 }); // Default w-96 h-[500px]
  const [isResizing, setIsResizing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle window resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowSize.width;
    const startHeight = windowSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      // Resize from TOP-LEFT corner
      // Drag DOWN = positive deltaY = make window SMALLER
      // Drag UP = negative deltaY = make window LARGER
      // Drag RIGHT = positive deltaX = make window SMALLER
      // Drag LEFT = negative deltaX = make window LARGER
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // For TOP-LEFT resize: negative delta = larger window
      const newWidth = Math.max(300, Math.min(800, startWidth - deltaX));
      const newHeight = Math.max(300, Math.min(800, startHeight - deltaY));

      setWindowSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const addMessage = (
    type: ChatMessage["type"],
    content: string,
    results?: any[],
    count?: number
  ) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      results,
      count,
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message
    addMessage("user", userMessage);

    try {
      const response = await fetch("/api/ai/sql-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });

      const data = await response.json();

      if (response.ok) {
        // Add AI response with correct data structure
        const results = data.data?.results || [];
        const count = data.data?.count || 0;

        addMessage("ai", data.message, results, count);

        // Don't add duplicate system message since the AI message already includes the count
      } else {
        addMessage("ai", `Error: ${data.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";

      if (error instanceof Error) {
        if (
          error.name === "TimeoutError" ||
          error.message.includes("timeout")
        ) {
          errorMessage =
            "The request timed out. The AI is taking longer than expected. Please try again.";
        } else if (error.message.includes("504")) {
          errorMessage =
            "The server is taking too long to respond. Please try again in a moment.";
        } else if (error.message.includes("Unexpected token")) {
          errorMessage =
            "Received an invalid response from the server. Please try again.";
        }
      }

      addMessage("ai", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleShowInApp = () => {
    // Get the latest results from messages
    const latestResults =
      messages.filter((m) => m.results && m.results.length > 0).pop()
        ?.results || [];

    handleShowInMainApp(latestResults);
  };

  const handleShowInMainApp = (results: any[]) => {
    setShowResultsInApp(true);
    setIsOpen(false);

    // Store results in sessionStorage to pass to events page
    if (results && results.length > 0) {
      sessionStorage.setItem("chatSearchResults", JSON.stringify(results));
      sessionStorage.setItem("chatSearchTimestamp", Date.now().toString());
    }

    // Navigate to the events page to show results in main app
    setLocation("/events");

    // Clear the chat when showing results in main app
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "system"
            ? { ...msg, content: `${msg.count || 0} results` }
            : msg
        )
      );
      setShowResultsInApp(false);
    }, 1000);

    toast({
      title: "Results shown in Main App",
      description: `${results.length} search results are now displayed in the main application.`,
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatEventCard = (event: any) => (
    <div key={event.id} className="p-3 border rounded-lg bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{event.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {event.location}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {event.start_date
                ? new Date(event.start_date).toLocaleDateString()
                : "No date"}
            </Badge>
            <Badge
              variant={event.status === "confirmed" ? "default" : "secondary"}
              className="text-xs"
            >
              {event.status || "unknown"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {event.priority || "medium"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const exampleQueries = [
    "Show me all events",
    "Show me high priority events",
    "Find events in Asia",
    "How many events are there?",
  ];

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Widget */}
      {isOpen && (
        <Card
          className="shadow-lg border relative"
          style={{
            width: `${windowSize.width}px`,
            height: `${windowSize.height}px`,
            cursor: isResizing ? "nw-resize" : "default",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              {messages.some((m) => m.results && m.results.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowInApp}
                  className="text-xs"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Show in Main App
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col h-full p-0">
            {/* Status indicator */}
            {showResultsInApp && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  ✔ Results shown in Main App
                </span>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-2" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ask me about your events...</p>
                    <div className="mt-4 space-y-1">
                      {exampleQueries.map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setInputValue(query)}
                        >
                          Try: "{query}"
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    {message.type === "user" && (
                      <div className="flex items-start gap-2 justify-end">
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg max-w-[80%]">
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <User className="h-5 w-5 mt-1 text-muted-foreground" />
                      </div>
                    )}

                    {message.type === "ai" && (
                      <div className="flex items-start gap-2">
                        <Bot className="h-5 w-5 mt-1 text-muted-foreground" />
                        <div className="bg-muted px-3 py-2 rounded-lg max-w-[80%]">
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {message.type === "system" && (
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {message.content}
                        </Badge>
                      </div>
                    )}

                    {/* Display results */}
                    {message.results && message.results.length > 0 && (
                      <div className="space-y-2">
                        {message.results.slice(0, 5).map((result, index) => (
                          <div key={index}>
                            {result.name ? (
                              <div
                                className="p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                                onClick={() =>
                                  setLocation(`/events/${result.id}`)
                                }
                              >
                                <div className="font-medium text-sm">
                                  {result.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {result.location} •{" "}
                                  {result.start_date
                                    ? new Date(
                                        result.start_date
                                      ).toLocaleDateString()
                                    : "No date"}
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <StatusBadge
                                    status={result.status || "unknown"}
                                    className="text-xs"
                                    showIcon={false}
                                  />
                                  <PriorityBadge
                                    priority={result.priority || "medium"}
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 bg-muted rounded text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                        {message.results.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            ... and {message.results.length - 5} more results
                          </p>
                        )}

                        {/* Show in Main App button */}
                        {message.results && message.results.length > 0 && (
                          <div className="flex justify-center mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleShowInMainApp(message.results)
                              }
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Show in Main App
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your events..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Try: "Show me high priority events" or "How many events are
                there?"
              </div>
            </div>
          </CardContent>

          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-gray-400"></div>
          </div>
        </Card>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="rounded-full shadow-lg"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
