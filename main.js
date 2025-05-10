import { loadAssets } from "./assetLoader.js"; // Import loadAssets
import { setWorld } from "./scenes/world.js";

kaboom({
  width: 1280,
  height: 720,
  scale: 0.7,
  debug: true,
});

setBackground(Color.fromHex("#36A6E0"));

loadAssets(); // Call the imported function

scene("world", (worldState) => setWorld(worldState));
scene("battle", (worldState) => setBattle(worldState));

go("world");
