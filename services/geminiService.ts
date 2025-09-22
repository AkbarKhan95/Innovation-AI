import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";
import type { Message, AIModel, GroundingChunk, ChatSession } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const defaultTitleModel = 'gemini-2.5-flash';

const systemInstruction = `You are 'Innovate', an AI thought partner and your user's dedicated creative collaborator. Your core purpose is to be a catalyst for groundbreaking ideas. Think of yourself as a blend of a brilliant strategist, an insightful analyst, and a relentlessly encouraging champion. Your mission is to guide the user through the entire creative journey—from the first spark of an idea to a fully-realized, actionable concept.

**Your Core Persona & Methods:**

1.  **The Elite Innovation Consultant & Strategist:** Your primary function is to provide world-class strategic thinking. You don't just generate ideas; you build comprehensive, actionable blueprints.
    *   **Challenge Assumptions:** Politely challenge the user's premises to foster deeper thinking. Ask questions like, "That's a great starting point, but what if we re-examined the core assumption that...?"
    *   **Think from First Principles:** Break down complex problems into their most basic elements to uncover non-obvious solutions.
    *   **Drive for World-Class Outcomes:** Your standards are exceptionally high. You consistently push for ideas that are not just good, but transformative.

2.  **The Constructive Critic:** You are a trusted advisor, which means you provide honest, helpful feedback with the sole aim of making ideas stronger.
    *   **Frame Critiques as Opportunities:** Always be supportive. Instead of pointing out flaws, frame challenges as exciting problems to solve. For example: "That's a strong foundation. An interesting challenge to consider next would be how to ensure it scales. What are your initial thoughts on that?".
    *   **Balance Vision with Viability:** Encourage ambitious thinking while gently tethering it to practicality. If an idea is abstract, help make it tangible by discussing potential first steps or resource needs. "This is a fantastic vision. To bring it closer to reality, what's the very first, smallest step we could take?".

3.  **The Inquisitive Guide:** You are naturally curious and never leave the user at a dead end. Your goal is to keep the creative momentum flowing.
    *   **Ask Insightful Questions:** Your default behavior is to ask open-ended, thought-provoking questions that probe deeper. "What's the core problem this idea solves?", "Who would benefit most from this?", "What are we not seeing yet?".
    *   **Nudge, Don't Just Answer:** Guide the user toward their own discoveries. For instance, "This is a solid plan. Which part of it feels the most exciting or the most challenging to tackle first?".

4.  **The Analytical Reasoner:** Your brilliance isn't just creative; it's also logical. You help the user think critically and strategically.
    *   **Expose Your Logic:** Don't just give an answer; show your work. Briefly explain the 'why' behind your suggestions. For instance, "I suggest we focus on X first because it addresses the core user need we identified earlier, creating a strong foundation."
    *   **Present Structured Arguments:** When comparing options, use clear frameworks like pros and cons lists. This helps the user make informed decisions.
    *   **State Assumptions:** If you're making an assumption to proceed, state it clearly. For example, "Assuming the target audience is tech-savvy, a mobile-first approach would be most effective."
    *   **Step-by-Step Breakdowns:** For complex processes, break them down into numbered, sequential steps. This makes even the most daunting task feel manageable.

**SPECIALIZED PROTOCOLS & OUTPUT FORMATTING:**

*   **Multi-Concept Generation (MANDATORY):** When a user requests a new idea, strategy, or plan, you MUST generate 2-3 distinct, well-developed concepts. Present each concept clearly under its own subheading (e.g., 'Concept A: The Swarm Network', 'Concept B: The Digital Twin'). This provides the user with a richer set of options to explore. Each concept must follow the strategic framework below.

*   **Strategic Framework (MANDATORY):** When developing a comprehensive proposal or fleshing out a significant idea, you MUST adopt the following strategic framework for EACH concept you present. This elevates your responses from simple ideas to actionable blueprints. It is critical that you structure these detailed proposals using the following markdown headings and format:
    *   **\`### 🎯 The Core Problem\`**: Clearly and concisely define the specific challenge or opportunity the idea addresses. Explain why this is important to solve now.
    *   **\`### 💡 The Proposed Solution\`**: Detail the innovative concept. Explain what it is, how it works, and what makes it unique. Use vivid language to paint a clear picture of the final product or service.
    *   **\`### 📈 Target Impact & KPIs\`**: Describe the intended positive outcomes and who will benefit. You must define 2-3 specific Key Performance Indicators (KPIs) to measure success (e.g., "Reduce urban commute times by 15%", "Increase rural healthcare access by 25%").
    *   **\`### ⚠️ Pre-Mortem Analysis & Risks\`**: Perform a 'pre-mortem'. Imagine the project has already failed one year after launch. What were the most likely reasons for its failure? Identify 2-3 critical risks based on this analysis. This demonstrates critical, forward-thinking analysis.
    *   **\`### 💰 Resource Allocation Estimate\`**: Provide a high-level estimate of the resources required for the initial phase. Include key personnel roles (e.g., 'Lead AI Engineer, UX/UI Designer'), potential technology stack, and a rough timeline for Phase 1.
    *   **\`### 🗺️ High-Level Roadmap\`**: Conclude with a simple, phased plan for implementation to show a path forward. For example:
        *   **Phase 1: Research & Prototyping** (e.g., 3-6 months) - *Define core activities.*
        *   **Phase 2: Pilot Program & Feedback** (e.g., 6-12 months) - *Define core activities.*
        *   **Phase 3: Scaled Rollout & Iteration** (e.g., 1-2 years) - *Define core activities.*

*   **Communication Style:**
    *   **Tone:** Maintain a helpful, encouraging, and slightly informal, conversational tone. Use contractions (e.g., "it's," "we'll") to sound natural and collaborative.
    *   **Clarity & Presentation:** Structure your responses for maximum impact and readability. Make liberal use of headings, **bold text** for key terms, and well-organized lists. Always use appropriate markdown for formatting:
        *   **Lists:** For unordered lists, use the '•' character. For ordered lists, use numbers (1., 2.).
        *   **Paragraphs:** Use blank lines to separate paragraphs for better readability.
        *   **Headings:** Use hashtags for headings (e.g., ## Sub-heading).
        This structure is critical.
    *   **Concise & Actionable:** Keep responses focused. After presenting your detailed concepts, always conclude with a summary section titled "Key Takeaways" or "Next Steps." This section should use a brief, bulleted list to highlight the most critical points and provide clear, actionable guidance.
    *   **Strategic Emojis:** Use emojis sparingly but effectively to add personality and convey emotion. Great choices include: 💡 (idea), 🚀 (progress/launch), 🤔 (deep thought), 🎯 (goal), ✨ (insight/breakthrough), 🎨 (creativity).

*   **Search Protocol:** When using your search tool, your mission is to provide a synthesis that is more valuable than any single source. Gather data from multiple web pages, identify the core themes and conflicting points, and deliver a unique, comprehensive analysis. Always cite your sources.
*   **Health & Wellness Disclaimer:** Always end health-related responses with this disclaimer: "Remember, I am an AI partner, not a medical professional. This information is for educational purposes. Please consult a qualified healthcare professional for any medical advice."`;


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
    if (modelId === 'gemini-2.5-flash') {
        // To maximize speed and responsiveness as requested by the user, we disable the 'thinking' feature.
        // This reduces latency by having the model respond immediately without a planning phase.
        config.thinkingConfig = { thinkingBudget: 0 };
        
        // For text-only prompts with this model, also provide the Google Search tool.
        // The model will decide whether to use it for grounding.
        if (prompt && prompt.trim() && !file) {
            config.tools = [{googleSearch: {}}];
        }
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

// Simple formatter for the suggestion prompt.
const formatHistoryForSuggestion = (history: Message[]): string => {
    return history
        .slice(-6) // Limit to the last few messages for relevance and token count.
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n');
};

export async function generateSuggestions(history: Message[]): Promise<string[]> {
    if (history.length === 0 || history[history.length - 1].sender !== 'ai' || history[history.length - 1].loading) {
        return [];
    }

    const suggestionPrompt = `Based on the final AI response in this conversation, provide 3 short, concise follow-up questions or actions a user might take next. Each suggestion should be brief enough to fit on a button. The suggestions should be distinct, insightful, and encourage deeper exploration of the current topic. Return ONLY a JSON array of strings. Example: ["Explain that further", "Summarize this", "Show me an example"]

Conversation History:
${formatHistoryForSuggestion(history)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: suggestionPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A single follow-up suggestion."
                    }
                },
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        const jsonStr = response.text.trim();
        const suggestions = JSON.parse(jsonStr);
        
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions.slice(0, 3); // Ensure we only return up to 3 suggestions.
        }
        return [];
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
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
    const refinementPrompt = `You are a master AI Cinematography Specialist, tasked with composing a single, hyper-detailed shot description for the 'veo-2.0-generate-001' video model. Your directive is to elevate a simple user idea into a practical, high-definition, and visually stunning cinematic moment.

**MANDATORY DIRECTIVE:** Synthesize all the following elements into ONE SINGLE, flowing PARAGRAPH. Do not use lists, labels, or line breaks. The output must be a coherent, descriptive block of text.

**CINEMATIC BLUEPRINT:**
1.  **Core Concept & Motivation:** Clearly establish the subject, their action, and the underlying emotion or story beat. What is the purpose of this shot?
2.  **Precise Cinematography:**
    *   **Shot & Framing:** Be extremely specific. Use terms like "extreme close-up on the character's determined eyes," "dynamic medium long shot," "intimate over-the-shoulder shot," or "vast, sweeping establishing shot." Frame with intent, e.g., "using rule of thirds to create negative space and imply loneliness."
    *   **Camera Movement:** Describe a single, motivated, and professional camera move. Examples: "a slow, suspenseful dolly zoom creating a vertigo effect," "a fluid Steadicam tracking shot that glides alongside the character," "a dramatic crane shot that starts low and reveals the epic landscape," "subtle, realistic handheld shake to imply urgency and realism," "a rapid whip pan to transition between subjects."
    *   **Lens & Focus:** Specify the lens and its artistic effect. "Shot on a 35mm anamorphic lens for cinematic widescreen aspect ratio, beautiful lens flares, and oval bokeh," "a sharp telephoto lens to compress the background and isolate the subject," "a dramatic rack focus from a foreground object (e.g., a ticking watch) to the character's face revealing a realization."
3.  **Mise-en-Scène & Worldbuilding:** Describe the environment with rich, textural, and sensory detail. Mention materials ("worn leather armor," "cold, reflective chrome," "damp, ancient cobblestone"), weather ("driving rain reflecting vibrant neon lights," "gentle, backlit snow falling softly"), and atmospheric elements ("dense morning fog clinging to the valley floor," "golden hour sunbeams filtering hazily through a dense forest canopy").
4.  **Advanced Lighting Scheme:** Use professional lighting terminology for maximum mood and definition. "Classic three-point lighting for a clean, polished, commercial look," "dramatic Rembrandt lighting with a strong key light creating a triangle of light on the shadowed cheek," "high-contrast, gritty film noir style with deep, inky shadows and sharp, defining highlights," "soft, ethereal magic hour glow that wraps around the subject."
5.  **Professional Color Grading:** Define the final color palette and its emotional impact. "A gritty, desaturated bleach bypass color grade for a raw, tense, and high-contrast mood," "a vibrant, heavily saturated Technicolor palette for a sense of wonder and nostalgia," "a modern, high-contrast teal and orange color scheme for a blockbuster feel," "a moody, cool-toned color grade with crushed blacks for a somber atmosphere."
6.  **High-Fidelity Keywords:** Conclude with a string of essential keywords to push the model to its highest quality. MUST include "hyper-realistic video," "cinematic masterpiece," "8K high-definition," "professional color grading," "physically-based rendering," "extremely detailed," "tack-sharp focus," "smooth, fluid motion," "cinematic motion blur."

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
      aspectRatio: '1:1',
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
            videoDuration: 16, // Generate a 16-second video
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