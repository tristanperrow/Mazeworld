import * as server from "@minecraft/server"

export class PlayerUtils {

    /**
     * Gets all statistics of a player as an object.
     * 
     * @param player The player to get the statistics of.
     * 
     * @returns The statistics of a player, or null
     */
    static GetPlayerStatistics(player: server.Player) {
        let stats: PlayerStats;
        stats.wins = player.getDynamicProperty("mw:wins") as number || 0;
        stats.kills = player.getDynamicProperty("mw:kills") as number || 0;
        stats.deaths = player.getDynamicProperty("mw:deaths") as number || 0;
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
        return player.getDynamicProperty(`mw:${stat}`) || null;
    }

    /**
     * Set all statistics of a player.
     * 
     * @param player The player to set the statistics of.
     * @param stats The new statistics to give the player.
     */
    static SetPlayerStatistics(player: server.Player, stats: PlayerStats) {
        player.setDynamicProperty("mw:wins", stats.wins || 0);
        player.setDynamicProperty("mw:kills", stats.kills || 0);
        player.setDynamicProperty("mw:deaths", stats.deaths || 0);
    }

    /**
     * Set all statistics of a player.
     * 
     * @param player The player to set the statistics of.
     * @param stat The statistic to change.
     * @param value The value to set the statistic to.
     */
    static SetPlayerStat(player: server.Player, stat: string | PlayerStatType, value: string | number | boolean | server.Vector3) {
        // @ts-ignore
        player.setDynamicProperty(`mw:${stat}`, value);
    }

    /**
     * Adds a singular win to a player.
     * 
     * @param player The player to add a win to.
     */
    static AddWin(player: server.Player) {
        let wins = player.getDynamicProperty("mw:wins") as number || 0;
        player.setDynamicProperty("mw:wins", wins + 1);
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