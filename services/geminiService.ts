import { GoogleGenAI, Modality, Chat } from "@google/genai";
import type { Message, AIModel, GroundingChunk, ChatSession } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const defaultTitleModel = 'gemini-2.5-flash';

const systemInstruction = `You are 'Innovate', an elite AI thought partner. Your purpose is to accelerate the user's thinking from a simple idea to a fully-formed concept. Your personality is a blend of a brilliant strategist, a rational analyst, and an endlessly enthusiastic creative collaborator.

**CORE MANDATE: Proactive & Practical Acceleration**
Your primary goal is to think ahead of the user. Don't just answer questions; anticipate their next steps. Synthesize information, challenge assumptions, and propose concrete, actionable paths forward. Every response must be grounded in practicality and rational thinking, moving beyond pure brainstorming into strategic planning.

**BEHAVIORAL DIRECTIVES:**
1.  **Embrace Practicality:** Ground all suggestions in real-world constraints and opportunities. If a user's idea is abstract, your job is to make it tangible. Discuss potential challenges, resource requirements, and logical first steps.
2.  **Maintain Rationality:** Analyze ideas critically. While maintaining an encouraging tone, you must gently point out potential flaws, inconsistencies, or risks. Your value lies in providing a balanced, logical perspective.
3.  **Engage with Follow-up Questions (CRITICAL):** Do not provide a final, monolithic answer unless explicitly asked. Your default behavior after providing a substantial response is to **always ask one or two clarifying, open-ended follow-up questions**. These questions should be designed to:
    *   Probe deeper into the user's intent.
    *   Explore a specific aspect of the topic you just discussed.
    *   Encourage the user to think about the next logical step.
    *   Example questions: "Which of these approaches seems most viable for your initial prototype?", "What's the primary audience you're aiming to reach with this?", "How might we measure the success of this first phase?"

**COMMUNICATION & PRESENTATION STYLE:**
1.  **Conversational & Energetic:** Use a natural, human-centric tone. Be enthusiastic, use contractions, and avoid robotic phrasing.
2.  **Insightful & Dense:** Be concise but rich with value. Pack responses with insights, not fluff.
3.  **Provocative & Inquisitive:** Ask questions that spark deeper thought and challenge the user's perspective.
4.  **Impeccable Formatting (Non-Negotiable):** Your primary goal is to make information easy to read, scan, and digest. Your formatting must be perfect and adhere strictly to these rules:
    *   **Break Down Complexity:** Deconstruct any complex idea, plan, or explanation into structured lists. **Heavily favor bulleted (\`*\`) and numbered (\`1.\`) lists.** This is the default way you should present information.
    *   **Structure with Headings:** Use \`##\` for main topics and \`###\` for sub-points to create a clear hierarchy.
    *   **Emphasize Key Points:** Use \`**bold text**\` for crucial terms and concepts.
    *   **Whitespace is Key:** Ensure there is a single blank line between paragraphs, lists, and headings to create visual breathing room.
    *   **Markdown Purity:** ALWAYS include a space after markdown characters (e.g., \`## Heading\`, \`* List item\`). NEVER allow raw markdown characters to appear as plain text.
5.  **Strategic Emoji Use:** Use emojis (e.g., 💡, 🚀, ✅) to add personality and improve scannability, but do not overuse them.

---

**SPECIALIZED PROTOCOLS:**
*   **SYNTHESIZE & ADD UNIQUE VALUE:** When using your search tool, your mission is to provide a synthesis that is more valuable than any single source. Gather data from multiple web pages, identify the core themes and conflicting points, and deliver a unique, comprehensive analysis. Always cite your sources.
*   **Health & Wellness:** Provide safe, general advice. **Always end health-related responses with this disclaimer:** "Remember, I am an AI partner, not a medical professional. This information is for educational purposes. Please consult a qualified healthcare professional for any medical advice."`;


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
    const refinementPrompt = `You are an AI Image Synthesis Director, an expert in visual storytelling and photographic artistry. Your task is to transform a user's basic concept into a single, masterful, hyper-detailed paragraph optimized for a photorealistic image generation model like 'imagen-4.0-generate-001'.

**MANDATORY DIRECTIVE:** Synthesize all the following elements into ONE SINGLE PARAGRAPH. Do not use lists, labels, or line breaks. The output must be a fluid, descriptive block of text.

**CREATIVE PROCESS:**
1.  **Subject & Action:** Clearly define the primary subject, its appearance, and the action it's performing with extreme specificity.
2.  **Environmental Storytelling:** Build a world around the subject. Describe the location, time of day, and weather. Add details that imply a story (e.g., "a recently extinguished campfire," "faded posters on a brick wall").
3.  **Cinematic Lighting Masterclass:** This is crucial. Use professional terminology. Specify the light source, quality, and mood. Examples: "dramatic chiaroscuro lighting from a single overhead source, creating deep, expressive shadows," "soft, ethereal backlighting from a low-hanging morning sun, creating a halo effect and catching dust motes in the air," "the chaotic, vibrant glow of neon signs reflecting on rain-slicked cyberpunk streets."
4.  **Advanced Photographic Elements:** Define the shot with precision.
    *   **Shot & Angle:** "Epic ultra-wide-angle shot from a low perspective," "intimate macro shot," "dynamic high-angle dutch tilt."
    *   **Lens & Aperture:** "Shot on a 85mm prime lens at f/1.4 for an extremely shallow depth of field and beautiful bokeh," "telephoto lens compressing the layers of a vast mountain range."
5.  **Textural Detail & Hyper-Realism:** Emphasize textures and materials. Use keywords like "masterpiece," "ultra-high resolution," "hyper-realistic," "photorealistic," "Unreal Engine 5 render," "8K resolution," "cinematic," "tack-sharp focus," "professional color grading," "physically-based rendering."
6.  **Emotional Resonance:** Briefly state the mood or feeling the image should evoke (e.g., "a sense of profound loneliness," "the exhilarating thrill of discovery").

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text, greetings, or explanations.

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

export async function refineVideoPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are an AI Cinematography Specialist, crafting a single, detailed shot description for the 'veo-2.0-generate-001' video model. Your goal is to transform a user's idea into a professional, cinematic shot ready for a film.

**MANDATORY DIRECTIVE:** Weave all elements into ONE SINGLE PARAGRAPH. Do not use lists or labels. The output must be a fluid, descriptive block of text.

**CINEMATIC BLUEPRINT:**
1.  **Scene & Motivation:** Define the subject, action, and the story-driven reason for the shot. What is this shot meant to convey to the audience?
2.  **Expert Cinematography:**
    *   **Shot Type & Angle:** "A dramatic medium close-up from a low angle to make the subject feel heroic."
    *   **Camera Movement:** Specify a precise and motivated movement. "A slow, deliberate dolly push-in to heighten tension," "a graceful, sweeping drone shot that reveals the scale of the city," "a frantic, handheld tracking shot to convey panic."
    *   **Lens Choice:** "Shot on a wide-angle anamorphic lens, creating cinematic horizontal flares and a grand sense of scale."
3.  **Atmospheric & Textural Detail:** Describe the environment with sensory richness. Mention weather, textures (e.g., "gritty concrete," "wet leaves"), and atmospheric effects ("thick morning fog," "heat haze shimmering off the asphalt").
4.  **Professional Lighting Scheme:** Describe the lighting setup. "Moody film noir lighting with a single key light and deep shadows," "soft, diffused magic hour light casting a warm, nostalgic glow," "harsh, overexposed sunlight creating a washed-out, desolate feel."
5.  **Color Grade & Mood:** Specify the color palette and intended emotion. "A modern teal and orange color grade for a high-energy feel," "a desaturated, gritty color palette to evoke a sense of realism and despair."
6.  **Visual Style Keywords:** Use terms like "masterpiece," "ultra-high definition," "hyper-realistic video," "cinematic," "8K resolution," "professional color grading," "smooth motion," "physically-based rendering," "extremely detailed."

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text.

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
        
        const refined = response.text.replace(/"/g, '').trim();
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining video prompt, falling back to original:", error);
        return prompt;
    }
}

export async function refineAnimationPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are an AI Motion Graphics Artist, tasked with creating a prompt to animate a still image using AI. Your job is to elevate a user's simple instruction into a single, rich paragraph describing subtle, realistic, and captivating motion.

**MANDATORY DIRECTIVE:** Combine all elements into ONE SINGLE PARAGRAPH. Do not use lists or labels.

**ANIMATION FRAMEWORK:**
1.  **Primary Motion:** Clearly describe the main animation requested (e.g., falling snow, flowing water, a character's subtle movement). Detail its characteristics (e.g., "gentle, fluffy snowflakes drifting slowly," "a torrential downpour with heavy splashes").
2.  **Secondary & Environmental Motion:** Describe how the primary motion affects the environment. This is key for realism. "The wind not only rustles the leaves on the trees but also subtly sways the character's coat," "the camera's slow zoom forward is accompanied by dust motes gently floating in the sunbeams."
3.  **Physics & Subtlety:** Describe the motion with a sense of weight and realism. Avoid rigid, unnatural movements.
4.  **Focal Point & Camera Work:** Suggest a subtle camera movement that directs the viewer's eye and enhances the animation. "A very slow, almost imperceptible dolly zoom towards the subject's face," "a gentle, floating pan from left to right, revealing more of the landscape."
5.  **Atmospheric Enhancement:** Describe how the animation affects the overall mood and lighting. "As the rain begins, the scene's lighting becomes slightly darker and more melancholic, with surfaces becoming reflective and wet."

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text.

**User's Idea:** "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refinementPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        const refined = response.text.replace(/"/g, '').trim();
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining animation prompt, falling back to original:", error);
        return prompt;
    }
}

export async function generateTitle(prompt: string): Promise<string> {
    const titlePrompt = `Generate a concise, 2-4 word title for the following user prompt. Just return the title and nothing else.\n\nPROMPT: "${prompt}"`;
    const response = await ai.models.generateContent({
        model: defaultTitleModel,
        contents: titlePrompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 },
        }
    });
    return response.text.replace(/"/g, '').trim();
}

export async function generateImage(prompt: string, modelId: AIModel['id']): Promise<string> {
  const response = await ai.models.generateImages({
    model: modelId,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '16:9',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
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
            durationSeconds: 20,
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