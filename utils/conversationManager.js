import { createDialogueBox } from "../utils/ui.js";
import { getDialogueWithGemini } from "../utils/geminiApi.js";


const responseJsonFormat = `Please return your response in the following JSON format:
{{
    "text": "<Your response here>",
    "endConversation": <true if the conversation should end, false otherwise>,,
    "responseOptions": <JSON array of strings, each a response that the player can choose from as a response to the NPC's dialogue, maximum of 3. These should all be distinctly different. Keep it under 60 characters.>
}}
`;

const systemPrompt = `You are helping me build dialogue for a top-down videogame. Respond only with the text that the NPC would say.`;


export class ConversationManager {
    constructor(player) {
        this.player = player;
        this.currentNpc = null;

        this.dialogueQueue = [];
        this.conversationHistory = [];

        this.totalChunks = 0;
        this.currentChunk = 0;

        this.dialogueBox = null;
        this.content = null;
        this.endConversationAfterCurrentDialogue = false;
        this.responseOptions = null;

        this.responseSelectionMode = false;
        this.selectedOption = 0;
    }

    chunkDialogue(dialogue) {
        const maxLen = 80;
        const words = dialogue.split(" ");
        const chunks = [];
        let current = "";

        for (const word of words) {
            if ((current + word).length > maxLen) {
                chunks.push(current.trim());
                current = "";
            }
            current += word + " ";
        }
        if (current.trim().length > 0) {
            chunks.push(current.trim());
        }
        return chunks;
    }

    buildPrompt() {
        const p = `For this exchange, you are playing the role of ${this.currentNpc.npcName}, Here is the backstory for this NPC: ${this.backstory}.`;
        var prompt = `${systemPrompt}\n\n${p}`;
        if (this.conversationHistory.length > 0) {
            var history = "";
            for (let i = 0; i < this.conversationHistory.length; i++) {
                const { speaker, text } = this.conversationHistory[i];
                const speakerText = `${speaker}: ${text}`;
                history += `${speakerText}\n`;
            }
            prompt += `\n\nHere is the conversation history:\n${history}`;
        }
        prompt += `\n\n${responseJsonFormat}`;

        console.log("buildPrompt - Prompt for Gemini:", prompt);
        return prompt;
    }

    processLlmResponse(responseStr) {
        console.log("processLlmResponse - Response from Gemini:", responseStr);

        const response = JSON.parse(responseStr.replace("```json", "").replace("```", ""));
        const llmDialogue = response.text;
        this.conversationHistory.push({ speaker: this.npcName, text: llmDialogue });
        this.endConversationAfterCurrentDialogue = response.endConversation;
        this.responseOptions = response.responseOptions.map(e => String(e));

        // Destroy the previous dialogue box if it exists
        if (this.dialogueBox) {
            destroy(this.dialogueBox);
            this.dialogueBox = null;
        }

        // Chunk the LLM response, not the input
        this.dialogueQueue = this.chunkDialogue(llmDialogue);
        this.totalChunks = this.dialogueQueue.length;
        this.currentChunk = 0;

        const { dialogueBox, content } = createDialogueBox();
        this.dialogueBox = dialogueBox;
        this.content = content;

        this.displayNextChunk();
    }

    async startConversation(npc) {
        if (!npc || !npc.exists()) {
            console.error("Cannot start conversation: NPC does not exist.");
            return;
        }
        if (!this.player) {
            console.error("Cannot start conversation: Player does not exist.");
            return;
        }

        console.log(`Starting conversation with ${npc.npcName}`);
        this.player.isInDialogue = true;

        this.currentNpc = npc;
        this.npcName = npc.npcName;
        this.backstory = npc.backstory;
        this.conversationHistory = [];

        // Build prompt and get LLM response
        const prompt = this.buildPrompt();

        try {
            const responseStr = await getDialogueWithGemini(prompt);
            this.processLlmResponse(responseStr);

            this.spaceListener = onKeyPress("space", () => this.handleSpacePress());
            this.escapeListener = onKeyPress("escape", () => this.handleEscapePress());
            this.upListener = onKeyPress("w", () => this.handleUpPress());
            this.downListener = onKeyPress("s", () => this.handleDownPress());
        } catch (error) {
            console.error("Error in startConversation:", error);
            this.endConversation();
        }
    }

    async handlePlayerResponse() {
        const playerResponse = this.responseOptions[this.selectedOption];
        this.conversationHistory.push({ speaker: "Player", text: playerResponse });

        const prompt = this.buildPrompt();
        const responseStr = await getDialogueWithGemini(prompt);
        console.log("handlePlayerResponse - Response from Gemini:", responseStr);
        this.processLlmResponse(responseStr);

        this.responseSelectionMode = false;
        this.selectedOption = 0;
    }

    displayNextChunk() {
        if (this.currentChunk < this.totalChunks) {
            let chunkText = `(${this.currentChunk + 1}/${this.totalChunks}) ${this.dialogueQueue[this.currentChunk]}`;
            if (this.currentChunk < this.totalChunks - 1) {
                chunkText += " ...";
            }
            this.content.text = chunkText;
            this.currentChunk++;
        } else if (this.endConversationAfterCurrentDialogue) {
            this.endConversation();
        } else {
            this.responseSelectionMode = true;
            this.selectedOption = 0;
            this.content.text = this.getResponseOptionText();
        }
    }

    getResponseOptionText() {
        var responseText = "";
        for (let i = 0; i < this.responseOptions.length; i++) {
            const prepend = i === this.selectedOption ? ">" : " ";
            const addedText = `${prepend} ${this.responseOptions[i]}`;
            responseText += addedText;
            if (i < this.responseOptions.length - 1) {
                responseText += "\n";
            }
        }
        return responseText;
    }

    handleSpacePress() {
        if (this.responseSelectionMode) {
            this.handlePlayerResponse();
        }
        else if (this.player.isInDialogue) {
            this.displayNextChunk();
        }
    }

    handleEscapePress() {
        if (this.player.isInDialogue) {
            this.endConversation();
        }
    }

    handleUpPress() {
        if (this.responseSelectionMode) {
            if (this.selectedOption === 0) {
                return
            }
            this.selectedOption = (this.selectedOption - 1);
            this.content.text = this.getResponseOptionText();
        }
    }

    handleDownPress() {
        if (this.responseSelectionMode) {
            if (this.selectedOption === this.responseOptions.length - 1) {
                return
            }
            this.selectedOption = (this.selectedOption + 1);
            this.content.text = this.getResponseOptionText();
        }
    }

    endConversation() {
        if (this.dialogueBox) {
            destroy(this.dialogueBox);
            this.dialogueBox = null;
        }
        if (this.content) {
            this.content = null;
        }

        if (this.currentNpc && this.currentNpc.exists()) {
            this.currentNpc.isInDialogue = false;
        }

        this.currentNpc = null;
        this.player.isInDialogue = false;

        // Clean up event listeners.
        if (this.spaceListener) this.spaceListener.cancel();
        if (this.escapeListener) this.escapeListener.cancel();
        if (this.upListener) this.upListener.cancel();
        if (this.downListener) this.downListener.cancel();
        this.spaceListener = null;
        this.escapeListener = null;
        this.upListener = null;
        this.downListener = null;

        this.conversationHistory = [];
        this.dialogueQueue = [];
        this.totalChunks = 0;
        this.currentChunk = 0;
        this.endConversationAfterCurrentDialogue = false;
        this.responseOptions = null;
    }
}