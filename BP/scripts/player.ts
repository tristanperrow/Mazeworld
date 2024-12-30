import * as server from "@minecraft/server"

export class PlayerUtils {
    /* STATS */

    /**
     * Gets all statistics of a player as an object.
     * 
     * @param player The player to get the statistics of.
     * 
     * @returns The statistics of a player, or null
     */
    static GetPlayerStatistics(player: server.Player) {
        let stats: PlayerStats;
        stats.wins = server.world.getDynamicProperty(`${player.name}:mw:wins`) as number || 0;
        stats.kills = server.world.getDynamicProperty(`${player.name}:mw:kills`) as number || 0;
        stats.deaths = server.world.getDynamicProperty(`${player.name}:mw:deaths`) as number || 0;
        return stats || null;
    }

    /**
     * Gets the specific player statistic.
     * 
     * @param player The player to get the statistic of.
     * @param stat The statistic to return.
     * 
     * @returns The requested stat, or null.
     */
    static GetPlayerStat(player: server.Player, stat: string | PlayerStatType) {
        return server.world.getDynamicProperty(`${player.name}:mw:${stat}`) || null;
    }

    /**
     * Set all statistics of a player.
     * 
     * @param player The player to set the statistics of.
     * @param stats The new statistics to give the player.
     */
    static SetPlayerStatistics(player: server.Player, stats: PlayerStats) {
        server.world.setDynamicProperty(`${player.name}:mw:wins`, stats.wins || 0);
        server.world.setDynamicProperty(`${player.name}:mw:kills`, stats.kills || 0);
        server.world.setDynamicProperty(`${player.name}:mw:deaths`, stats.deaths || 0);
    }

    /**
     * Set all statistics of a player.
     * 
     * @param player The player to set the statistics of.
     * @param stat The statistic to change.
     * @param value The value to set the statistic to.
     */
    static SetPlayerStat(player: server.Player, stat: string | PlayerStatType, value: string | number | boolean | server.Vector3) {
        server.world.setDynamicProperty(`${player.name}:mw:${stat}`, value);
    }

    /**
     * Adds a singular win to a player.
     * 
     * @param player The player to add a win to.
     */
    static AddWin(player: server.Player) {
        let wins = server.world.getDynamicProperty(`${player.name}:mw:wins`) as number || 0;
        server.world.setDynamicProperty(`${player.name}:mw:wins`, wins + 1);
    }

    /**
     * Returns a list of all player's statistics (not sorted yet)
     * 
     * @param players The list of players to check.
     * @param stat The statistic to check.
     * 
     * @returns The list of all player's statistics.
     */
    static GetSpecificLeaderboard(players: server.Player[], stat: string | PlayerStatType) {
        let leaderboard = new Map<server.Player, string | number | boolean | server.Vector3>()
        for (const player of players) {
            leaderboard.set(player, PlayerUtils.GetPlayerStat(player, stat));
        }
        return leaderboard;
    }

    /* HELPER FUNCTIONS */

    /**
     * Displays text to the action bar for the players given.
     */
    static DisplayTextToPlayers(players: Map<String, server.Player> | server.Player[], text: string) {
        if (players instanceof Map) {
            players.forEach((v, k) => {
                v.onScreenDisplay.setActionBar(text);
            })
        } else {
            for (let i = 0; i < players.length; i++) {
                players[i].onScreenDisplay.setActionBar(text);
            }
        }
    }

    /**
     * Clears the inventory of the given player.
     * 
     * @param player The player whose inventory to clear.
     */
    static ClearInventory(player: server.Player) {
        let plrInv = player.getComponent(server.EntityComponentTypes.Inventory) as server.EntityInventoryComponent;
        let plrEqp = player.getComponent(server.EntityComponentTypes.Equippable) as server.EntityEquippableComponent;

        // clear inventory
        plrInv.container.clearAll();
        // clear equipment
        plrEqp.setEquipment(server.EquipmentSlot.Head, new server.ItemStack("minecraft:air"));
        plrEqp.setEquipment(server.EquipmentSlot.Chest, new server.ItemStack("minecraft:air"));
        plrEqp.setEquipment(server.EquipmentSlot.Legs, new server.ItemStack("minecraft:air"));
        plrEqp.setEquipment(server.EquipmentSlot.Feet, new server.ItemStack("minecraft:air"));
        plrEqp.setEquipment(server.EquipmentSlot.Offhand, new server.ItemStack("minecraft:air"));
    }

    /**
     * Toggle if a player is ready or not
     * 
     * @param player The player to update their status.
     */
    static TogglePlayerReady(player: server.Player) {
        let currStatus = player.hasTag("ready");
        if (!currStatus) {
            player.addTag("ready");
            player.onScreenDisplay.setActionBar(`You are ready to play!`)
        } else {
            player.removeTag("ready")
            player.onScreenDisplay.setActionBar(`You are no longer ready.`)
        }
    }

    /**
     * Changes the ready status of a player.
     * 
     * @param player The player to update their status.
     * @param ready The status to change to.
     */
    static SetPlayerReady(player: server.Player, ready: boolean = false) {
        let currStatus = player.hasTag("ready");
        if ((currStatus && ready) || (!currStatus && !ready)) {
            // Not changing status, don't send a message
        } else if (currStatus && !ready) {
            // No longer ready, send a message
            player.onScreenDisplay.setActionBar(`You are no longer ready.`);
        } else if (!currStatus && ready) {
            // Is now ready, send a message
            player.onScreenDisplay.setActionBar(`You are ready to play!`);
        }
    }

    /**
     * Gets all ready players in the world
     * 
     * @returns A list of all ready players
     */
    static GetReadyPlayers() {
        return server.world.getPlayers({ tags: ["ready"] });
    }

}

export type PlayerStats = {
    wins?: number,
    kills?: number,
    deaths?: number,
}

export enum PlayerStatType {
    "wins" = "wins",
    "kills" = "kills",
    "deaths" = "deaths"
}