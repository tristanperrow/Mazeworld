import * as server from "@minecraft/server"
import { settingPresetsData } from "./settings.js"
import * as MazeGeneration from "./maze_generation"
import * as Items from "./items"
import { clamp } from "./math"
import { PlayerUtils, PlayerStatType } from "./player"

/*
 *
 * SETUP
 *
*/

let TPS = 20;

let debug = false;

/** To work with main.js (idk why having one export makes this all work) */
export let dim = server.world.getDimension("overworld");

let settingsPresets = settingPresetsData;

/** The maze generation options from maze_generation.ts */
let mazeGenerationOptions: MazeGeneration.MazeGenOptions = {
    wallType: "glass",
    towerDifficulty: "easy",
    lootQuality: "strong",
    waterZone: "on",
    mazeSize: server.world.getDynamicProperty("lastMazeSize") as number || 123,
    playerCount: 12,
};

/** The item effect options from items.ts */
let itemOptions: Items.ItemOptions = {
    time_between_set_effects: 1.0,
    duration_hit_effects: 0.5,
    duration_hit_lingering_effects: 4.0,
    gun_damage: 7
};

/** List of all current players in a game  */
export let currentPlayers = new Map<String, server.Player>();

/** Amount of times the water zone has spread this game */
export let stormCount: number = server.world.getDynamicProperty("stormCount") as number || 0;

/** The exponential factor at which the storm slows down by maze size. */
export let stormFactor: number = 1.4;

/*
 *
 * FUNCTIONS
 * 
 */

/**
 * Modify the maze size option if the game is not currently active.
 * 
 * @param {server.ScriptEventCommandMessageAfterEvent} [event] The scriptevent event given to run this function.
 * 
 * @returns The updated **mazeSize** or -1 if the game is currently active.
 */
function updateMazeSize(event: server.ScriptEventCommandMessageAfterEvent | string | number): number {
    if (isGameActive()) {
        console.warn(`Can't update while a game is running!`);
        return -1;
    }
    let num;
    if (typeof event === "string") {
        num = parseInt(event);
    } else if (event instanceof server.ScriptEventCommandMessageAfterEvent) {
        num = parseInt(event.message);
    } else if (typeof event === "number") {
        num = event;
    } else {
        throw new Error("Error in updateMazeSize");
    }
    if (isNaN(num)) {
        console.warn(`updateMazeSize requires an integer parameter`);
        return;
    }
    let adjMinMazeSize = (PlayerUtils.GetReadyPlayers().length > Math.floor(MazeGeneration.minMazeSize / 10)) ? PlayerUtils.GetReadyPlayers().length * 10 + 1 : MazeGeneration.minMazeSize;
    mazeGenerationOptions.mazeSize = clamp(mazeGenerationOptions.mazeSize + num, adjMinMazeSize, MazeGeneration.maxMazeSize);
    return mazeGenerationOptions.mazeSize;
}

/**
 * Resets the **mazeSize** variable to its default if the game is not currently active.
 * 
 * @returns The updated **mazeSize** or -1 if the game is currently active.
 */
function resetMazeSize(): number {
    if (isGameActive()) {
        console.warn(`Can't update while a game is running!`);
        return -1;
    }
    mazeGenerationOptions.mazeSize = 123;
    return mazeGenerationOptions.mazeSize;
}

/**
 * Modify the player count variable if the game is not currently active.
 * 
 * @param {server.ScriptEventCommandMessageAfterEvent} [event] The scriptevent event given to run this function.
 * 
 * @returns The updated **playerCount** or -1 if the game is currently active.
 */
function updatePlayerCount(event: server.ScriptEventCommandMessageAfterEvent | string): number {
    if (isGameActive()) {
        console.warn(`Can't update while a game is running!`);
        return -1;
    }
    let num;
    if (typeof event === "string") {
        num = parseInt(event);
    } else if (event instanceof server.ScriptEventCommandMessageAfterEvent) {
        num = parseInt(event.message);
    } else {
        throw new Error("Error in updatePlayerCount");
    }
    if (isNaN(num)) {
        console.warn(`updatePlayerCount requires an integer parameter`);
        return;
    }
    mazeGenerationOptions.playerCount = clamp(mazeGenerationOptions.playerCount + num, PlayerUtils.GetReadyPlayers().length, Math.floor(mazeGenerationOptions.mazeSize / 10));
    if (mazeGenerationOptions.playerCount < 2) {
        mazeGenerationOptions.playerCount = 2;
    }
    return mazeGenerationOptions.playerCount;
}

/**
 * Resets the **playerCount** variable to its default if the game is not currently active.
 * 
 * @returns The updated **playerCount** or -1 if the game is currently active.
 */
function resetPlayerCount(): number {
    if (isGameActive()) {
        console.warn(`Can't update while a game is running!`);
        return -1;
    }
    mazeGenerationOptions.playerCount = Math.floor(mazeGenerationOptions.mazeSize / 20);
    if (mazeGenerationOptions.playerCount < 2) {
        mazeGenerationOptions.playerCount = 2;
    }
    return mazeGenerationOptions.playerCount;
}

/**
 * Checks if player is in game
 * 
 * @param player The player to check for.
 * 
 * @returns true if the player is in the game, false if not
 */
function isPlayerInGame(player: server.Player) {
    return currentPlayers.has(player.name);
}

/**
 * Removes a player from the game
 * 
 * @param player The player to remove from the game.
 */
function removePlayerFromGame(player: server.Player) {
    currentPlayers.delete(player.name);
}

/**
 * Checks if the game is active.
 * 
 * @returns true if the game is active, false if not.
 */
function isGameActive(): boolean {
    //return currentPlayers.size > 0;
    return server.world.scoreboard.getObjective("currentgame") != null;
}

/**
 * Sets the stormCount
 *
 * @param count The new storm count.
 */
function setStormCount(count: number) {
    stormCount = count;
    server.world.setDynamicProperty("stormCount", stormCount);
}

/**
 * The storm start time.
 * 
 * @returns The time the storm should start expanding.
 */
function stormStartTime() {
    return 30 + Math.floor(30 * (mazeGenerationOptions.mazeSize / 29)) + Math.floor(Math.pow(mazeGenerationOptions.mazeSize - 29, stormFactor));
}

/**
 * The next storm expansion time.
 * 
 * @param count The storm expasion count.
 * 
 * @returns The next time the storm should expand.
 */
function stormNextTime(count: number) {
    if (count == 0)
        return stormStartTime();
    if (count > 31)
        count = 31;
    return Math.floor((stormStartTime() / (count + 1))) + stormNextTime(count - 1);
}

/**
 * Chooses and updates the settings given by the command event.
 * 
 * @param setting The setting to change.
 * @param option The option to change the setting to.
 */
function chooseSettingsPreset(setting, option) {
    if (!settingsPresets[setting]) {
        console.warn(`Unknown setting: ${setting}`);
        return;
    }
    if (!settingsPresets[setting][option]) {
        console.warn(`Unknown settings option: ${option}`);
        return;
    }

    switch (setting) {
        // item options
        case "effect_accuracy":
            itemOptions.time_between_set_effects = settingsPresets.effect_accuracy[option].time_between_set_effects;
            break;
        case "gun_damage":
            itemOptions.gun_damage = settingsPresets.gun_damage[option].gun_damage;
            break;
        case "hit_effect_length":
            itemOptions.duration_hit_effects = settingsPresets.hit_effect_length[option].duration_hit_effects;
            break;
        case "lingering_effect_length":
            itemOptions.duration_hit_lingering_effects = settingsPresets.hit_effect_length[option].duration_hit_effects;
            break;
        // maze generation options
        case "wallType":
            mazeGenerationOptions.wallType = settingsPresets.wallType[option].wallType;
            break;
        case "towerDifficulty":
            mazeGenerationOptions.towerDifficulty = settingsPresets.towerDifficulty[option].towerDifficulty;
            break;
        case "lootQuality":
            mazeGenerationOptions.lootQuality = settingsPresets.lootQuality[option].lootQuality;
            break;
        case "waterZone":
            mazeGenerationOptions.waterZone = settingsPresets.waterZone[option].waterZone;
            break;
        default:
            console.warn(`Unknown setting: ${setting}`);
            break;
    }
}

/**
 * Starts a new mazeworld game.
 */
async function startGame() {
    await MazeGeneration.setupMazeworld(mazeGenerationOptions); // Generate maze
    // start timer for water zone?

    // reset water zone
    setStormCount(0);

    // clear items off ground
    dim.runCommand(`kill @e[type=item]`);
    dim.runCommand(`kill @e[type=xp_orb]`);

    // set/reset scoreboards?
    dim.runCommand(`scoreboard objectives remove currentgame`);
    dim.runCommand(`scoreboard objectives add currentgame dummy "Current Game"`);
    // initialize timer
    dim.runCommand(`scoreboard players add Time currentgame 0`);
    // tp to maze
    let playerList = PlayerUtils.GetReadyPlayers();
    for (const curPlayer of playerList) {
        currentPlayers.set(curPlayer.name, curPlayer);
    }
    for (let x = 0; x < playerList.length; x++) {
        let player = playerList[x];

        for (const effect of player.getEffects())
            player.removeEffect(effect.typeId);

        player.addEffect("saturation", 10, { amplifier: 10 });      // give saturation
        player.addEffect("regeneration", 10, { amplifier: 10 });    // give regen
        player.camera.setCamera("minecraft:first_person");          // set first person
        player.addLevels(-100)                                      // remove xp
        player.setGameMode(server.GameMode.adventure);              // set adventure
        PlayerUtils.ClearInventory(player)                                      // clear inventory

        server.world.scoreboard.getObjective("currentgame").setScore(player, 1);

        let spawnLoc = MazeGeneration.WORLD_SPAWNS[x];
        player.teleport({ x: spawnLoc[0] + 2.5, y: 14.5, z: spawnLoc[1] + 2.5 })
    }
}

/**
 * Tries to end the game.
 */
function tryGameOver(): boolean {
    let numPlayersRemaining = 0;
    let remainingPlayer = null;
    // get remaining players
    currentPlayers.forEach((player) => {
        if (server.world.getPlayers({ name: player.name })[0]) {
            numPlayersRemaining++;
            remainingPlayer = player;
        }
    })

    // game is over if only one person is left alive.
    if ((numPlayersRemaining <= 1 && !debug) || (numPlayersRemaining <= 0 && debug)) {
        // teleport all participants back to spawn
        currentPlayers.forEach((plr) => {
            // teleport player to world spawn
            plr.teleport(server.world.getDefaultSpawnLocation());
            // get rid of the camera lock
            plr.camera.clear();
            // clear the inventory of the player
            PlayerUtils.ClearInventory(plr);
            // add win to player if they won
            if (remainingPlayer.name == plr.name)
                PlayerUtils.AddWin(plr);
        })
        // remove current game objective
        server.world.scoreboard.removeObjective("currentgame");
        // reset water zone
        setStormCount(0);
        // remove all currentPlayers
        currentPlayers.clear();
        // kill all entites besides players
        dim.runCommand("kill @e[type=!player]")

        return true;
    }

    return false;
}

/*
 *
 * INTERVALS
 * 
 */

// combine game loops (seconds and ticks) somehow?

server.system.runInterval(() => {
    dim.runCommand(`scoreboard objectives setdisplay sidebar currentgame descending`);
    dim.runCommand(`scoreboard players set @a[scores={alive=!2}] alive 0`);
    dim.runCommand(`scoreboard players set @e[type=player] alive 1`);
    dim.runCommand(`execute as @a[scores={alive=0}] run title @s title Wasted`);
    dim.runCommand(`camera @a[scores={alive=0}] fade time 2 2 2`);
    dim.runCommand(`scoreboard players set @a[scores={alive=0}] alive 2`);
    dim.runCommand(`scoreboard players set @a[scores={alive=2}] currentgame 0`);

    dim.runCommand(`scoreboard players set total alive_total 0`);
    dim.runCommand(`scoreboard players operation total alive_total += @a currentgame`);
    //dim.runCommand(`execute if score total alive_total matches 1 run scoreboard players add @a[scores={currentgame=1}] wins 1`);
    //dim.runCommand(`execute if score total alive_total matches 1 run scoreboard players set @a[scores={currentgame=1}] currentgame 0`);

    // main game loop every tick
    if (isGameActive()) {
        // constantly clear inventory of dead people?

        // final part of game loop
        tryGameOver();
    }
}, 1)

server.system.runInterval(() => {
    dim.runCommand(`scoreboard players add Time currentgame 1`);

    // main game loop every second
    if (isGameActive()) {
        let time = server.world.scoreboard.getObjective("currentgame").getScore("Time");
        // storm
        let nextStormAdvance = stormNextTime(stormCount);
        if (time == nextStormAdvance - 30) {
            PlayerUtils.DisplayTextToPlayers(currentPlayers, `The maze is §9§lflooding§r in 30 seconds...`);
        } else if (time >= nextStormAdvance && mazeGenerationOptions.waterZone == "on") {
            setStormCount(stormCount + 1);
            MazeGeneration.generateWaterZone(mazeGenerationOptions.mazeSize, stormCount).then((filled) => {
                if (filled) {
                    PlayerUtils.DisplayTextToPlayers(currentPlayers, `The maze is §9§lflooding§r...`);
                }
            });
        }
    }
}, 20)

/* 
 *
 * Events 
 *  
 * */

/* check for player kills/deaths */
server.world.afterEvents.entityDie.subscribe((event) => {
    let deadEntity = event.deadEntity;
    // check if it was a player that died
    if (deadEntity.typeId != "minecraft:player") return;
    let deadPlayer = deadEntity as server.Player;
    // check if player is in the game
    if (!isPlayerInGame(deadPlayer)) return;
    // add death to player
    PlayerUtils.SetPlayerStat(deadPlayer, PlayerStatType.deaths, PlayerUtils.GetPlayerStat(deadPlayer, PlayerStatType.deaths) as number + 1);
    // remove player from the game
    removePlayerFromGame(deadPlayer);
    let killingEntity = event.damageSource.damagingEntity;
    // check if it was a player that killed
    if (!killingEntity) return;
    if (killingEntity.typeId != "minecraft:player") return;
    let killingPlayer = killingEntity as server.Player;
    // check if killing player was in the game
    if (!isPlayerInGame(killingPlayer)) return;
    // add kill to player
    PlayerUtils.SetPlayerStat(killingPlayer, PlayerStatType.kills, PlayerUtils.GetPlayerStat(killingPlayer, PlayerStatType.kills) as number + 1);
})

/* when player joins, update adjMinMazeSize and playerCount */
server.world.afterEvents.playerJoin.subscribe((event) => {
    updateMazeSize("0")
    updatePlayerCount("1")
})

/* when player leaves, remove from current game if possible */
server.world.beforeEvents.playerLeave.subscribe((event) => {
    if (!isGameActive()) return;
    if (!server.world.scoreboard.getObjective("currentgame").hasParticipant(event.player)) return;
    tryGameOver();
})

/* /scriptevent commands */
server.system.afterEvents.scriptEventReceive.subscribe((event) => {
    const args = event.message.split(' ');

    if (event.id === "mw:start") {
        startGame();
    } else if (event.id === "mw:structures") {
        console.warn(`Structures:`)
        for (const structure of server.world.structureManager.getWorldStructureIds()) {
            if (structure.split(`:`)[0] == "temp") continue;
            console.warn(`  - ${structure}`);
        }
    } else if (event.id === "mw:updateMazeSize") {
        let n = updateMazeSize(event);
        if (n != -1)
            server.world.sendMessage(`Maze Size - ${mazeGenerationOptions.mazeSize}`);
    } else if (event.id === "mw:resetMazeSize") {
        let n = resetMazeSize();
        if (n != -1)
            server.world.sendMessage(`Maze Size - ${mazeGenerationOptions.mazeSize}`);
    } else if (event.id === "mw:updatePlayerCount") {
        let n = updatePlayerCount(event);
        if (n != -1)
            server.world.sendMessage(`Player Count - ${mazeGenerationOptions.playerCount}`);
    } else if (event.id === "mw:resetPlayerCount") {
        let n = resetPlayerCount();
        if (n != -1)
            server.world.sendMessage(`Player Count - ${mazeGenerationOptions.playerCount}`);
    } else if (event.id === "mw:togglePlayerReady") {
        let player = event.sourceEntity as server.Player;
        PlayerUtils.TogglePlayerReady(player);
    } else if (event.id === "mw:setPlayerReady") {
        let newStatus = (event.message == "true") ? true : false;
        let player = event.sourceEntity as server.Player;
        PlayerUtils.SetPlayerReady(player, newStatus);
    } else if (event.id === "mw:settings") {
        if (args.length == 1 && args[0] == "help") {
            server.world.sendMessage("Settings:");
            for (const [s, o] of Object.entries(settingsPresets)) {
                server.world.sendMessage(` - ${s}`);
            }
            return;
        }
        // Helpful warning
        if (args.length < 2) {
            server.world.sendMessage("Usage: \n/scriptevent mw:settings <setting> <option>\n/scriptevent mw:settings <setting> help\n/scriptevent mw:settings help");
            return;
        }
        const [setting, option] = args;
        // Verify setting exists
        if (!settingsPresets[setting]) {
            server.world.sendMessage(`Unknown setting: ${setting}`);
            return;
        }
        // In case user wants to know the options
        if (args.length >= 2 && args[1] == "help") {
            server.world.sendMessage(`Options for ${args[0]}:`);
            for (const [o, v] of Object.entries(settingsPresets[setting])) {
                server.world.sendMessage(` - ${o}`);
            }
            return;
        }
        // Verify option exists
        if (!settingsPresets[setting][option]) {
            server.world.sendMessage(`Unknown settings option: ${option}`);
            return;
        }
        chooseSettingsPreset(setting, option);
        Items.updateItemOptions(itemOptions);
        server.world.sendMessage(`Set ${setting} to ${option}`);
    } else if (event.id === "mw:test") {
        server.world.sendMessage(`test 5.0.4`);
    } else if (event.id === "mw:debug") {
        debug = !debug;
        PlayerUtils.DisplayTextToPlayers(server.world.getPlayers(), `${debug}`);
    } else if (event.id === "mw:leaderTest") {
        let ldb = PlayerUtils.GetSpecificLeaderboard(server.world.getPlayers(), PlayerStatType.wins)
        server.world.sendMessage(`${PlayerStatType.wins} leaderboard`);
        ldb.forEach((v, k) => {
            if (!v) return;
            server.world.sendMessage(` - ${k.name} | ${v}`);
        })

        let ldb2 = PlayerUtils.GetSpecificLeaderboard(server.world.getPlayers(), PlayerStatType.kills)
        server.world.sendMessage(`${PlayerStatType.kills} leaderboard`);
        ldb2.forEach((v, k) => {
            if (!v) return;
            server.world.sendMessage(` - ${k.name} | ${v}`);
        })

        let ldb3 = PlayerUtils.GetSpecificLeaderboard(server.world.getPlayers(), PlayerStatType.deaths)
        server.world.sendMessage(`${PlayerStatType.deaths} leaderboard`);
        ldb3.forEach((v, k) => {
            if (!v) return;
            server.world.sendMessage(` - ${k.name} | ${v}`);
        })
    } else {
        console.warn(`Unknown scriptevent ${event.id}.`);
    }
})

/*
To Do:

Functionality:
IN PROGRESS: ready up feature
add leaderboards (wins, kills, deaths)
add a variant with 4 small towers size ~51 - 71
add tower combination selection (instead of forcing 51 to be 1 large, allow selecting 1 small, 1 large, 2 smalls, 3 smalls, or 4 smalls, etc.)
spawn room overhaul
create more easy and hard towers: house, city/skyscraper, potion, enchanting, mob, redstone, farming, trading, bee, lush cave, stronghold, trial, copper
create more centers: mob spawn, beacon, king of the hill, city, village, redstone, trial
kill kenny dog on new game, but not the base kenny dog (kenny dog removed entirely in the interim)
adjust loot odds for towers and centers
refreshing chests mid game after timer
minimap?! (instead of just a map lol)
add UI for setting selection
generate some decoration around the maze
add option for limiting each tower to only spawn once
add second floor to maze with stairs (and ladders?)

Items:
add lingering potions to loot table for arrows
craft custom armor (smithing table?)
Armor set with custom ranged weapon
Iron, Diamond, Netherite tridents
Iron, Diamond, Netherite bows
Iron, Diamond, Netherite crossbows
Iron, Diamond, Netherite nunchucks
lasso
explosive arrows (fireworks in crossbows?)
RPG/grenade launcher

Code Quality Improvement:
avoid hardcoding tower and center chest coordinates
organize maze_generation.ts items.ts because there are variables and functions everywhere lol
organize scripts into separate folders? utils for math.ts, jsonScripts (idk) for data.js & settings.js, etc.
use and improve Vec3 in old functions to make them more readable/understandable
add types for many string options so you know what the options can be (i.e. lootQuality.MazeWeak in maze_generation.ts)
add type for effect in items.ts so it is obvious what the effect options are
improve documentation on functions (always can be improved)





DONE:

Functionality:
add spawns
fill tower and center chests from loot tables
add respawn(/game start?) room
add game start button to teleport people to random spawns
make the fillChests() function's loot_table variable adjustable by in game buttons
add button options for glass/stone walls
select maze size from spawn room
add button options for easy vs hard towers
add button options for player count
add colors to top of maze walls based on quadrant
add ticking area for larger maze generations
add water storm on timer
bring winner back to spawn

Code Quality Improvement:
Make and separate maze_generation.ts
Make and separate items.ts
(see main.js): fix JSDoc not working for imported functions in Mazeworld.js??? (the JSDoc is readable in the files they come from, and any other file... idk why)
fix cases where `@ts-ignore` is used, so it doesn't have to be used (idk how though, no types to cast to...) (happens in maze gen & item effects)
*/