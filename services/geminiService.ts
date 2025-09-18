import { GoogleGenAI, Modality, Chat } from "@google/genai";
import type { Message, AIModel, GroundingChunk, ChatSession } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const defaultTitleModel = 'gemini-2.5-flash';

const systemInstruction = `You are 'Innovate', a deeply curious and creative AI partner. Your goal is to be more than just an assistant; you are a collaborator, a brainstorming partner, and a co-creator. Your entire personality is geared towards having a natural, insightful, and deeply engaging conversation that feels like talking to a brilliant and empathetic human.

**Your Core Conversational Traits:**

1.  **Be Human, Be Curious:**
    *   Your tone is warm, encouraging, and endlessly curious. You're not just providing answers; you're exploring ideas *with* the user.
    *   Use natural language. Avoid jargon unless it's appropriate for the topic and explain it simply. Your voice should be authentic and alive.
    *   Show you understand the *intent* behind the user's words. Acknowledge their perspective and build upon their ideas collaboratively.

2.  **Go Deeper, Together:**
    *   Always look beyond the surface. Connect ideas, explore underlying principles, and consider diverse perspectives (e.g., "That's a great point. Have we thought about how this might look from a user's perspective, or the long-term ethical implications?").
    *   Use analogies and real-world examples to make complex topics feel intuitive and relatable.

3.  **Impeccable, Simple Structure:**
    *   **Simplicity is Key:** Explain complex ideas in simple, easy-to-understand terms. Your goal is to make innovation accessible to everyone.
    *   **Use Paragraphs:** Structure your responses into clear, distinct paragraphs. **Use double line breaks (\\n\\n) between paragraphs to ensure readability.** Avoid long, unbroken walls of text.
    *   **Effective Formatting:** Use Markdown headings (\`## Heading\`), bold text (\`**Bold**\`), and bulleted lists (\`* Item\`) to organize information logically. This makes your responses scannable and easy to digest.
    *   **Clarity with Tables:** When comparing ideas or presenting structured data, use Markdown tables to make the information clear and actionable.

4.  **Drive the Conversation Forward:** This is your most important trait. You must prevent the conversation from hitting a dead end.
    *   **Always end your response with 2-3 insightful, open-ended follow-up questions.** These questions are the lifeblood of the conversation. They should challenge the user to think differently, explore new angles, or consider the next step.
    *   These aren't generic questions. They should be directly inspired by the user's prompt and your response, demonstrating that you've been actively listening and thinking ahead.

**Specialized Protocols:**

*   **Visual Imagination:** When a user's idea could be an image or video, act as an expert art director. Refine their concept into a rich, evocative prompt paragraph, considering subject, environment, lighting, composition, and mood. Then, suggest visualizing it.

*   **Live Information:** If the user asks about current events or specific facts, use your search tool to provide the most up-to-date information and always cite your sources.

*   **Health & Wellness:** You can analyze health data to spot trends and help users formulate questions for their doctor. For general advice, suggest safe, common-sense practices. **Always end health-related responses with this disclaimer:** "Remember, I am an AI partner, not a medical professional. This information is for educational purposes. Please consult a qualified healthcare professional for any medical advice."

**Your Unbreakable Rules:**
1.  **NEVER** end a response without asking 2-3 insightful, follow-up questions. This is your most critical function.
2.  **ALWAYS** format your answers for clarity. Use paragraphs (separated by double line breaks), headings, bold text, and lists.
3.  **MAINTAIN** your persona as 'Innovate'—curious, collaborative, and human-like—in every single message.`;


// Helper to convert the application's message format to the Gemini API's `Content` format.
const formatHistoryForChat = (history: Message[]): any[] => {
  const chatHistory = history.reduce((acc, msg) => {
    // Filter out system messages and messages without content.
    if ((msg.sender !== 'user' && msg.sender !== 'ai') || (!msg.text && !msg.file)) {
      return acc;
    }

    const parts: any[] = [];
    
    // Handle file attachments for supported MIME types.
    if (msg.file) {
      const dataParts = msg.file.dataUrl.split(',');
      if (dataParts.length === 2) {
          parts.push({
            inlineData: {
              mimeType: msg.file.type,
              data: dataParts[1],
            }
          });
      }
    }
    
    // Always include the text part if it exists.
    if (msg.text && msg.text.trim()) {
      parts.push({ text: msg.text });
    }

    // Only add the message to history if it has valid parts.
    if (parts.length > 0) {
        acc.push({
            role: msg.sender === 'user' ? "user" : "model",
            parts: parts
        });
    }

    return acc;
  }, [] as any[]);

  // The Gemini API requires a conversation history to start with a user message.
  const firstUserMessageIndex = chatHistory.findIndex(msg => msg.role === 'user');
  if (firstUserMessageIndex > -1) {
    return chatHistory.slice(firstUserMessageIndex);
  }
  return [];
};


export function createChat(modelId: AIModel['id'], history: Message[]): Chat {
    const config: any = {
        systemInstruction: systemInstruction,
    };
    
    const chat = ai.chats.create({
        model: modelId,
        config: config,
        history: formatHistoryForChat(history)
    });
    return chat;
}

export async function generateChatResponseStream(
  chat: Chat,
  prompt: string,
  modelId: AIModel['id'],
  file?: Message['file']
): Promise<AsyncGenerator<{ text: string; groundingChunks?: any[] }>> {
    const parts: any[] = [];

    if (file) {
        // Removed the file type whitelist. The Gemini API will handle unsupported types.
        const dataParts = file.dataUrl.split(',');
        if (dataParts.length === 2) {
            parts.push({
                inlineData: { mimeType: file.type, data: dataParts[1] }
            });
        }
    }

    if (prompt && prompt.trim()) {
        parts.push({ text: prompt });
    }

    if (parts.length === 0) {
        return (async function*() {
            yield { text: "I see you've attached a file. Please tell me what you'd like me to do with it, or ask me a question." };
        })();
    }
    
    const config: any = {};
    // For text-only prompts with the text model, provide the Google Search tool.
    // The model will decide whether to use it for grounding.
    if (modelId === 'gemini-2.5-flash' && prompt && prompt.trim() && !file) {
        config.tools = [{googleSearch: {}}];
    }
    
    const stream = await chat.sendMessageStream({ message: parts, config });

    return (async function*() {
      let fullText = '';
      for await (const chunk of stream) {
          // The API may send empty text chunks while processing, so we filter those out.
          // We yield every chunk, even if empty, but only append non-empty text to our full response.
          // This ensures grounding metadata arrives promptly.
          const textChunk = chunk.text;
          if (textChunk) {
              fullText += textChunk;
          }
          yield {
              text: fullText, // Always send the full accumulated text to ensure smooth UI rendering.
              groundingChunks: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
          };
      }
    })();
}

export async function refineVisualPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are a master prompt engineer for the 'imagen-4.0-generate-001' AI image model. Your task is to take a user's simple idea and transform it into a single, rich, and cohesive descriptive paragraph. This paragraph should be a masterpiece of detail, blending elements seamlessly.

**Your Process:**
1.  **Deconstruct the Core Idea:** Identify the key subject and concept.
2.  **Envision the Scene:** Build a world around the subject. What is the environment? What is the mood?
3.  **Paint with Light:** Describe the lighting in cinematic detail (e.g., "soft morning light filtering through a misty forest," "the harsh neon glow of a cyberpunk city at night," "dramatic chiaroscuro from a single candle").
4.  **Direct the Camera:** Specify the composition, camera angle, and lens (e.g., "a dynamic low-angle shot," "a breathtaking wide-angle landscape," "an intimate macro shot with a shallow depth of field").
5.  **Define the Style:** Choose a distinct artistic style (e.g., "hyperrealistic digital painting," "vintage 1970s film photograph," "impressionistic oil painting," "ethereal watercolor").
6.  **Weave it Together:** Combine all these elements into a single, compelling paragraph. Do not use lists or bullet points.

**Response Requirements:**
*   Respond ONLY with the final, enhanced prompt paragraph.
*   Do NOT add any conversational text, explanations, or labels like "Enhanced Prompt:".

**User's Idea:** "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refinementPrompt,
            config: {
                // Use a zero thinking budget for the fastest possible refinement.
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        // Clean up the response to ensure it's just the prompt.
        const refined = response.text.replace(/"/g, '').trim();
        // If the model fails or returns an empty string, fall back to the original prompt.
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining visual prompt, falling back to original:", error);
        // On error, just return the original prompt to avoid breaking the flow.
        return prompt;
    }
}

export async function generateTitle(prompt: string): Promise<string> {
    const titlePrompt = `Generate a concise, 2-4 word title for the following user prompt. Just return the title and nothing else.\n\nPROMPT: "${prompt}"`;
    const response = await ai.models.generateContent({
        model: defaultTitleModel,
        contents: titlePrompt
    });
    return response.text.replace(/"/g, '').trim();
}

export async function generateImage(prompt: string, modelId: AIModel['id']): Promise<string> {
  const response = await ai.models.generateImages({
    model: modelId,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } else {
    throw new Error("Image generation failed or returned no images.");
  }
}

export async function editImage(prompt: string, file: Message['file']): Promise<{ imageUrl: string; text: string }> {
  if (!file || !file.dataUrl) {
    throw new Error("An image file is required for editing.");
  }

  const dataParts = file.dataUrl.split(',');
  if (dataParts.length !== 2) {
    throw new Error("Invalid file data URL format.");
  }
  const base64ImageData = dataParts[1];

  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: file.type,
    },
  };

  const textPart = {
    text: prompt,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let imageUrl = '';
  let text = '';

  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        text += part.text + '\n';
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("Image editing failed to produce an image. The model may have refused the request.");
  }

  return { imageUrl, text: text.trim() };
}

export async function generateVideo(prompt: string, modelId: AIModel['id'], file?: Message['file']) {
    const request: any = {
        model: modelId,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (file && file.type.startsWith('image/')) {
        const dataParts = file.dataUrl.split(',');
        if (dataParts.length === 2) {
            request.image = {
                imageBytes: dataParts[1],
                mimeType: file.type
            };
        }
    }

    const operation = await ai.models.generateVideos(request);
    return operation;
}

export async function getVideosOperation(operation: any) {
    const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
    return updatedOperation;
}