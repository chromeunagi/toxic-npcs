import { createDialogueBox } from "../utils/ui.js"; // Assuming ui.js is in the same directory
import { getDialogueWithGemini } from "../utils/geminiApi.js"; // Assuming geminiApi.js is in the same directory

const CHUNK_SIZE = 200;

// Updated: Gemini will not provide responseOptions for this manager
const responseJsonFormat = `Please return your response in the following JSON format:
{{
    "text": "<Your response here>",
    "endConversation": <true if the conversation should end, false otherwise>
}}
`;

const systemPrompt = `You are helping me build dialogue for a top-down videogame. Respond only with the text that the NPC would say.`;

export class UnguidedConversationManager {
    constructor(player, commonOfficeKnowledge) {
        this.player = player;
        this.currentNpc = null;
        this.commonOfficeKnowledge = commonOfficeKnowledge; // Knowledge shared among all NPCs

        this.dialogueQueue = [];
        this.conversationHistory = []; // To keep track of the dialogue flow

        this.totalChunks = 0;
        this.currentChunk = 0;

        this.dialogueBox = null;
        this.content = null; // The text object within the dialogue box
        this.endConversationAfterCurrentDialogue = false;

        // HTML Input Elements (ensure these IDs match your index.html)
        this.inputUiContainer = document.getElementById("input-ui-container");
        this.playerInputField = document.getElementById("player-text-input");
        this.sendButton = document.getElementById("send-text-button");
        this.isPlayerTurnToInput = false;
        this.kaboomScale = 0.7;

        const kaboomInstance = typeof k !== 'undefined' ? k : (typeof kaboom !== 'undefined' ? kaboom : null);
        if (kaboomInstance && kaboomInstance.GAME_SCALE) { // Check if k.GAME_SCALE is available
            this.kaboomScale = kaboomInstance.GAME_SCALE;
        } else if (window.kaboom && window.kaboom.GAME_SCALE) {
            this.kaboomScale = window.kaboom.GAME_SCALE;
        } else {
            // Fallback if unable to get from Kaboom context directly
            // This assumes the scale set in main.js.
            // Consider making this a parameter to the constructor if it can vary.
            console.warn("UnguidedConversationManager: Could not automatically detect Kaboom scale. Using default:", this.kaboomScale);
        }

        // Store bound event handlers for easy removal
        this.boundSubmitPlayerInput = this.submitPlayerInput.bind(this);
        this.boundHandleInputKeydown = this.handleInputKeydown.bind(this);
        this.boundPositionInputBox = this.positionInputBox.bind(this); // For resize events

    }

    positionInputBox() {
        const canvas = document.querySelector("canvas"); // Kaboom usually creates one canvas
        if (!canvas || !this.inputUiContainer) {
            console.error("Canvas or Input UI container not found for positioning.");
            if (this.inputUiContainer) this.inputUiContainer.style.display = "none"; // Hide if error
            return;
        }

        const rect = canvas.getBoundingClientRect(); // Gets position and size relative to viewport

        // The Kaboom dialogue box is 200 game units high.
        // We want our HTML input to cover this height on the screen.
        const dialogueBoxHeightPx = 200 * this.kaboomScale;

        this.inputUiContainer.style.left = `${rect.left}px`;
        this.inputUiContainer.style.top = `${rect.bottom - dialogueBoxHeightPx}px`; // Position its top edge
        this.inputUiContainer.style.width = `${rect.width}px`;
        this.inputUiContainer.style.height = `${dialogueBoxHeightPx}px`;
        this.inputUiContainer.style.display = "flex";
    }

    chunkDialogue(dialogue) {
        const maxLen = CHUNK_SIZE;
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
        const npcName = this.npcName || (this.currentNpc ? this.currentNpc.npcName : "NPC");
        const npcBackstory = this.backstory || (this.currentNpc ? this.currentNpc.backstory : "An NPC.");
        const playerDialogueText = (this.player && this.player.dialogue) ? this.player.dialogue : "";
        let playerLineForPrompt = "";

        if (playerDialogueText) {
            playerLineForPrompt = `\n\nHere is the player's latest dialogue:\n${playerDialogueText}`;
        } else if (this.conversationHistory.length === 0) {
            playerLineForPrompt = "\n\nThe player is waiting for you to speak or has just approached you.";
        }

        const p = `For this exchange, you are playing the role of ${npcName}. Here is the backstory for this NPC: ${npcBackstory}.\nHere is some knowledge that's common to all characters in the game: ${this.commonOfficeKnowledge}.${playerLineForPrompt}`;
        var prompt = `${systemPrompt}\n\n${p}`;

        if (this.conversationHistory.length > 0) {
            var historyText = "";
            for (let i = 0; i < this.conversationHistory.length; i++) {
                const { speaker, text } = this.conversationHistory[i];
                const speakerText = `${speaker}: ${text}`;
                historyText += `${speakerText}\n`;
            }
            prompt += `\n\nHere is the conversation history (most recent last):\n${historyText}`;
        }
        prompt += `\n\n${responseJsonFormat}`;

        console.log("UnguidedConversationManager buildPrompt:", prompt);
        return prompt;
    }

    processLlmResponse(responseStr) {
        console.log("UnguidedConversationManager processLlmResponse:", responseStr);
        if (!this.currentNpc || !this.currentNpc.exists() || !this.player || !this.player.exists()) {
            console.error("UnguidedConversationManager: NPC or Player is undefined or does not exist. Ending conversation.");
            this.endConversation();
            return;
        }

        var response = null;
        var llmDialogue = null;
        try {
            response = JSON.parse(responseStr.replace("```json", "").replace("```", ""));
            llmDialogue = response.text;
        } catch (e) {
            console.error("UnguidedConversationManager: Failed to parse LLM response:", e, "Response string:", responseStr);
            this.dialogueQueue = this.chunkDialogue("I'm sorry, I had a bit of trouble understanding. Could you try saying that again?");
            this.totalChunks = this.dialogueQueue.length;
            this.currentChunk = 0;
            this.endConversationAfterCurrentDialogue = false; // Or true if you prefer
            if (!this.dialogueBox) { // Ensure dialogue box exists or create it
                const { dialogueBox, content } = createDialogueBox();
                this.dialogueBox = dialogueBox;
                this.content = content;
            }
            this.displayNextChunk();
            return;
        }

        llmDialogue = response.text || "I seem to be at a loss for words.";
        const npcNameForHistory = this.currentNpc.npcName || "NPC";
        this.conversationHistory.push({ speaker: npcNameForHistory, text: llmDialogue });
        this.endConversationAfterCurrentDialogue = response.endConversation || false;

        if (this.dialogueBox) {
            destroy(this.dialogueBox); // Recreate for fresh state if needed, or just update content
        }
        const { dialogueBox, content } = createDialogueBox();
        this.dialogueBox = dialogueBox;
        this.content = content;


        this.dialogueQueue = this.chunkDialogue(llmDialogue);
        this.totalChunks = this.dialogueQueue.length;
        this.currentChunk = 0;
        this.displayNextChunk();
    }

    async startConversation(npc) {
        if (!npc || !npc.exists() || !this.player || !this.player.exists()) {
            console.error("UnguidedConversationManager: Cannot start conversation - NPC or Player missing.");
            return;
        }

        console.log(`UnguidedConversationManager: Starting conversation with ${npc.npcName}`);
        this.player.isInDialogue = true;
        this.currentNpc = npc;
        this.npcName = npc.npcName; // Store for use in buildPrompt
        this.backstory = npc.backstory; // Store for use in buildPrompt
        this.conversationHistory = [];
        this.isPlayerTurnToInput = false;

        if (this.player) this.player.dialogue = ""; // Clear player's last utterance for the new conversation

        const prompt = this.buildPrompt();
        try {
            const responseStr = await getDialogueWithGemini(prompt);
            this.processLlmResponse(responseStr);

            // Setup Kaboom listeners
            if (this.spaceListener) this.spaceListener.cancel();
            this.spaceListener = onKeyPress("space", () => this.handleSpacePress());

            if (this.escapeListener) this.escapeListener.cancel();
            this.escapeListener = onKeyPress("escape", () => this.handleEscapePress());

            // Add listeners for HTML input
            this.sendButton.addEventListener("click", this.boundSubmitPlayerInput);
            this.playerInputField.addEventListener("keydown", this.boundHandleInputKeydown);

        } catch (error) {
            console.error("UnguidedConversationManager: Error in startConversation:", error);
            this.endConversation();
        }
    }

    showPlayerInput() {
        this.isPlayerTurnToInput = true;

        this.positionInputBox(); // Position it dynamically

        if (this.playerInputField) {
            this.playerInputField.value = "";
            this.playerInputField.focus();
        }

        if (this.dialogueBox && this.content) {
            this.content.text = ""; // Clear Kaboom dialogue text
        }

        if (this.spaceListener) {
            this.spaceListener.cancel();
        }
        // Add resize listener to reposition if window size changes
        window.addEventListener('resize', this.boundPositionInputBox);
    }

    hidePlayerInput() {
        this.isPlayerTurnToInput = false;
        if(this.inputUiContainer) {
            this.inputUiContainer.style.display = "none";
        }
        window.removeEventListener('resize', this.boundPositionInputBox);

        // Attempt to focus the Kaboom canvas
        const canvas = document.querySelector("canvas");
        if (canvas) {
            // To receive keyboard events, the canvas often needs a tabindex.
            // Kaboom might handle this, but setting it explicitly can help.
            if (!canvas.hasAttribute('tabindex')) {
                canvas.setAttribute('tabindex', '-1'); // -1 makes it focusable but not via Tab key
            }
            canvas.focus();
        }

        if (this.player && this.player.isInDialogue) {
            if (this.spaceListener) {
                this.spaceListener.cancel();
            }
            this.spaceListener = onKeyPress("space", () => this.handleSpacePress());
        }
    }


    handleInputKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent default form submission behavior
            this.submitPlayerInput();
        } else if (event.key === "Escape") {
            event.preventDefault(); // Prevent default form submission behavior
            this.endConversation();
        }
    }


    async submitPlayerInput() {
        if (!this.isPlayerTurnToInput || !this.playerInputField) return;

        const typedText = this.playerInputField.value.trim();
        this.hidePlayerInput();

        if (this.player && this.player.exists()) {
            this.player.dialogue = typedText; // Store typed text on player object
        } else {
            console.error("UnguidedConversationManager: Player missing in submitPlayerInput.");
            this.endConversation();
            return;
        }

        this.conversationHistory.push({ speaker: "Player", text: typedText });

        if (this.content) this.content.text = "You: " + (typedText || "...");
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause
        if (this.content) this.content.text = "Thinking...";

        const prompt = this.buildPrompt();
        try {
            const responseStr = await getDialogueWithGemini(prompt);
            this.processLlmResponse(responseStr);
        } catch (error) {
            console.error("UnguidedConversationManager: Error getting LLM response:", error);
            if (this.content) this.content.text = "There was an issue connecting.";
            setTimeout(() => this.endConversation(), 2000); // Auto-end after a bit
        }
    }

    displayNextChunk() {
        if (!this.dialogueBox || !this.content) {
            if (this.endConversationAfterCurrentDialogue) {
                this.endConversation();
            } else if (this.player && this.player.isInDialogue) {
                this.showPlayerInput(); // Assume player's turn if NPC is done
            }
            return;
        }

        if (this.currentChunk < this.totalChunks) {
            let chunkText = `(${this.currentChunk + 1}/${this.totalChunks}) ${this.dialogueQueue[this.currentChunk]}`;
            if (this.currentChunk < this.totalChunks - 1) {
                chunkText += " ...";
            }
            this.content.text = chunkText;
            this.currentChunk++;
            this.isPlayerTurnToInput = false; // NPC is speaking
        } else if (this.endConversationAfterCurrentDialogue) {
            this.endConversation();
        } else {
            // NPC has finished all chunks, not ending conversation -> player's turn
            this.showPlayerInput();
        }
    }

    handleSpacePress() {
        if (this.isPlayerTurnToInput) return; // Do nothing if player is typing

        if (this.player && this.player.isInDialogue) {
            this.displayNextChunk(); // Advances NPC dialogue or triggers player input
        }
    }

    handleEscapePress() {
        if (this.player && this.player.isInDialogue) {
            this.endConversation();
        }
    }

    endConversation() {
        this.hidePlayerInput();

        if (this.dialogueBox) {
            destroy(this.dialogueBox);
            this.dialogueBox = null;
        }
        this.content = null;

        if (this.currentNpc && this.currentNpc.exists()) {
            this.currentNpc.isInDialogue = false;
        }
        this.currentNpc = null;
        if (this.player && this.player.exists()) {
            this.player.isInDialogue = false;
        }

        // Clean up HTML event listeners
        if (this.sendButton) this.sendButton.removeEventListener("click", this.boundSubmitPlayerInput);
        if (this.playerInputField) this.playerInputField.removeEventListener("keydown", this.boundHandleInputKeydown);

        // Clean up Kaboom event listeners
        if (this.spaceListener) this.spaceListener.cancel(); this.spaceListener = null;
        if (this.escapeListener) this.escapeListener.cancel(); this.escapeListener = null;

        this.conversationHistory = [];
        this.dialogueQueue = [];
        this.totalChunks = 0;
        this.currentChunk = 0;
        this.endConversationAfterCurrentDialogue = false;
        this.isPlayerTurnToInput = false;
    }
}