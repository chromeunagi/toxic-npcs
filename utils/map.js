
import { makeTile } from "../utils/utils.js";

export function initializeMap() {
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