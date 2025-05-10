import { makeTile } from "../utils/utils.js";
import { ConversationManager } from "../utils/conversationManager.js";

const npcData = {
  "bernice": {
    initialXPos: 600,
    initialYPos: 600,
    spriteName: "bernice-down-idle",
    moveSpeed: 40,
    facing: 'down',
    isInDialogue: false,
    npcName: "Bernice",
    backstory: "Bernice is a 41 year old woman from Atlanta, Georgia. She is a single mother of 3 children and works as a waitress at a local diner. She is very friendly and always has a smile on her face. She is also very protective of her children and will do anything to keep them safe.",
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
    backstory: "Kevin is a freshly-minted senior software engineer at a FAANG-like company. This is his entire personality and it can be very grating and annoying. He is very proud of his job and loves to talk about it.",
    idleSprites: { 'down': 'kevin-down-idle', 'up': 'kevin-up-idle', 'left': 'kevin-left-idle', 'right': 'kevin-right-idle' },
    runSprites: { 'down': 'kevin-down-run', 'up': 'kevin-up-run', 'left': 'kevin-left-run', 'right': 'kevin-right-run' },
  }
};

export function setWorld(worldState) {
  initializeMap();
  const player = initializePlayer(worldState);
  const conversationManager = new ConversationManager(player);

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
    if (rand() < 0.8 && npc.state === 'idle') {
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
      shape: new Rect(vec2(0), 16, 28),
      offset: vec2(0, 6),
    }),
    body(),
    "player",
    {
      facing: "down",
      currentSprite: "bob-down-idle",
      speed: 300,
      isInDialogue: false,
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
    }
  }

  onKeyDown("s", () => {
    if (player.isInDialogue) return;
    player.facing = "down";
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-down-run");
      player.play("run");
    }
    player.move(0, player.speed);
  });

  onKeyDown("w", () => {
    if (player.isInDialogue) return;
    player.facing = "up";
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-up-run");
      player.play("run");
    }
    player.move(0, -player.speed);

  });

  onKeyDown("a", () => {
    if (player.isInDialogue) return;
    player.facing = "left";
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-left-run");
      player.play("run");
    }
    player.move(-player.speed, 0);
  });

  onKeyDown("d", () => {
    if (player.isInDialogue) return;
    player.facing = "right";
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-right-run");
      player.play("run");
    }
    player.move(player.speed, 0);
  });

  onKeyRelease("s", () => {
    player.stop();
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-down-idle");
      player.play("idle");
    }
  });

  onKeyRelease("w", () => {
    player.stop();
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-up-idle");
      player.play("idle");
    }
  });

  onKeyRelease("a", () => {
    player.stop();
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-left-idle");
      player.play("idle");
    }
  });

  onKeyRelease("d", () => {
    player.stop();
    if (player.curAnim() !== "run") {
      setSprite(player, "bob-right-idle");
      player.play("idle");
    }
  });

  let tick = 0;
  onUpdate(() => {
    camPos(player.pos);
    tick++;
  });

  return player;
}

function initializeNpc(npcName, npcData) {
  const npc = add([
    sprite(npcData.spriteName),
    scale(4),
    pos(npcData["initialXPos"], npcData["initialYPos"]),
    area(),
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
    if (npc.state === "moving" && npc.moveDirection) {
      npc.move(npc.moveDirection.scale(npc.moveSpeed));
    }
  });
  return npc;
}

function initializeMap() {
  const map = [
    addLevel(
      [
        "                 ",
        " cdddddddddddde  ",
        " 30000000000002  ",
        " 30000000000002  ",
        " 30000000000002  ",
        " 30030000008889  ",
        " 30030000024445  ",
        " 300a8888897777  ",
        " 30064444457777  ",
        " 30000000000000  ",
        " 30000000021111  ",
        " 3000000002      ",
        " 1111111111      ",
        "      b          ",
        "     b      b    ",
        " b             b ",
      ],
      {
        tileWidth: 16,
        tileHeight: 16,
        tiles: {
          0: () => makeTile("grass-m"),
          1: () => makeTile("grass-water"),
          2: () => makeTile("grass-r"),
          3: () => makeTile("grass-l"),
          4: () => makeTile("ground-m"),
          5: () => makeTile("ground-r"),
          6: () => makeTile("ground-l"),
          7: () => makeTile("sand-1"),
          8: () => makeTile("grass-mb"),
          9: () => makeTile("grass-br"),
          a: () => makeTile("grass-bl"),
          b: () => makeTile("rock-water"),
          c: () => makeTile("grass-tl"),
          d: () => makeTile("grass-tm"),
          e: () => makeTile("grass-tr"),
        },
      }
    ),
    addLevel(
      [
        "      12       ",
        "      34       ",
        " 000    00  12 ",
        " 00   00    34 ",
        " 0    0        ",
        "      0  0     ",
        "           5   ",
        "           6   ",
        "     5         ",
        "     6   0     ",
        "               ",
        "               ",
        "               ",
      ],
      {
        tileWidth: 16,
        tileHeight: 16,
        tiles: {
          0: () => makeTile(),
          1: () => makeTile("bigtree-pt1"),
          2: () => makeTile("bigtree-pt2"),
          3: () => makeTile("bigtree-pt3"),
          4: () => makeTile("bigtree-pt4"),
          5: () => makeTile("tree-t"),
          6: () => makeTile("tree-b"),
        },
      }
    ),
    addLevel(
      [
        " 00000000000000 ",
        "0     11       0",
        "0           11 0",
        "0           11 0",
        "0              0",
        "0   2          0",
        "0   2      3333 ",
        "0   2      0   0",
        "0   3333333    0",
        "0    0         0",
        "0          0000 ",
        "0          0    ",
        " 0000000000     ",
        "                ",
      ],
      {
        tileWidth: 16,
        tileHeight: 16,
        tiles: {
          0: () => [
            area({ shape: new Rect(vec2(0), 16, 16) }),
            body({ isStatic: true }),
          ],
          1: () => [
            area({
              shape: new Rect(vec2(0), 8, 8),
              offset: vec2(4, 4),
            }),
            body({ isStatic: true }),
          ],
          2: () => [
            area({ shape: new Rect(vec2(0), 2, 16) }),
            body({ isStatic: true }),
          ],
          3: () => [
            area({
              shape: new Rect(vec2(0), 16, 20),
              offset: vec2(0, -4),
            }),
            body({ isStatic: true }),
          ],
        },
      }
    ),
  ];

  for (const layer of map) {
    layer.use(scale(4));
    for (const tile of layer.children) {
      if (tile.type) {
        tile.play(tile.type);
      }
    }
  }
}

function wander(npc) {
  if (npc.state !== "idle") return;

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
  if (player.isInDialogue || npc.state !== 'idle') return;

  // Stop NPC's current/pending movement
  if (npc.moveTimer) {
    npc.moveTimer.cancel(); // Cancel the timer that stops movement
    npc.moveTimer = null;
  }
  npc.enterState("idle"); // Ensure state is idle
  npc.moveDirection = null;
  npc.stop();

  // Set idle sprite based on last facing direction and start animation.
  var newDir = "";
  if (player.facing === 'left') {
    newDir = 'right';
  }
  if (player.facing === 'right') {
    newDir = 'left';
  }
  if (player.facing === 'up') {
    newDir = 'down';
  }
  if (player.facing === 'down') {
    newDir = 'up';
  }
  npc.facing = newDir;
  const newSprite =  npc.idleSprites[npc.facing];
  npc.use(sprite(newSprite));
  npc.play("idle");

  npc.isInDialogue = true;

  conversationManager.startConversation(npc)
    .catch(err => console.error("Conversation error:", err))
    .finally(() => {
      if (npc.exists()) {
        npc.isInDialogue = false;
      }
    });
}