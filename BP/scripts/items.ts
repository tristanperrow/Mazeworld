/* Item Effects Module */

import * as server from "@minecraft/server"
import { setBonuses, weaponEffects } from "./data.js"

/*
 *
 * Exported Types
 * 
 */

/**
 * Options for items.
 * 
 * @property wallType The type of walls used in the maze.
 * @property towerDifficulty The difficulty level of towers in the maze.
 * @property lootQuality The quality of loot available in the maze.
 * @property waterZone If the zone exists or not.
 */
export type ItemOptions = {
    time_between_set_effects?: number,
    duration_hit_effects?: number,
    duration_hit_lingering_effects?: number,
    gun_damage?: number
};

/**
 * Updates the item options.
 * 
 * @param {ItemOptions} [opts] The new item options.
 */
export function updateItemOptions(opts: ItemOptions): void {
    if (opts.time_between_set_effects) {
        time_between_set_effects = opts.time_between_set_effects;
        // reset interval
        server.system.clearRun(runIntervalInteger);
        startInterval();
    }
    if (opts.duration_hit_effects) {
        duration_hit_effects = opts.duration_hit_effects;
    }
    if (opts.duration_hit_lingering_effects) {
        duration_hit_lingering_effects = opts.duration_hit_lingering_effects;
    }
    if (opts.gun_damage) {
        gun_damage = opts.gun_damage;
    }
}

/*
 *
 * Items
 * 
 */

/** The dimension of the maze (overworld). */
let dim = server.world.getDimension("overworld");

/** The integer given to the set effect interval to be used for resetting the set effect interval. */
export let runIntervalInteger = null   // NECESSARY FOR SETTINGS

/** The ticks per second of a minecraft server (should always be 20). */
let TPS = 20;

/** The time (in seconds) between when set effects are re-applied / taken away from the player. */
let time_between_set_effects = 1.0;
/** The duration (in seconds)  of a hit effect to disallow for swapping between weapons. */
let duration_hit_effects = 0.5;
/** The duration (in seconds) of a lingering hit effect, for effects like poison and fire. */
let duration_hit_lingering_effects = 4.0;
/** The damage of the blicky, in half-hearts(?). */
let gun_damage = 7;

/*
 *
 *  Server-Wide Intervals
 *
 */

/** 
 * Main interval loop, used for applying effects to players
 */
function startInterval() {
    return server.system.runInterval(() => {
        const players = [...server.world.getPlayers()];

        for (const player of players) {
            let applySetBonus = hasArmorSet(player);
            if (applySetBonus != null) {
                for (const effect of applySetBonus.armorSet.effects) {
                    player.addEffect(effect.type, TPS * time_between_set_effects * 5, { amplifier: effect.amplifier });
                }
            }
            let plrEquipComp = player.getComponent(server.EntityComponentTypes.Equippable) as server.EntityEquippableComponent;
            let heldItem = plrEquipComp.getEquipment(server.EquipmentSlot.Mainhand);
            if (heldItem) {
                applyPassiveEffects(player, heldItem.typeId);
            }
        }
    }, TPS * time_between_set_effects);
}

/*
 *
 *  FUNCTIONS
 * 
 */

// item checking functions

/** 
 * Counts the amount of an item a player has in their inventory.
 * 
 * @param player The player to check.
 * @param itemId The item identifier to check for.
 * 
 * @returns The amount of the item in the player's inventory.
 */
function checkItemAmount(player: server.Player, itemId: string): number {
    const component = player.getComponent(server.EntityComponentTypes.Inventory) as server.EntityInventoryComponent;
    const inventory = component.container;
    let itemAmount = 0;
    for (let i = 0; i < 36; i++) {
        let item = inventory.getItem(i);
        if (item?.typeId != itemId) continue;
        itemAmount += item.amount;
    };
    return itemAmount;
}

/** 
 * Checks if a player has an item, then removes a singular copy of it. Returns true when removing an item, false if there is no item.
 * 
 * @param player The player to check.
 * @param itemId The item identifier to check for.
 * 
 * @returns true if an item was removed from the player's inventory, false if an item was not removed.
 */
function removeItem(player: server.Player, itemId: string): boolean {
    const component = player.getComponent(server.EntityComponentTypes.Inventory) as server.EntityInventoryComponent;
    const inventory = component.container;
    for (let i = 0; i < 36; i++) {
        let item = inventory.getItem(i);
        if (item?.typeId != itemId) continue;
        let amount = inventory.getItem(i).amount - 1;
        if (amount < 1) {
            inventory.setItem(i, undefined);
            return true;
        }
        let newItemStack = new server.ItemStack(inventory.getItem(i).typeId, inventory.getItem(i).amount - 1);
        inventory.setItem(i, newItemStack);
        return true;
    }
    return false;
}

/** 
 * Returns the equipped armor of the player as an object of typeIds
 * 
 * @param player The player to check.
 * 
 * @returns The equipped armor identifiers as an object.
 */
function getEquippedArmor(player: server.Player) {
    const equipment = player.getComponent(server.EntityComponentTypes.Equippable) as server.EntityEquippableComponent;
    return {
        helmet: equipment.getEquipment(server.EquipmentSlot.Head)?.typeId || null,
        chestplate: equipment.getEquipment(server.EquipmentSlot.Chest)?.typeId || null,
        leggings: equipment.getEquipment(server.EquipmentSlot.Legs)?.typeId || null,
        boots: equipment.getEquipment(server.EquipmentSlot.Feet)?.typeId || null,
    };
}

/** 
 * Checks if the player is currently wearing an armor set, returns {name, armorSet}
 * 
 * @param player The player to check.
 * 
 * @returns The name of the armor set, and the armor set object if the player has one, otherwise returns null.
 */
function hasArmorSet(player: server.Player) {
    let itemIds = getEquippedArmor(player);
    for (const [setName, armorSet] of Object.entries(setBonuses)) {
        if (
            armorSet.helmet === itemIds.helmet &&
            armorSet.chestplate === itemIds.chestplate &&
            armorSet.leggings === itemIds.leggings &&
            armorSet.boots === itemIds.boots
        ) {
            return { name: setName, armorSet: armorSet };
        }
    }
    return null;
}

/** 
 * Checks if the player is currently equipped with a specific armor set
 * 
 * @param player The player to check.
 * @param setName The name of the set to check for.
 * 
 * @returns true if the player has the specified armor set, false if they do not.
 */
function hasSpecificArmorSet(player: server.Player, setName: string): boolean {
    let itemIds = getEquippedArmor(player);
    //console.warn(setBonuses[setName]);
    if (setBonuses[setName] == null) return false;
    if (
        setBonuses[setName].helmet === itemIds.helmet &&
        setBonuses[setName].chestplate === itemIds.chestplate &&
        setBonuses[setName].leggings === itemIds.leggings &&
        setBonuses[setName].boots === itemIds.boots
    ) {
        return true;
    }
    return false;
}

// weapon effect functions

/** 
 * Applies the specific hit effect
 * 
 * @param player The player hitting the entity.
 * @param target The target entity.
 * @param effect The effect to apply to the player or entity.
 */
function applyHitEffect(player: server.Player, target: server.Entity, effect) {
    if (!effect) return;

    let duration = (effect.duration === "linger") ? duration_hit_lingering_effects : duration_hit_effects;

    switch (effect.type) {
        case "fire":
            let dm = effect.durationMultiplier || 1;
            target.setOnFire(duration * dm, true);
            break;
        case "effect":
            if (!effect.effectType) {
                console.warn(`effect type \`effect\` requires an \`effectType\` property.`);
                return;
            }
            let amp = effect.amplifier || 1;
            let effectTarget = (effect.target === "player") ? player : target;
            effectTarget.addEffect(effect.effectType, TPS * duration, {
                amplifier: amp - 1,
            })
            break;
        default:
            console.warn(`Unknown effect type: ${effect.type}`);
            break;
    }
}

/** 
 * Applies the specific passive effect
 * 
 * @param player The player to apply the effect to.
 * @param effect The effect to apply to the player.
 */
function applyPassiveEffect(player: server.Player, effect): void {
    if (!effect) return;

    switch (effect.type) {
        case "effect":
            if (!effect.effectType) {
                console.warn(`effect type \`effect\` requires an \`effectType\` property.`);
                return;
            }
            let amp = effect.amplifier || 1;
            player.addEffect(effect.effectType, TPS * time_between_set_effects + 5, {
                amplifier: amp - 1,
            })
            break;
        default:
            console.warn(`Unknown effect type: ${effect.type}`);
            break;
    }
}

/** 
 * Applies effects on hit based on weaponEffects
 * 
 * @param player The player to check for a weapon effect.
 * @param target The target entity of the hit event.
 * @param itemId The item identifier that the player used to hit the target entity.
 */
function applyHitEffects(player: server.Player, target: server.Entity, itemId: string): void {
    // check if weapon has a weapon effect object
    const effectObject = weaponEffects[itemId];
    if (!effectObject) return;

    for (const effect of effectObject.effects) {
        // check if each effect is a hit effect or not
        if (effect.type !== "hit") continue;
        // apply specific effect if player has the set or not
        const effectToApply = hasSpecificArmorSet(player, effectObject.setType) ? effect.setEffect : effect.baseEffect;
        applyHitEffect(player, target, effectToApply);
    }
}

/** 
 * Applies Passive Effects based on weaponEffects
 * 
 * @param player The player to check for a passive effect.
 * @param itemId The item identifier that the player is holding.
 */
function applyPassiveEffects(player: server.Player, itemId: string): void {
    // check if weapon has a weapon effect object
    const effectObject = weaponEffects[itemId];
    if (!effectObject) return;

    for (const effect of effectObject.effects) {
        // check if each effect is a passive effect or not
        if (effect.type !== "passive") continue;
        // apply specific effect if player has the set or not
        const effectToApply = hasSpecificArmorSet(player, effectObject.setType) ? effect.setEffect : effect.baseEffect;
        applyPassiveEffect(player, effectToApply);
    }
}

// glock function

/** 
 * Does the glock shoot functionality, subscribed in events.
 * 
 * @param event The itemUse after event
 */
function shootGlock(event: server.ItemUseAfterEvent): void {
    if (event.itemStack == undefined || event.itemStack == null) return;
    if (event.source.typeId != "minecraft:player") return;
    if (event.itemStack.typeId != "mw:glock") return;
    let player = event.source;

    // Use Ammo if not in creative mode
    if (player.getGameMode() != server.GameMode.creative) {
        if (!removeItem(player, "mw:bullet")) return;
    }

    server.system.run(() => {
        let ploc = player.location
        let randPitch = Math.random() * (1.175 - 0.825) + 0.825
        player.dimension.playSound("mw.glock", ploc, {
            pitch: randPitch,
            volume: 0.5
        });

        let pvd = player.getViewDirection();

        player.runCommand("camerashake add @s 0.1 0.2 positional");
        player.runCommand("camerashake add @s 0.3 0.2 rotational");

        // test hitscan
        let entities = player.dimension.getEntitiesFromRay(player.getHeadLocation(), pvd, {
            maxDistance: 250,
            includePassableBlocks: false,
        })
        for (var i = 0; i < entities.length; i++) {
            let entity = entities[i].entity;
            if (entity.nameTag != player.name) {
                entity.applyKnockback(pvd.x, pvd.z, 1, 0.25);
                entity.applyDamage(gun_damage, {
                    cause: server.EntityDamageCause.projectile,
                    damagingEntity: player,
                });
            }
        }
    })
}

/* Hitscan Glock event */
server.world.afterEvents.itemUse.subscribe(shootGlock);

/* For special weapon effects */
server.world.afterEvents.entityHitEntity.subscribe((event) => {
    if (event.damagingEntity.typeId != "minecraft:player") return;
    let entEquipComp = event.damagingEntity.getComponent(server.EntityComponentTypes.Equippable) as server.EntityEquippableComponent;
    let handItem = entEquipComp.getEquipment(server.EquipmentSlot.Mainhand);
    if (!handItem) return;

    applyHitEffects(event.damagingEntity as server.Player, event.hitEntity, handItem.typeId);
});

/* FINAL STUFF */
runIntervalInteger = startInterval();