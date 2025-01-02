/* Maze Generation Module */

import * as server from "@minecraft/server"
import { BBox, bbox, Vec3, vec3, clamp } from "./math"

/*
 *
 * Exported Types
 * 
 */

/**
 * Options for maze generation.
 * 
 * @property wallType The type of walls used in the maze.
 * @property towerDifficulty The difficulty level of towers in the maze.
 * @property lootQuality The quality of loot available in the maze.
 * @property waterZone If the zone exists or not.
 */
export type MazeGenOptions = {
    wallType?: string,
    towerDifficulty?: string,
    lootQuality?: string,
    waterZone?: string,
    mazeSize?: number,
    playerCount?: number,
};

/*
 *
 * Maze Generation
 * 
 */

/** The dimension of the maze (overworld). */
let dim = server.world.getDimension("overworld");

/** List of all the placed current towers, as bounding boxes */
let CURRENT_TOWERS: BBox[] = [

]

/**
 *  Resets the CURRENT_TOWERS array.
 */
function clearCurrentTowersArray(): void {
    CURRENT_TOWERS = [

    ]
}

/** Object containing lists of all current chests in the maze, separated by type. */
let CURRENT_CHESTS = {
    MAZE_CHESTS: [

    ],
    SMALL_TOWER_CHESTS: [

    ],
    LARGE_TOWER_CHESTS: [

    ]
};

/** Object containing lists of all current world towers, separated by type. */
let WORLD_TOWERS = {
    small: {
        easy: [],
        hard: [],
        both: []
    },
    large: [],
    spawn: [

    ]
};

/** List of all curent world spawns. */
export let WORLD_SPAWNS = [

];

/** Origin of the maze in the world. */
let origin = vec3(0, 16, 0);

/** Dimensions of the in-game small towers. */
let smallTowerDimensions = { x: 11, y: 26, z: 11 };
/** Dimensions of the in-game large towers. */
let largeTowerDimensions = { x: 31, y: 36, z: 31 };
/** Dimensions of the in-game spawn. */
let spawnDimensions = { x: 4, y: 12, z: 5 };

/** The minimum separation between walls & other walls of the towers. (Will be a setting in the future) */
let minSeparation: number = 9;
/** The minimum separation between spawns. (Will be a setting in the future) */
let spawnSeparation: number = 20;

/** The minimum size of the maze. */
export let minMazeSize: number = 29;
/** The maximum size of the maze. */
export let maxMazeSize: number = 199;

/** The player count. */
export let playerCount: number = 2;

/** Blocks colored by their Nanont */
const NANONT_BLOCKS: string[][] = [
    ["minecraft:red_concrete", "minecraft:orange_concrete", "minecraft:yellow_concrete"],
    ["minecraft:purple_concrete", "minecraft:white_concrete", "minecraft:lime_concrete"],
    ["minecraft:blue_concrete", "minecraft:cyan_concrete", "minecraft:green_concrete"]
]

/**
 *  Resets the CURRENT_CHESTS object.
 */
function clearChestsArray(): void {
    CURRENT_CHESTS = {
        MAZE_CHESTS: [

        ],
        SMALL_TOWER_CHESTS: [

        ],
        LARGE_TOWER_CHESTS: [

        ]
    };
}

/** 
 * Resets the WORLD_TOWERS object.
 */
function clearStructures(): void {
    WORLD_TOWERS = {
        small: {
            easy: [],
            hard: [],
            both: []
        },
        large: [],
        spawn: [

        ]
    };
}

/** 
 * Resets the WORLD_SPAWNS object.
 */
function clearSpawns(): void {
    WORLD_SPAWNS = [

    ];
}

/** 
 * Loads structures from the world data.
 */
function loadStructures(): void {
    clearStructures();

    // console.warn(`Loading towers...`)
    for (const structure of server.world.structureManager.getWorldStructureIds()) {
        if (structure.split(`:`)[0] == "temp") continue;
        let structureSize = server.world.structureManager.get(structure).size;
        if (structureSize.x == smallTowerDimensions.x && structureSize.y == smallTowerDimensions.y && structureSize.z == smallTowerDimensions.z) {
            // check for easy and hard
            if (structure.split(`:`)[0] == "easy") {
                WORLD_TOWERS.small.easy.push(structure);
            } else if (structure.split(`:`)[0] == "hard") {
                WORLD_TOWERS.small.hard.push(structure);
            }
            WORLD_TOWERS.small.both.push(structure);
        } else if (structureSize.x == largeTowerDimensions.x && structureSize.y == largeTowerDimensions.y && structureSize.z == largeTowerDimensions.z) {
            WORLD_TOWERS.large.push(structure);
        } else if (structureSize.x == spawnDimensions.x && structureSize.y == spawnDimensions.y && structureSize.z == spawnDimensions.z) {
            WORLD_TOWERS.spawn.push(structure);
        }
    }
}

/** 
 * Deletes all blocks within the maze size given. (Very unoptimized, can be fixed to find where towers are?)
 * 
 * @param size The size of the cleared area. (Defaulted to 191)
 */
function clearMaze(size: number = maxMazeSize): void {
    clearChests();
    clearChestsArray();
    clearCurrentTowersArray();

    let halfSize = Math.floor(size / 2);
    for (let x = 0; x < size / 16; x++) {
        for (let z = 0; z < size / 16; z++) {
            let corner1 = vec3(origin.x + (x - halfSize) + (x * 16), origin.y - 9, origin.z + (z - halfSize) + (z * 16));
            let corner2 = vec3(origin.x + (x - halfSize) + (x * 16) + 16, origin.y + largeTowerDimensions.y - 9, origin.z + (z - halfSize) + (z * 16) + 16);
            dim.runCommand(`fill ${corner1.toLocStr()} ${corner2.toLocStr()} air`);
        }
    }
}

/** 
 * Generates the maze, places it in the world, then generates the towers to put in the maze.
 * 
 * @param size The size of the maze.
 * @param wallType The type of wall to generate.
 */
async function generateMaze(size: number, wallType: string): Promise<void> {
    if (size > maxMazeSize) {
        size = maxMazeSize
    }

    let lastMazeSize = server.world.getDynamicProperty("lastMazeSize") as number || null;
    clearMaze(lastMazeSize);
    clearMaze(lastMazeSize);
    loadStructures();

    let halfSize = Math.floor(size / 2);

    // init maze grid (0 = wall, 1 = path)
    let maze = Array.from({ length: size }, () => Array(size).fill(0));

    // random start position
    let rsp = {
        x: Math.floor(Math.random() * Math.floor(size / 2)) * 2 + 1,
        z: Math.floor(Math.random() * Math.floor(size / 2)) * 2 + 1
    };

    // Iterative (Recursive) backtracking algorithm
    const stack = [];
    stack.push([rsp.x, rsp.z]); // starting pos

    maze[rsp.x][rsp.z] = 1; // set start position to be a path

    const directions = [
        [0, 2], // down
        [0, -2], // up
        [2, 0], // right
        [-2, 0], // left
    ];

    let generating = true; // Chest dead end flag

    while (stack.length > 0) {
        const [x, z, px, pz] = stack[stack.length - 1];

        // Shuffle directions to create randomness
        const shuffledDirections = directions.sort(() => Math.random() - 0.5);

        let foundValidNeighbor = false;
        for (const [dx, dz] of shuffledDirections) {
            let nx = x + dx;
            let nz = z + dz;

            // check if the neighbor cell is within bounds and still a wall
            if (nx > 0 && nz > 0 && nx < size - 1 && nz < size - 1 && maze[nx][nz] === 0) {
                maze[x + dx / 2][z + dz / 2] = 1;   // remove wall
                maze[nx][nz] = 1;                   // mark neighbor as path

                // push the neighbor onto the stack
                stack.push([nx, nz, x, z]);

                // continue generation of path
                generating = true;
                foundValidNeighbor = true;
                break;
            }
        }

        // at a dead end, start backtracking
        if (!foundValidNeighbor && generating) {
            placeChest(x - halfSize, z - halfSize, px - halfSize, pz - halfSize);
            generating = false;
        }

        // continue backtracking
        if (!foundValidNeighbor) {
            stack.pop();
        }
    }

    // place the maze in the world
    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
            for (let y = -3; y <= 1; y++) {
                let loc = {
                    x: origin.x + (x - halfSize),
                    y: origin.y + y,
                    z: origin.z + (z - halfSize)
                };
                if (y == -3) {
                    dim.setBlockType(loc, "minecraft:stone_bricks");
                    continue;
                }
                if (maze[x][z] === 1) {
                    // path (redundant rn)
                    //dim.setBlockType(loc, "minecraft:air");
                } else {
                    // wall
                    if (y == 1) {
                        let nanont = getNanont(loc.x, loc.z, size);
                        dim.setBlockType(loc, NANONT_BLOCKS[nanont.x][nanont.z]);
                    } else if (y == -1 && wallType == "glass") {
                        dim.setBlockType(loc, "minecraft:glass");
                    } else {
                        dim.setBlockType(loc, "minecraft:stone_bricks");
                    }
                }
            }
        }
    }
}

/** 
 * Determines the nanont of a given location within the maze size.
 * 
 * @param x The x coordinate of the location.
 * @param z The z coordinate of the location.
 * @param size The size of the maze.
 * 
 * @returns The Nanont of the coordinate, as a XZ Vector.
 */
function getNanont(x: number, z: number, size: number) {
    const col = x < -size / 6 ? 0 : x > size / 6 ? 2 : 1;
    const row = z < -size / 6 ? 0 : z > size / 6 ? 2 : 1;
    return { x: col, z: row };
}

/** 
 * Dynamically generates the towers based on the maze size.
 * 
 * @param mazeSize The size of the maze.
 * @param towerDifficulty The difficulty subset of towers.
 */
async function generateTowers(mazeSize: number, towerDifficulty: string): Promise<void> {

    let centerX = origin.x;
    let centerZ = origin.z;
    let halfSize = Math.floor(mazeSize / 2);

    // area bounds of large tower
    let largeTowerHalfX = Math.floor(largeTowerDimensions.x / 2);
    let largeTowerHalfZ = Math.floor(largeTowerDimensions.z / 2);
    let largeTowerMinX = centerX - largeTowerHalfX - minSeparation;
    let largeTowerMaxX = centerX + largeTowerHalfX + minSeparation;
    let largeTowerMinZ = centerZ - largeTowerHalfZ - minSeparation;
    let largeTowerMaxZ = centerZ + largeTowerHalfZ + minSeparation;

    // check if large tower fits
    if (
        largeTowerMinX >= -halfSize &&
        largeTowerMaxX < halfSize &&
        largeTowerMinZ >= -halfSize &&
        largeTowerMaxZ < halfSize
    ) {
        // place center tower
        await placeTower(centerX, centerZ, "large", towerDifficulty);

        // potential small tower positions
        let smallTowerOffset = (largeTowerHalfX + halfSize) / 2;

        let smallTowerPositions = [
            [centerX - smallTowerOffset, centerZ - smallTowerOffset], // TL
            [centerX, centerZ - smallTowerOffset], // TC
            [centerX + smallTowerOffset, centerZ - smallTowerOffset], // TR
            [centerX - smallTowerOffset, centerZ], // ML
            [centerX + smallTowerOffset, centerZ], // MR
            [centerX - smallTowerOffset, centerZ + smallTowerOffset], // BL
            [centerX, centerZ + smallTowerOffset], // BC
            [centerX + smallTowerOffset, centerZ + smallTowerOffset], // BR
        ];

        // Check if all small towers fit within maze, and do not collide with the large tower
        let canFitAllSmallTowers = smallTowerPositions.every(([x, z]) => {
            let smallTowerMinX = x - Math.floor(smallTowerDimensions.x / 2);
            let smallTowerMaxX = x + Math.floor(smallTowerDimensions.x / 2);
            let smallTowerMinZ = z - Math.floor(smallTowerDimensions.z / 2);
            let smallTowerMaxZ = z + Math.floor(smallTowerDimensions.z / 2);

            // check tower separation from walls
            let fitsWithinMaze = (
                smallTowerMinX - minSeparation >= -halfSize &&
                smallTowerMaxX + minSeparation < halfSize &&
                smallTowerMinZ - minSeparation >= -halfSize &&
                smallTowerMaxZ + minSeparation < halfSize
            );

            // check separation from the large tower
            let noCollisionWithLargeTower = (
                smallTowerMaxX + minSeparation <= largeTowerMinX ||
                smallTowerMinX - minSeparation >= largeTowerMaxX ||
                smallTowerMaxZ + minSeparation <= largeTowerMinZ ||
                smallTowerMinZ - minSeparation >= largeTowerMaxZ
            );

            return fitsWithinMaze && noCollisionWithLargeTower;
        });

        // place all small towers size 123 and above
        if (canFitAllSmallTowers) {
            smallTowerPositions.forEach(async ([x, z]) =>
                await placeTower(x, z, "small", towerDifficulty)
            );
            return;
        }
    }

    // only a large center tower size 51 to 121
    if (
        largeTowerMinX >= -halfSize &&
        largeTowerMaxX < halfSize &&
        largeTowerMinZ >= -halfSize &&
        largeTowerMaxZ < halfSize
    ) {
        await placeTower(centerX, centerZ, "large", towerDifficulty);
        return;
    }

    // only a small center tower size 31 to 49
    let smallTowerHalfX = Math.floor(smallTowerDimensions.x / 2);
    let smallTowerHalfZ = Math.floor(smallTowerDimensions.z / 2);

    let smallTowerMinX = centerX - smallTowerHalfX - minSeparation;
    let smallTowerMaxX = centerX + smallTowerHalfX + minSeparation;
    let smallTowerMinZ = centerZ - smallTowerHalfZ - minSeparation;
    let smallTowerMaxZ = centerZ + smallTowerHalfZ + minSeparation;

    if (
        smallTowerMinX >= -halfSize &&
        smallTowerMaxX < halfSize &&
        smallTowerMinZ >= -halfSize &&
        smallTowerMaxZ < halfSize
    ) {
        await placeTower(centerX, centerZ, "small", towerDifficulty);
        return;
    }

    // too small for a tower size 29 and below
    // console.warn("No space available for towers.");
}

/** 
 * Dynamically generates the spawns based on the player count.
 * 
 * @param mazeSize The size of the maze.
 * @param playerCount The amount of spawns to generate.
 */
async function generateSpawns(mazeSize: number, playerCount: number): Promise<void> {
    // initializations
    clearSpawns();
    let halfSize = Math.floor(mazeSize / 2);
    let rotate = server.StructureRotation.None;
    let spawn = [];
    let spawnx = 0;
    let spawnz = 1;
    let collision = 0;

    // check if player count fits in map size
    if (playerCount < 2) {
        playerCount = 2;
    } else if (playerCount > mazeSize / 10) {
        playerCount = Math.floor(mazeSize / 10);
    }

    // calculate spawn position for each player in playerCount and place
    let x = 0;
    while (x < playerCount) {
        // calculate spawn position
        collision = 0;
        spawnz = 1;
        spawnx = Math.round(Math.random());
        if (spawnx == 1) {
            spawnz = 0;
        }
        spawn[0] = (Math.floor(Math.random() * halfSize) - 4) * Math.sign(Math.random() - 0.5);
        spawn[1] = halfSize * Math.sign(Math.random() - 0.5);
        let startx = spawn[spawnx];
        let startz = spawn[spawnz];
        if (startz > Math.abs(startx)) {
            rotate = server.StructureRotation.Rotate90;
            startz = startz - 4;
        } else if (startz < -1 * Math.abs(startx)) {
            rotate = server.StructureRotation.Rotate270;
            startz = startz + 1;
        } else if (startx > Math.abs(startz)) {
            rotate = server.StructureRotation.None;
            startx = startx - 4;
        } else if (startx < -1 * Math.abs(startz)) {
            rotate = server.StructureRotation.Rotate180;
            startx = startx + 1;
        } else {
            console.warn(`what did you do to spawns?`);
        }
        // console.warn(WORLD_SPAWNS, [startx, startz])
        // Check for collision
        for (let y = 0; y < WORLD_SPAWNS.length; y++) {
            if (Math.abs(WORLD_SPAWNS[y][0] - startx) + Math.abs(WORLD_SPAWNS[y][1] - startz) < spawnSeparation) {
                collision = 1;
                break;
            }
        }
        // if no collision, place and move on
        if (collision) {
            continue;
        } else {
            server.world.structureManager.place(WORLD_TOWERS.spawn[0], dim, { x: startx, y: origin.y - 9, z: startz }, { rotation: rotate });
            WORLD_SPAWNS.push([startx, startz]);
            // console.warn(`placed at: ${startx}, ${startz}`)
            x++;
        }
    }
}

// TODO: Make sure any chests inside of a tower gets removed from the CURRENT_CHESTS array.
/** 
 * Places a small or large tower at the given x, z coordinates. 
 * 
 * @param x The x coordinate of the tower.
 * @param z The z coordinate of the tower.
 * @param tower The tower type.
 * @param towerDifficulty The difficulty subset of towers.
 */
async function placeTower(x: number, z: number, tower: string, towerDifficulty: string): Promise<void> {
    let dimensions;
    if (tower == "small") {
        dimensions = smallTowerDimensions;
    } else {
        dimensions = largeTowerDimensions;
    }
    let halfX = Math.floor(dimensions.x / 2);
    let halfZ = Math.floor(dimensions.z / 2);

    let startX = x - halfX;
    let startZ = z - halfZ;

    let startPos = vec3(startX, origin.y - 9, startZ);

    let towerNum = 0;

    if (tower == "small") {
        towerNum = Math.floor(Math.random() * WORLD_TOWERS[tower][towerDifficulty].length);
        server.world.structureManager.place(WORLD_TOWERS[tower][towerDifficulty][towerNum], dim, startPos, {});
        await findTowerChest(dimensions, startPos).then((loc) => {
            if (!loc) return;
            CURRENT_CHESTS[`SMALL_TOWER_CHESTS`].push(loc);
        })
    } else {
        towerNum = Math.floor(Math.random() * WORLD_TOWERS[tower].length);
        server.world.structureManager.place(WORLD_TOWERS[tower][towerNum], dim, startPos, {});
        await findTowerChest(dimensions, startPos).then((loc) => {
            if (!loc) return;
            CURRENT_CHESTS[`LARGE_TOWER_CHESTS`].push(loc);
        })
    }

    await spawnEntitiesInTowers(dimensions, startPos)

    CURRENT_TOWERS.push(
        bbox(
            startPos.add(0, dimensions.y / 2, 0),
            vec3(dimensions.x, dimensions.y, dimensions.z)
        )
    )
}

/** 
 * Places a chest at the position, direction based off the previous x, z given to the function.
 * 
 * @param x The current x coordinate.
 * @param z The current z coordinate.
 * @param px The previous x coordinate.
 * @param pz The previous z coordinate.
 */
function placeChest(x: number, z: number, px: number, pz: number): void {
    let chestLoc = { x: x, y: origin.y - 2, z: z };
    // console.warn(`${chestLoc.x} ${chestLoc.y} ${chestLoc.z}`)
    let chest = dim.getBlock(chestLoc);
    // console.warn(chest);

    let facing = "north";   // default, but hopefully should never happen
    if (x < px) facing = "east";
    else if (x > px) facing = "west";
    else if (z < pz) facing = "south";
    else if (z > pz) facing = "north";

    chest.setPermutation(server.BlockPermutation.resolve("minecraft:chest", { "minecraft:cardinal_direction": facing }));

    CURRENT_CHESTS.MAZE_CHESTS.push(chestLoc);
}

/**
 * Finds the chest inside of a tower
 * 
 * @param dimensions The dimensions of the tower
 * @param origin The origin of the tower
 * 
 * @returns The location of the chest.
 */
async function findTowerChest(dimensions: Vec3, origin: Vec3) {
    for (let x = 0; x < dimensions.x; x++) {
        for (let y = 0; y < dimensions.y; y++) {
            for (let z = 0; z < dimensions.z; z++) {
                let block = dim.getBlock(origin.add(x, y, z));
                if (block.typeId == "minecraft:chest") {
                    let comp = block.getComponent(server.BlockComponentTypes.Inventory) as server.BlockInventoryComponent;
                    if (comp.container.emptySlotsCount == comp.container.size) {
                        return origin.add(x, y, z);
                    }
                } else if (block.typeId == "bridge:chest_indicator_block") {
                    return origin.add(x, y, z);
                }
            }
        }
    }
    return null;
}

/**
 * Spawns the entities in a tower.
 * 
 * @param dimensions The dimensions of the tower
 * @param origin The origin of the tower
 */
async function spawnEntitiesInTowers(dimensions: Vec3, origin: Vec3) {
    for (let x = 0; x < dimensions.x; x++) {
        for (let y = 0; y < dimensions.y; y++) {
            for (let z = 0; z < dimensions.z; z++) {
                let loc = origin.add(x, y, z);
                let block = dim.getBlock(loc);
                if (block.hasTag("text_sign")) {
                    getSignInfo(loc);
                }
            }
        }
    }
}

/**
 * Spawns mobs based on sign data.
 * 
 * @param location The location of the sign
 */
function getSignInfo(location: Vec3) {
    let block = dim.getBlock(location);
    let signComp = block.getComponent(server.BlockComponentTypes.Sign) as server.BlockSignComponent;
    if (!signComp) return;
    let lines = signComp.getText().split("\n");
    if (lines[0] != `[mob]`) return;
    let amount = parseInt(lines[2]) || 1;
    let nameTag = lines[3] || "";
    try {
        for (let i = 0; i < amount; i++) {
            let e = dim.spawnEntity(lines[1], location);
            e.nameTag = nameTag;
        }
    } catch (e) {
        console.warn(`Incorrect entity identifier on [mob] spawner.`);
    }
    block.setType("minecraft:air");
}

// TODO: Account for where the towers in the maze are, because they remove chests.
/** 
 * Clears all chests in the maze.
 */
function clearChests() {
    for (const [k, chestType] of Object.entries(CURRENT_CHESTS)) {
        for (let i = 0; i < chestType.length; i++) {
            let chest = dim.getBlock(chestType[i]).getComponent(server.BlockComponentTypes.Inventory) as server.BlockInventoryComponent;
            if (!chest) {   // temporary fix for chest tower overlap
                continue;
            };
            let inventory = chest.container;
            inventory.clearAll();
        }
    }
}

/** 
 * Fills all chests in the maze.
 * 
 * @param lootQuality The lootQuality option for filling the chests.
 */
async function fillChests(lootQuality: string): Promise<void> {
    for (const [k, chestType] of Object.entries(CURRENT_CHESTS)) {
        switch (k) {
            case "MAZE_CHESTS":
                for (const chestLoc of chestType) {
                    let chest = dim.getBlock(chestLoc).getComponent(server.BlockComponentTypes.Inventory) as server.BlockInventoryComponent;
                    if (!chest) {   // temporary fix for chest tower overlap
                        continue;
                    };
                    let inventory = chest.container;
                    inventory.clearAll();
                    let loot_table = lootQuality;
                    dim.runCommand(`loot replace block ${chestLoc.x} ${chestLoc.y} ${chestLoc.z} slot.container 10 loot ${loot_table}`);
                }
                break
            case "SMALL_TOWER_CHESTS":
                for (const chestLoc of chestType) {
                    let b = dim.getBlock(chestLoc);
                    if (dim.getBlock(chestLoc).typeId == "bridge:chest_indicator_block") dim.setBlockPermutation(chestLoc, server.BlockPermutation.resolve("minecraft:chest", { "minecraft:cardinal_direction": b.permutation.getState("minecraft:cardinal_direction") }));
                    let chest = dim.getBlock(chestLoc).getComponent(server.BlockComponentTypes.Inventory) as server.BlockInventoryComponent;
                    if (!chest) {   // temporary fix for chest tower overlap
                        continue;
                    };
                    let inventory = chest.container;
                    inventory.clearAll();
                    let loot_table = "TowerChest";
                    dim.runCommand(`loot replace block ${chestLoc.x} ${chestLoc.y} ${chestLoc.z} slot.container 10 loot ${loot_table}`);
                }
                break
            case "LARGE_TOWER_CHESTS":
                for (const chestLoc of chestType) {
                    let b = dim.getBlock(chestLoc);
                    if (dim.getBlock(chestLoc).typeId == "bridge:chest_indicator_block") dim.setBlockPermutation(chestLoc, server.BlockPermutation.resolve("minecraft:chest", { "minecraft:cardinal_direction": b.permutation.getState("minecraft:cardinal_direction") }));
                    let chest = dim.getBlock(chestLoc).getComponent(server.BlockComponentTypes.Inventory) as server.BlockInventoryComponent;
                    if (!chest) {   // temporary fix for chest tower overlap
                        continue;
                    };
                    let inventory = chest.container;
                    inventory.clearAll();
                    let loot_table = "CenterChest";
                    dim.runCommand(`loot replace block ${chestLoc.x} ${chestLoc.y} ${chestLoc.z} slot.container 9 loot ${loot_table}`);
                }
                break
            default:
                console.warn(`what chest are you filling...? lol`);
                break;
        }
    }
}

/**
 * Generates a maze with towers and spawns, then fills the chests.
 * 
 * @param {MazeGenOptions} [mazeGenOptions] Options for maze generation.
 * 
 * @returns A promise that resolves when the maze generation is completed.
 */
export async function setupMazeworld(mazeGenOptions: MazeGenOptions = {}): Promise<void> {
    if (!mazeGenOptions.wallType) {
        mazeGenOptions.wallType = "glass";
    }
    if (!mazeGenOptions.towerDifficulty) {
        mazeGenOptions.towerDifficulty = "easy";
    }
    if (!mazeGenOptions.lootQuality) {
        mazeGenOptions.lootQuality = "strong";
    }
    if (!mazeGenOptions.waterZone) {
        mazeGenOptions.waterZone = "off";
    }
    if (!mazeGenOptions.mazeSize) {
        mazeGenOptions.mazeSize = 123;
    }
    if (!mazeGenOptions.playerCount) {
        mazeGenOptions.playerCount = Math.floor(mazeGenOptions.mazeSize / 10);
    }

    await generateMaze(mazeGenOptions.mazeSize, mazeGenOptions.wallType);
    await generateTowers(mazeGenOptions.mazeSize, mazeGenOptions.towerDifficulty);
    await generateSpawns(mazeGenOptions.mazeSize, mazeGenOptions.playerCount);
    await fillChests(mazeGenOptions.lootQuality);
    server.world.setDynamicProperty("lastMazeSize", mazeGenOptions.mazeSize);
}

/**
 * Generates the water zone
 * 
 * @param waterZoneAmount The amount of times water zone has been added (the size of the water zone).
 */
export async function generateWaterZone(mazeSize: number, waterZoneAmount: number): Promise<boolean> {
    let ceiling = origin.y + 2;
    let fillInSize = mazeSize - (waterZoneAmount * 2);

    let halfSize = Math.floor(mazeSize / 2);

    if (fillInSize <= halfSize) return false;

    let corners = [
        vec3(origin.x - halfSize + fillInSize, ceiling, origin.z - halfSize + fillInSize),  // BL
        vec3(origin.x + halfSize - fillInSize, ceiling, origin.z - halfSize + fillInSize),  // BR
        vec3(origin.x + halfSize - fillInSize, ceiling, origin.z + halfSize - fillInSize),  // TR
        vec3(origin.x - halfSize + fillInSize, ceiling, origin.z + halfSize - fillInSize),  // TL
    ]

    let corners_indented = [
        vec3(origin.x - halfSize + fillInSize - 2, ceiling, origin.z - halfSize + fillInSize - 2),    // BL
        vec3(origin.x + halfSize - fillInSize + 2, ceiling, origin.z - halfSize + fillInSize - 2),    // BR
        vec3(origin.x + halfSize - fillInSize + 2, ceiling, origin.z + halfSize - fillInSize + 2),    // TR
        vec3(origin.x - halfSize + fillInSize - 2, ceiling, origin.z + halfSize - fillInSize + 2),    // TL
    ]

    for (let i = 0; i < corners.length; i++) {
        let vert1 = corners[i];
        let vert2 = corners[(i + 1) % corners.length];
        let vert4 = corners_indented[(i + 1) % corners_indented.length];

        // Decide which x, z is smallest so it does all 4 corners correctly
        let minX = Math.min(vert1.x, vert4.x);
        let maxX = Math.max(vert1.x, vert4.x);
        let minZ = Math.min(vert1.z, vert4.z);
        let maxZ = Math.max(vert1.z, vert4.z);
        // Iterate via x, z to solve the nanont issue, and solve the tower issue.
        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                let isInATower = false;
                for (const towerBBox of CURRENT_TOWERS) {
                    if (towerBBox.pointInBounds(vec3(x, vert1.y, z))) {
                        //console.warn(`In tower...`);
                        isInATower = true;
                        break;
                    }
                }
                if (isInATower) continue;
                let nanont = getNanont(x, z, mazeSize);
                dim.setBlockType(vec3(x, ceiling, z), NANONT_BLOCKS[nanont.x][nanont.z]);
            }
        }

        // Use non-indented corners for water filling
        let minWaterX = Math.min(vert1.x, vert2.x);
        let maxWaterX = Math.max(vert1.x, vert2.x);
        let minWaterZ = Math.min(vert1.z, vert2.z);
        let maxWaterZ = Math.max(vert1.z, vert2.z);

        for (let x = minWaterX; x <= maxWaterX; x++) {
            for (let z = minWaterZ; z <= maxWaterZ; z++) {
                let isInATower = false;
                for (const towerBBox of CURRENT_TOWERS) {
                    if (towerBBox.pointInBounds(vec3(x, vert1.y, z))) {
                        //console.warn(`In tower...`);
                        isInATower = true;
                        break;
                    }
                }
                if (isInATower) continue;

                dim.runCommand(`fill ${x} ${ceiling - 1} ${z} ${x} ${ceiling - 4} ${z} water replace air`);
            }
        }
    }
    return true
}