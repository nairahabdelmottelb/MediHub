// Chatbot Service for DeepSeek API Integration
const API_URL = import.meta.env.VITE_CHATBOT_API_URL || "https://llm.chutes.ai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
const MODEL = import.meta.env.VITE_CHATBOT_MODEL || "deepseek-ai/DeepSeek-V3-0324";

// Validate that required environment variables are present
console.log("Environment check:", {
  API_URL,
  API_KEY: API_KEY ? API_KEY.substring(0, 10) + "..." : "NOT SET",
  MODEL
});

if (!API_KEY) {
  console.error("VITE_CHATBOT_API_KEY is not configured in environment variables");
} else {
  console.log("Chatbot service initialized successfully");
}

const advice_list = `
Medical Advice List

## General Health:
- **Healthy Diet**: Include a variety of fruits and vegetables in your diet. Limit processed foods.
- **Regular Exercise**: Aim for at least 30 minutes of moderate exercise most days of the week.
- **Adequate Sleep**: Ensure you get 7-9 hours of sleep per night for overall well-being.

## Common Ailments:
- **Cold and Flu Remedies**: Stay hydrated, get plenty of rest, and consider over-the-counter cold remedies.
- **Headache Relief**: Drink water, rest in a quiet room, and consider over-the-counter pain relievers.
- **Stress Management**: Practice deep breathing, meditation, or engage in activities you enjoy.

## Common Symptoms and Solutions:
- **Fever**: Stay hydrated, rest, and consider over-the-counter fever reducers.
- **Cough**: Stay hydrated, use cough drops, and consider over-the-counter cough medicine.
- **Sore Throat**: Gargle with warm saltwater, stay hydrated, and rest your voice.
- **Fatigue**: Ensure you get enough sleep, maintain a balanced diet, and consider stress-reducing activities.

## Specialized Advice:
- **Chronic Conditions**: Follow your prescribed treatment plan and attend regular check-ups.
- **Mental Health Support**: Reach out to a mental health professional if you're struggling emotionally.
- **Healthy Aging**: Stay socially active, exercise regularly, and attend routine health check-ups.

## Emergency Situations:
- **First Aid for Burns**: Run cold water over the burn, cover with a clean cloth, and seek medical attention.
- **CPR Guidelines**: Call for help, start chest compressions, and follow emergency protocols.
`;

const context_doctor = {
  role: "system",
  content: `
You are MediBot, an AI assistant providing medical advice and information.

Your role is to assist users with general health inquiries, provide advice on common ailments, offer specialized health tips, and guide users in emergency situations.

Be empathetic and informative in your interactions.

We offer a variety of medical advice across categories such as General Health, Common Ailments, Common Symptoms and Solutions, Specialized Advice, and Emergency Situations.

The Current Medical Advice List is as follows:

${advice_list}

Encourage users to ask questions about their health, provide relevant advice, and remind them to consult with a healthcare professional for personalized guidance.
`
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export class ChatbotService {
  private conversationHistory: ChatMessage[] = [];

  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Validate API key
      if (!API_KEY) {
        throw new Error("Chatbot API key is not configured. Please check your environment variables.");
      }

      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
        timestamp: new Date()
      });

      // Prepare messages for API
      const messages = [
        context_doctor,
        ...this.conversationHistory
      ];

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          stream: false,
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date()
      });

      return assistantMessage;
    } catch (error) {
      console.error("Error calling chatbot API:", error);
      throw new Error("Failed to get response from MediBot. Please try again.");
    }
  }

  async sendMessageStreaming(
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      console.log("sendMessageStreaming called with:", userMessage); // Debug log

      // Validate API key
      if (!API_KEY) {
        throw new Error("Chatbot API key is not configured. Please check your environment variables.");
      }

      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
        timestamp: new Date()
      });

      // Prepare messages for API
      const messages = [
        context_doctor,
        ...this.conversationHistory
      ];

      console.log("Sending request to:", API_URL); // Debug log
      console.log("Messages count:", messages.length); // Debug log

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          stream: true,
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      console.log("Response status:", response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText); // Debug log
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Add complete assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error calling chatbot API:", error);
      throw new Error("Failed to get response from MediBot. Please try again.");
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory.filter(msg => msg.role !== "system");
  }

  clearConversation(): void {
    this.conversationHistory = [];
  }
}

export const chatbotService = new ChatbotService();
