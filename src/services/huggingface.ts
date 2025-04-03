import { toast } from "sonner";

// Define available models
export const AVAILABLE_MODELS = {
  TEXT_TO_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0",
  IMAGE_UNDERSTANDING: "Salesforce/blip-image-captioning-large",
  TEXT_UNDERSTANDING: "google/flan-t5-xl", // Upgraded from large to xl for better understanding
};

// Define types
export interface GeneratedImage {
  url: string;
}

export interface TextResponse {
  generated_text: string;
}

export interface ImageCaptionResponse {
  caption: string;
}

class HuggingFaceService {
  private apiKey: string;
  private baseUrl = "https://api-inference.huggingface.co/models";
  private conversationContext: string[] = [];
  private maxContextLength = 5;

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || "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";
  }

  // Generate image from text prompt
  async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      // Enhance the prompt to get better image generation results
      const enhancedPrompt = this.enhanceImagePrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_TO_IMAGE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ 
          inputs: enhancedPrompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 50,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image generation error:", error);
        throw new Error(error.error || "Failed to generate image");
      }

      // The response is a blob (image data)
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return { url };
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
      throw error;
    }
  }

  // Helper method to enhance image prompts
  private enhanceImagePrompt(prompt: string): string {
    // Add style details and quality indicators if they're not already present
    if (!prompt.toLowerCase().includes("high quality") && 
        !prompt.toLowerCase().includes("detailed") &&
        !prompt.toLowerCase().includes("4k") &&
        !prompt.toLowerCase().includes("hd")) {
      prompt += ", high quality, detailed, 4K";
    }
    
    return prompt;
  }

  // Generate text response using FLAN-T5 with NLP enhancements
  async generateTextResponse(prompt: string): Promise<string> {
    try {
      // Add to conversation context for maintaining continuous flow
      this.updateConversationContext(prompt);
      
      // Format prompt to get better conversational results with context
      const formattedPrompt = this.formatConversationalPrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_UNDERSTANDING}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ 
          inputs: formattedPrompt,
          parameters: {
            max_length: 500,
            temperature: 0.75, // More dynamic responses
            top_p: 0.92, // Diverse but relevant responses
            top_k: 50, // Consider more token options for better flow
            repetition_penalty: 1.2, // Avoid repetitive patterns
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Text generation error:", error);
        throw new Error(error.error || "Failed to generate text response");
      }

      const data = await response.json();
      let text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
      
      // Post-process the response for better conversation quality
      text = this.postProcessResponse(text, prompt);
      
      // Add the response to conversation context
      this.updateConversationContext(text, false);
      
      return text;
    } catch (error) {
      console.error("Error generating text response:", error);
      toast.error("Failed to generate text response. Please try again.");
      throw error;
    }
  }

  // Maintain conversation context for better flow
  private updateConversationContext(text: string, isUser: boolean = true) {
    this.conversationContext.push(`${isUser ? "User" : "Assistant"}: ${text}`);
    
    // Keep only the last N messages for context
    if (this.conversationContext.length > this.maxContextLength) {
      this.conversationContext = this.conversationContext.slice(-this.maxContextLength);
    }
  }

  // Helper method for formatting prompts with NLP techniques
  private formatConversationalPrompt(prompt: string): string {
    let formattedPrompt = prompt;
    
    // If we have context, include it in the prompt
    if (this.conversationContext.length > 0) {
      const context = this.conversationContext.join("\n");
      formattedPrompt = `Continue this conversation naturally and conversationally as a friendly AI assistant.\n\nConversation history:\n${context}\n\nNow respond to the last message in a natural, helpful, and conversational way.`;
    } else {
      // For standalone prompts
      formattedPrompt = `Respond as a friendly AI assistant in a natural conversational tone to: ${prompt}`;
    }
    
    // Apply NLP enhancements to detect language style
    if (this.detectInformalLanguage(prompt)) {
      formattedPrompt += " Keep your response casual and friendly.";
    }
    
    if (this.detectEmotionalContent(prompt)) {
      formattedPrompt += " Show empathy in your response.";
    }
    
    if (this.detectQuestionType(prompt) === "open_ended") {
      formattedPrompt += " Provide a thoughtful and detailed response.";
    } else if (this.detectQuestionType(prompt) === "factual") {
      formattedPrompt += " Provide a concise, factual answer.";
    }
    
    return formattedPrompt;
  }
  
  // NLP helper for detecting informal language
  private detectInformalLanguage(text: string): boolean {
    const informalMarkers = ['hey', 'hi', 'hello', 'lol', 'haha', 'cool', 'awesome', 'yeah', 'yep', 'nope'];
    return informalMarkers.some(marker => text.toLowerCase().includes(marker));
  }
  
  // NLP helper for detecting emotional content
  private detectEmotionalContent(text: string): boolean {
    const emotionalMarkers = ['feel', 'happy', 'sad', 'angry', 'upset', 'excited', 'worried', 'anxious', 'love', 'hate'];
    return emotionalMarkers.some(marker => text.toLowerCase().includes(marker));
  }
  
  // NLP helper for classifying question types
  private detectQuestionType(text: string): 'open_ended' | 'factual' | 'none' {
    // Check if it's a question
    if (!text.includes('?')) return 'none';
    
    // Detect open-ended questions
    const openEndedMarkers = ['why', 'how', 'what do you think', 'opinion', 'feel about'];
    if (openEndedMarkers.some(marker => text.toLowerCase().includes(marker))) {
      return 'open_ended';
    }
    
    // Default to factual for other question types
    return 'factual';
  }
  
  // Post-process response text with NLP enhancements
  private postProcessResponse(text: string, originalPrompt: string): string {
    // Remove any assistant/AI prefixes
    text = text.replace(/^(assistant|ai|bot):\s*/i, "");
    
    // Ensure text has proper sentence structure
    if (!text.match(/[.!?]$/)) {
      text += ".";
    }
    
    // Make sure first letter is capitalized
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Improve response formatting
    text = text.replace(/\n{3,}/g, "\n\n"); // Remove excessive line breaks
    
    // Add conversation continuity markers for short responses
    if (text.length < 50 && this.detectQuestionType(originalPrompt) !== 'factual') {
      // Check if the text already ends with a question
      if (!text.endsWith("?")) {
        // Add a follow-up question based on the original prompt
        if (this.detectEmotionalContent(originalPrompt)) {
          text += " How do you feel about this?";
        } else if (originalPrompt.toLowerCase().includes("you")) {
          text += " Is there anything specific you'd like to know more about?";
        } else {
          text += " Would you like to know more about this topic?";
        }
      }
    }
    
    return text;
  }

  // Generate caption for an image
  async generateImageCaption(imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.IMAGE_UNDERSTANDING}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image captioning error:", error);
        throw new Error(error.error || "Failed to generate image caption");
      }

      const data = await response.json();
      let caption = Array.isArray(data) ? data[0].generated_text : data.generated_text;
      
      // Enhance caption detail
      if (caption.length < 15) {
        caption += " (Note: Limited detail detected in this image)";
      }
      
      return caption;
    } catch (error) {
      console.error("Error generating image caption:", error);
      toast.error("Failed to analyze image. Please try again.");
      throw error;
    }
  }
}

export const huggingFaceService = new HuggingFaceService();

