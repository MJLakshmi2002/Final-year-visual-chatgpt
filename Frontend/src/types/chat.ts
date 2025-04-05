
export type MessageRole = "user" | "assistant";

export interface ImageAttachment {
  url: string;
  file?: File;
  caption?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  image?: ImageAttachment;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
