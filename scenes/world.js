import { Conversation, } from "../utils/conversation.js";
import { getDialogueWithGemini} from "../utils/geminiApi.js";
import { makeTile, flashScreen, onCollideWithPlayer } from "../utils/utils.js";
import { ConversationManager } from "../utils/conversationManager.js";
import { createDialogueBox } from "../utils/ui.js";

export function setWorld(worldState) {
  initializeMap();
  const player = initializeNPCsAndPlayer(worldState);

  // Create a single instance of ConversationManager
  const conversationManager = new ConversationManager(player);

  // NPC 1 Dialogue
  player.onCollide("npc1", () => {
    conversationManager.startConversation(
      "Miranda",
      "Miranda is a 22-year-old gang leader from South Central Los Angeles who uses gangster slang and lots of politically incorrect swear words. The player is being nudged to beat up monsters for the gang."
    );
  });

  // NPC 2 Dialogue
  player.onCollide("npc2", () => {
    conversationManager.startConversation(
      "Dorothy",
      "Dorothy is a 37 year old disney adult. She is obsessed with Disney and has a lot of Disney memorabilia. She is very friendly and loves to talk about her favorite Disney movies. Also, morbidly obese. Gets really mean when she finds out you're also not a giant disney fan. Talks about being a 'plus sized park hopper'. The player is being nudged to collect Disney memorabilia."
    );
  });
}

function initializeNPCsAndPlayer(worldState) {
  add([
    sprite("mini-mons"),
    area(),
    body({ isStatic: true }),
    pos(100, 700),
    scale(4),
    "cat",
  ]);

  const spiderMon = add([
    sprite("mini-mons"),
    area(),
    body({ isStatic: true }),
    pos(400, 300),
    scale(4),
    "spider",
  ]);
  spiderMon.play("spider");
  spiderMon.flipX = true;

  const centipedeMon = add([
    sprite("mini-mons"),
    area(),
    body({ isStatic: true }),
    pos(100, 100),
    scale(4),
    "centipede",
  ]);
  centipedeMon.play("centipede");

  const grassMon = add([
    sprite("mini-mons"),
    area(),
    body({ isStatic: true }),
    pos(900, 570),
    scale(4),
    "grass",
  ]);
  grassMon.play("grass");

  add([
    sprite("shawn"),
    scale(4),
    pos(600, 700),
    area(),
    body({ isStatic: true }),
    "npc1",
    scale(1),
  ]);


  add([
    sprite("fatslim"),
    scale(4),
    pos(600, 600),
    area(),
    body({ isStatic: true }),
    "npc2",
    scale(1),
  ]);

  const player = add([
    sprite("player-down"),
    pos(500, 700),
    scale(4),
    area(),
    body(),
    {
      currentSprite: "player-down",
      speed: 300,
      isInDialogue: false,
    },
  ]);

  if (!worldState) {
    worldState = {
      playerPos: player.pos,
      faintedMons: [],
    };
  }

  let tick = 0;
  onUpdate(() => {
    camPos(player.pos);
    tick++;
    if (
      (isKeyDown("down") || isKeyDown("up")) &&
      tick % 20 === 0 &&
      !player.isInDialogue
    ) {
      player.flipX = !player.flipX;
    }
  });

  function setSprite(player, spriteName) {
    if (player.currentSprite !== spriteName) {
      player.use(sprite(spriteName));
      player.currentSprite = spriteName;
    }
  }

  onKeyDown("s", () => {
    if (player.isInDialogue) return;
    setSprite(player, "player-down");
    player.move(0, player.speed);
  });

  onKeyDown("w", () => {
    if (player.isInDialogue) return;
    setSprite(player, "player-up");
    player.move(0, -player.speed);
  });

  onKeyDown("a", () => {
    if (player.isInDialogue) return;
    player.flipX = false;
    if (player.curAnim() !== "walk") {
      setSprite(player, "player-side");
      player.play("walk");
    }
    player.move(-player.speed, 0);
  });

  onKeyDown("d", () => {
    if (player.isInDialogue) return;
    player.flipX = true;
    if (player.curAnim() !== "walk") {
      setSprite(player, "player-side");
      player.play("walk");
    }
    player.move(player.speed, 0);
  });

  onKeyRelease("left", () => {
    player.stop();
  });

  onKeyRelease("right", () => {
    player.stop();
  });


  player.pos = vec2(worldState.playerPos);
  for (const faintedMon of worldState.faintedMons) {
    destroy(get(faintedMon)[0]);
  }

  function flashScreen() {
    const flash = add([
      rect(1280, 720),
      color(10, 10, 10),
      fixed(),
      opacity(0),
    ]);
    tween(
      flash.opacity,
      1,
      0.5,
      (val) => (flash.opacity = val),
      easings.easeInBounce
    );
  }

  function onCollideWithPlayer(enemyName, player, worldState) {
    player.onCollide(enemyName, () => {
      flashScreen();
      setTimeout(() => {
        worldState.playerPos = player.pos;
        worldState.enemyName = enemyName;
        go("battle", worldState);
      }, 1000);
    });
  }

  onCollideWithPlayer("cat", player, worldState);
  onCollideWithPlayer("spider", player, worldState);
  onCollideWithPlayer("centipede", player, worldState);
  onCollideWithPlayer("grass", player, worldState);

  return player;
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
