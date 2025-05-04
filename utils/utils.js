export function makeTile(type) {
  return [sprite("tile"), { type }];
}

export function flashScreen() {
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

export function onCollideWithPlayer(enemyName, player, worldState) {
  player.onCollide(enemyName, () => {
    flashScreen();
    setTimeout(() => {
      worldState.playerPos = player.pos;
      worldState.enemyName = enemyName;
      go("battle", worldState);
    }, 1000);
  });
}