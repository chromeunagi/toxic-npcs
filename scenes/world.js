import { ConversationManager } from "../utils/conversationManager.js";
import { initializeMap } from "../utils/map.js";

const commonOfficeKnowledge = `Bernice, Kevin, and Bruce are all employees at Moogflix, a FAANG-like company. They work on scaling some dashboard for telemetry data.

They are all in the same office, but they have different roles and personalities.

Bruce is an intern. He's struggling to ramp up.
Kevin is Bruce's intern host.
Bernice is the manager of the team.
`;

const npcData = {
  "bernice": {
    initialXPos: 600,
    initialYPos: 600,
    spriteName: "bernice-down-idle",
    moveSpeed: 40,
    facing: 'down',
    isInDialogue: false,
    npcName: "Bernice",
    backstory: "Bernice is an absentee manager at a FAANG-like company. She's a slacker, super untechnical (and unaware), and is a total people-pleaser. She is a dangerous combination of machiavellian and incompetent. She is a total slacker and is very untechnical.",
    idleSprites: { 'down': 'bernice-down-idle', 'up': 'bernice-up-idle', 'left': 'bernice-left-idle', 'right': 'bernice-right-idle' },
    runSprites: { 'down': 'bernice-down-run', 'up': 'bernice-up-run', 'left': 'bernice-left-run', 'right': 'bernice-right-run' },
  },
  "kevin": {
    initialXPos: 600,
    initialYPos: 200,
    spriteName: "kevin-down-idle",
    moveSpeed: 40,
    facing: 'down',
    isInDialogue: false,
    npcName: "Kevin",
    backstory: "Kevin is a freshly-minted senior software engineer at a FAANG-like company. This is his entire personality and it can be very grating and annoying. He is very proud of his job and loves to talk about it. He's also secretly very insecure and has a major crush on Bernice.",
    idleSprites: { 'down': 'kevin-down-idle', 'up': 'kevin-up-idle', 'left': 'kevin-left-idle', 'right': 'kevin-right-idle' },
    runSprites: { 'down': 'kevin-down-run', 'up': 'kevin-up-run', 'left': 'kevin-left-run', 'right': 'kevin-right-run' },
  },
  "bruce": {
    initialXPos: 400,
    initialYPos: 200,
    spriteName: "bruce-down-idle",
    moveSpeed: 40,
    facing: 'down',
    isInDialogue: false,
    npcName: "Bruce",
    backstory: "Bruce is a 19 year old CS student from Berkeley, California. He completely, hopelessly incompetent, and despises his intern host, Kevin, who is a complete know-it-all and micromanager.",
    idleSprites: { 'down': 'bruce-down-idle', 'up': 'bruce-up-idle', 'left': 'bruce-left-idle', 'right': 'bruce-right-idle' },
    runSprites: { 'down': 'bruce-down-run', 'up': 'bruce-up-run', 'left': 'bruce-left-run', 'right': 'bruce-right-run' },
  }
};

export function setWorld(worldState) {
  initializeMap();
  const player = initializePlayer(worldState);
  const conversationManager = new ConversationManager(player, commonOfficeKnowledge);

  // Initialize all NPCs
  for (const npcName of Object.keys(npcData)) {
    console.log(`Initializing NPC=${npcName}, npcData=${JSON.stringify(npcData[npcName])}`);
    const npc = initializeNpc(npcName, npcData[npcName]);

    // Set up collision detection for NPCs.
    onCollide("player", npcName, (p, actualNpcCollided) => {
      if (actualNpcCollided.npcName) {
        startNpcConversation(actualNpcCollided, player, conversationManager);
      }
    });

    // Trigger occasional wandering.
    setupNpcWalkingTask(npc);
  }
}

function setupNpcWalkingTask(npc) {
  loop(rand(5, 10), () => {
    // Don't wander if in dialogue
    if (npc.isInDialogue) return;

    // If the NPC is not already moving, randomly decide to wander.
    if (rand() < 0.2 && npc.state === 'idle') {
      wander(npc);
    }
  });
}

function initializePlayer(worldState) {
  const player = add([
    sprite("bob-down-idle"),
    pos(150, 200),
    scale(4),
    area({
      shape: new Rect(vec2(0), 16, 22),
      offset: vec2(0, 10),
    }),
    body(),
    "player",
    {
      facing: "down",
      currentSprite: "bob-down-idle",
      speed: 300,
      isInDialogue: false,
      activeMovementKeys: [],
    },
  ]);
  player.play("idle");

  if (!worldState) {
    worldState = {
      playerPos: player.pos,
      faintedMons: [],
    };
  }

  function setSprite(player, spriteName) {
    if (player.currentSprite !== spriteName) {
      player.use(sprite(spriteName));
      player.currentSprite = spriteName;
      return true;
    }
    return false;
  }

  const movementKeys = ["w", "a", "s", "d"];

  for (const key of movementKeys) {
    onKeyDown(key, () => {
      // When a movement key is pressed:
      // 1. Remove it from its current position in activeMovementKeys (if it's there).
      // 2. Add it to the end of activeMovementKeys, marking it as the most recent.
      const index = player.activeMovementKeys.indexOf(key);
      if (index > -1) {
        player.activeMovementKeys.splice(index, 1);
      }
      player.activeMovementKeys.push(key);
    });

    onKeyRelease(key, () => {
      // When a movement key is released, remove it from activeMovementKeys.
      const index = player.activeMovementKeys.indexOf(key);
      if (index > -1) {
        player.activeMovementKeys.splice(index, 1);
      }
    });
  }

  player.onUpdate(() => {
    if (player.isInDialogue) {
      const idleSpriteNameWhenInDialogue = `bob-${player.facing}-idle`;
      const spriteChangedForDialogue = setSprite(player, idleSpriteNameWhenInDialogue);

      if (spriteChangedForDialogue || player.curAnim() !== "idle") {
        player.play("idle");
      }
      // Clear active movement keys when in dialogue.
      player.activeMovementKeys = [];
      return;
    }

    if (player.activeMovementKeys.length > 0) {
      // Get the most recently pressed key that is still held down
      const currentKey = player.activeMovementKeys[player.activeMovementKeys.length - 1];

      let moveX = 0;
      let moveY = 0;
      let targetFacing = player.facing; // Default to current facing

      switch (currentKey) {
        case "w":
          moveY = -player.speed;
          targetFacing = "up";
          break;
        case "s":
          moveY = player.speed;
          targetFacing = "down";
          break;
        case "a":
          moveX = -player.speed;
          targetFacing = "left";
          break;
        case "d":
          moveX = player.speed;
          targetFacing = "right";
          break;
      }

      player.facing = targetFacing;
      const runSpriteName = `bob-${player.facing}-run`;
      const spriteWasChanged = setSprite(player, runSpriteName);

      if (spriteWasChanged || player.curAnim() !== "run") {
        player.play("run");
      }

      //setSprite(player, runSpriteName);
      player.move(moveX, moveY);
    } else {
      // No movement keys are active, and not in dialogue. Ensure player is idle.
      if (player.curAnim() !== "idle") {
        const idleSpriteName = `bob-${player.facing}-idle`;
        setSprite(player, idleSpriteName);
        player.play("idle");
      }
    }
  });

  onUpdate(() => {
    camPos(player.pos);
  });

  return player;
}

function initializeNpc(npcName, npcData) {
  const npc = add([
    sprite(npcData.spriteName),
    scale(4),
    pos(npcData["initialXPos"], npcData["initialYPos"]),
    area({
      shape: new Rect(vec2(0), 16, 22),
      offset: vec2(0, 10),
    }),
    body(),
    state("idle", ["idle", "moving"]),
    npcName,
    "walker",
    {
      spriteName: npcData.spriteName,
      moveSpeed: npcData.moveSpeed,
      facing: npcData.facing,
      isInDialogue: npcData.isInDialogue,
      npcName: npcName,
      backstory: npcData.backstory,
      idleSprites: npcData.idleSprites,
      runSprites: npcData.runSprites,
    }
  ]);

  // Trigger idle animation after waiting to avoid all NPCs being idle at the same time.
  wait(rand(0, 1), () => {
    npc.use(sprite(npc.idleSprites[npc.facing]));
    npc.play("idle");
  });

  onUpdate(npcName, (npc) => {
    if (npc.isInDialogue) {
      if (npc.state === "moving" || (npc.moveDirection && (npc.moveDirection.x !== 0 || npc.moveDirection.y !== 0))) {
        npc.stop(); // Stop current Kaboom animation
        npc.use(sprite(npc.idleSprites[npc.facing])); // Ensure correct idle sprite
        npc.play("idle");
        npc.enterState("idle"); // Ensure state machine is idle
        npc.moveDirection = null; // Clear any movement intention
      }
      return;
    }


    if (npc.state === "moving" && npc.moveDirection) {
      npc.move(npc.moveDirection.scale(npc.moveSpeed));
    }
  });
  return npc;
}


function wander(npc) {
  if (npc.state !== "idle") return;
  if (npc.isInDialogue) return;

  console.log(`${npc.npcName} entering 'moving' state (logic only)`);
  npc.enterState("moving");

  const directions = [
    { dir: vec2(0, 1), facing: 'down' },  // Down
    { dir: vec2(0, -1), facing: 'up' },    // Up
    { dir: vec2(-1, 0), facing: 'left' },  // Left
    { dir: vec2(1, 0), facing: 'right' }   // Right
  ];

  const choice = choose(directions);
  const moveDuration = rand(0.8, 2.0);

  npc.facing = choice.facing; // Store the facing direction
  npc.moveDirection = choice.dir; // Store the direction vector

  // Update sprite and animation
  console.log(`Wandering NPC: ${npc.spriteName} facing ${npc.facing}`);

  npc.use(sprite(npc.runSprites[npc.facing])); // Use running sprite
  npc.play("run");

  // Set a timer to stop moving
  npc.moveTimer = wait(moveDuration, () => {
    if (npc.state === "moving") { // Check if still in moving state
      npc.stop(); // Stop animation

      npc.use(sprite(npc.idleSprites[npc.facing])); // Use idle sprite
      npc.play("idle"); // Play idle animation

      npc.enterState("idle");
      npc.moveDirection = null;
      npc.moveTimer = null;
    }
  });

}

// Function to handle starting dialogue, stopping movement
//
// TODO: Make player not be able to change directions while in dialogue.
function startNpcConversation(npc, player, conversationManager) {
  // Return immediately if player is in dialogue or NPC is not idle.
  if (player.isInDialogue || npc.isInDialogue || npc.state !== 'idle') {
    console.log("Player or NPC is already in dialogue or NPC is not idle.");
    return;
  }

  var playerNewSprite = player.curAnim();
  if (player.facing === 'left') playerNewSprite = 'bob-left-idle';
  if (player.facing === 'right') playerNewSprite = 'bob-right-idle';
  if (player.facing === 'up') playerNewSprite = 'bob-up-idle';
  if (player.facing === 'down') playerNewSprite = 'bob-down-idle';
  player.use(sprite(playerNewSprite));
  player.play("idle");
  player.use(sprite(playerNewSprite));
  player.play("idle");

  // Stop NPC's current/pending movement
  if (npc.moveTimer) {
    npc.moveTimer.cancel(); // Cancel the timer that stops movement
    npc.moveTimer = null;
  }
  npc.enterState("idle"); // Ensure state is idle
  npc.moveDirection = null;
  npc.stop();

  // Set idle sprite based on last facing direction and start animation.
  var npcNewFacing = "";
  if (player.facing === 'left') npcNewFacing = 'right';
  else if (player.facing === 'right') npcNewFacing = 'left';
  else if (player.facing === 'up') npcNewFacing = 'down';
  else if (player.facing === 'down') npcNewFacing = 'up';
  npc.facing = npcNewFacing;
  npc.facing = npcNewFacing;

  if (npc.moveTimer) {
    npc.moveTimer.cancel();
    npc.moveTimer = null;
  }
  npc.stop();
  npc.use(sprite(npc.idleSprites[npc.facing]));
  npc.play("idle");

  npc.isInDialogue = true;
  player.isInDialogue = true;

  conversationManager.startConversation(npc)
    .catch((error) => {
      console.error("Error starting conversation:", error);
      if (npc.exists()) {
        npc.isInDialogue = false;
      }
      if (player.exists()) {
        player.isInDialogue = false;
      }
    })
}