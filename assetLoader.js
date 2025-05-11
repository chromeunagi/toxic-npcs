const PEOPLE = ["bob", "kevin", "bernice", "chris", "bruce"]

export function loadAssets() {

  for (const person of PEOPLE) {
    loadIdleSpriteAtlas(`./assets/people/${person}/idle.png`, person, 0, 0);
    loadRunSpriteAtlas(`./assets/people/${person}/run.png`, person, 0, 0);
  }

  loadSprite("battle-background", "./assets/battleBackground.png");
  loadSpriteAtlas("./assets/tiles.png", {
    tile: {
      x: 0,
      y: 0,
      width: 128,
      height: 128,
      sliceX: 8,
      sliceY: 8,
      anims: {
        "bigtree-pt1": 1,
        "bigtree-pt2": 2,
        "bigtree-pt3": 9,
        "bigtree-pt4": 10,
        "grass-m": 14,
        "grass-tl": 17,
        "grass-tm": 18,
        "grass-tr": 19,
        "grass-l": 25,
        "grass-r": 27,
        "grass-bl": 33,
        "grass-mb": 34,
        "grass-br": 35,
        "tree-t": 4,
        "tree-b": 12,
        "grass-water": 20,
        "sand-1": 6,
        "ground-l": 41,
        "ground-m": 42,
        "ground-r": 43,
        "rock-water": 60,
      },
    },
  });
}
function loadIdleSpriteAtlas(path, prefix, startX = 0, startY = 0) {
  loadSpriteAtlas(path, {
    [`${prefix}-right-idle`]: {
      x: startX,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 5, loop: true, speed: 3 },
      },
    },
    [`${prefix}-up-idle`]: {
      x: startX + 96,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 5, loop: true, speed: 3 },
      },
    },
    [`${prefix}-left-idle`]: {
      x: startX + 192,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 5, loop: true, speed: 3 },
      },
    },
    [`${prefix}-down-idle`]: {
      x: startX + 288,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        idle: { from: 0, to: 5, loop: true, speed: 3 },
      },
    },
  });
}

function loadRunSpriteAtlas(path, prefix, startX = 0, startY = 0) {
  loadSpriteAtlas(path, {
    [`${prefix}-right-run`]: {
      x: startX,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        run: { from: 0, to: 5, loop: true, speed: 10 },
      },
    },
    [`${prefix}-up-run`]: {
      x: startX + 96,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        run: { from: 0, to: 5, loop: true, speed: 10 },
      },
    },
    [`${prefix}-left-run`]: {
      x: startX + 192,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        run: { from: 0, to: 5, loop: true, speed: 10 },
      },
    },
    [`${prefix}-down-run`]: {
      x: startX + 288,
      y: startY,
      width: 96,
      height: 32,
      sliceX: 6,
      sliceY: 1,
      anims: {
        run: { from: 0, to: 5, loop: true, speed: 10 },
      },
    },
  });
}