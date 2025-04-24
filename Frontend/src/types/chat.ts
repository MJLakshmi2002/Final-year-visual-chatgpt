export type MessageRole = "user" | "assistant";

export interface DetailedImageAnalysis {
  basic_caption: string;
  detailed_caption: string;
  objects: string[];
  scene_description: string;
  attributes: string[];
}

export interface ImageInfo {
  url: string;
  caption?: string;
  detailed_analysis?: DetailedImageAnalysis;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  image?: ImageInfo;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type ChatMode = "chat" | "generate" | "analyze";
