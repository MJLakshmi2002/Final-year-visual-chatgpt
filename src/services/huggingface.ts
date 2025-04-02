
import { toast } from "sonner";

// Define available models
export const AVAILABLE_MODELS = {
  TEXT_TO_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0",
  IMAGE_UNDERSTANDING: "Salesforce/blip-image-captioning-large",
  TEXT_UNDERSTANDING: "google/flan-t5-large",
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

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || "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";
  }

  // Generate image from text prompt
  async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_TO_IMAGE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ inputs: prompt }),
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

  // Generate text response using FLAN-T5
  async generateTextResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_UNDERSTANDING}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Text generation error:", error);
        throw new Error(error.error || "Failed to generate text response");
      }

      const data = await response.json();
      return Array.isArray(data) ? data[0].generated_text : data.generated_text;
    } catch (error) {
      console.error("Error generating text response:", error);
      toast.error("Failed to generate text response. Please try again.");
      throw error;
    }
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
      return Array.isArray(data) ? data[0].generated_text : data.generated_text;
    } catch (error) {
      console.error("Error generating image caption:", error);
      toast.error("Failed to analyze image. Please try again.");
      throw error;
    }
  }
}

export const huggingFaceService = new HuggingFaceService();
