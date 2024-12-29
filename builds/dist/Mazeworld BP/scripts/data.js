export const setBonuses = {
    "clown": {
        "helmet": "mw:clown_helmet",
        "chestplate": "mw:clown_chestplate",
        "leggings": "mw:clown_leggings",
        "boots": "mw:clown_boots",
        "effects": [
            { "type": "strength", "amplifier": 1 },
            { "type": "hunger", "amplifier": 2 },
            { "type": "slowness", "amplifier": 1 },
        ]
    },
    "emerald": {
        "helmet": "mw:emerald_helmet",
        "chestplate": "mw:emerald_chestplate",
        "leggings": "mw:emerald_leggings",
        "boots": "mw:emerald_boots",
        "effects": [
            { "type": "health_boost", "amplifier": 1 },
        ]
    },
    "fur": {
        "helmet": "mw:fur_helmet",
        "chestplate": "mw:fur_chestplate",
        "leggings": "mw:fur_leggings",
        "boots": "mw:fur_boots",
        "effects": [
            { "type": "saturation", "amplifier": 1 },
        ]
    },
    "firefighter": {
        "helmet": "mw:firefighter_helmet",
        "chestplate": "mw:firefighter_chestplate",
        "leggings": "mw:firefighter_leggings",
        "boots": "mw:firefighter_boots",
        "effects": [
            { "type": "fire_resistance", "amplifier": 2 }
        ]
    },
    "reaper": {
        "helmet": "mw:reaper_helmet",
        "chestplate": "mw:reaper_chestplate",
        "leggings": "mw:reaper_leggings",
        "boots": "mw:reaper_boots",
        "effects": [
            { "type": "health_boost", "amplifier": 1 },
        ]
    },
    "samurai": {
        "helmet": "mw:samurai_helmet",
        "chestplate": "mw:samurai_chestplate",
        "leggings": "mw:samurai_leggings",
        "boots": "mw:samurai_boots",
        "effects": [
            { "type": "speed", "amplifier": 1 }
        ]
    },
    "warden": {
        "helmet": "mw:warden_helmet",
        "chestplate": "mw:warden_chestplate",
        "leggings": "mw:warden_leggings",
        "boots": "mw:warden_boots",
        "effects": [
            { "type": "resistance", "amplifier": 2 },
            { "type": "blindness", "amplifier": 1 },
        ]
    },
}

// TODO: Make this work?
export const weaponEffects = {
    "mw:balloon": {
        "setType": "clown",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "quick",    // linger for long effects that apply to target, quick for short effects that apply to player
                    "effectType": "strength",
                    "target": "player",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "quick",
                    "effectType": "strength",
                    "target": "player",
                    "amplifier": 2,
                }
            },
            {
                "type": "passive",
                "baseEffect": {
                    "type": "effect",
                    "effectType": "slow_falling",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "effectType": "slow_falling",
                    "amplifier": 2,
                }
            }
        ]
    },
    "mw:emerald_sword": {
        "setType": "emerald",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "poison",
                    "target": "target",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "poison",
                    "target": "target",
                    "amplifier": 2,
                }
            }
        ]
    },
    "mw:fire_axe": {
        "setType": "firefighter",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "fire",
                    "duration": "linger",
                    "durationMultiplier": 1
                },
                "setEffect": {
                    "type": "fire",
                    "duration": "linger",
                    "durationMultiplier": 2
                }
            },
        ]
    },
    "mw:ice_katana": {
        "setType": "fur",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "slowness",
                    "target": "target",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "slowness",
                    "target": "target",
                    "amplifier": 2,
                }
            }
        ]
    },
    "mw:iron_katana": {
        "setType": "samurai",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "speed",
                    "target": "player",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "speed",
                    "target": "player",
                    "amplifier": 2,
                }
            }
        ]
    },
    "mw:reaper_scythe": {
        "setType": "reaper",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "quick",
                    "effectType": "regeneration",
                    "target": "player",
                    "amplifier": 3,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "linger",
                    "effectType": "regeneration",
                    "target": "player",
                    "amplifier": 3,
                }
            }
        ]
    },
    "mw:sword_of_haste": {
        "setType": "warden",
        "effects": [
            {
                "type": "hit",
                "baseEffect": {
                    "type": "effect",
                    "duration": "quick",
                    "effectType": "haste",
                    "target": "player",
                    "amplifier": 1,
                },
                "setEffect": {
                    "type": "effect",
                    "duration": "quick",
                    "effectType": "haste",
                    "target": "player",
                    "amplifier": 2,
                }
            }
        ]
    }
}