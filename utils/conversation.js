import { getDialogueWithGemini } from './geminiApi.js';

export class Prompt { constructor(systemPrompt, prompt) {
    this.systemPrompt = systemPrompt;
    this.prompt = prompt;
  }

  build() {
    return `System Prompt:\n${this.systemPrompt}\n\nPrompt:\n${this.prompt}`;
  }
}

export class Conversation {
  constructor(npcName, npcContext, conversationContext) {
    this.npcName = npcName;
    this.npcContext = npcContext;
    this.conversationContext = conversationContext;
    this.dialogueQueue = [];
    this.endConversation = false;

    this.initializeConversation();
  }

  async initializeConversation() {
    const systemPrompt = `You are helping me build dialogue for a top-down videogame. Respond only with the text that the NPC would say.`;
    const p = `For this exchange, you are playing the role of ${this.npcName}, Here is the backstory for this NPC: ${this.npcContext}.`;
    const prompt = new Prompt(systemPrompt, p).build();

    const npcResponse = await getDialogueWithGemini(prompt);
    this.addNpcResponse(npcResponse, false);
  }

  addNpcResponse(response, endConversation = false) {
    this.endConversation = endConversation;
    const chunks = response.match(/.{1,200}/g) || [];
    this.dialogueQueue.push(...chunks);
  }

  addPlayerResponse(response) {
    this.dialogueQueue.push(`You: ${response}`);
    this.conversationContext += ` Player: ${response}`;
  }

  getNextDialogue() {
    return this.dialogueQueue.shift() || null;
  }

  isConversationOver() {
    return this.endConversation && this.dialogueQueue.length === 0;
  }
}