# Apocalypse Mobs

A Forge **1.20.1 server-side-only** apocalypse/wave controller inspired by Bukkit-style Monster Apocalypse plugins.

Players do **not** need this mod installed as long as you keep the project vanilla-client-safe:

- vanilla mobs only
- vanilla blocks only
- vanilla items only
- no custom registries
- no client screens
- no client-only packets

This project includes:

- Forge 1.20.1 server mod
- React + TypeScript + MUI admin dashboard
- UI-owned config stored in browser localStorage
- offline-usable Current and Config pages
- REST/polling communication with the mod, **not WebSocket**
- night wave director
- **legacy + nightly weighted wave profiles**
- **legacy + nightly weighted entity spawn profiles**
- weighted hostile entity randomizer
- per-entity spawn chance after selection
- per-profile mob property modifiers, such as stronger zombies in specific entity pools
- day 1-30 difficulty scaling
- configurable wave count and wave size
- block breaking behavior
- configurable mob placement block palette
- block placing / bridging behavior
- placed-block ledger for rollback/cleanup
- nightly weighted drop profiles
- JSON import/export

---

## Repo layout

```text
apocalypse-mobs/
  forge-server-mod/      Forge 1.20.1 server mod
  admin-ui/              React admin dashboard
  sample-config/         Example config JSON
```

---

## Build the Forge mod

Requirements:

- Java 17
- Gradle installed, or import this folder into IntelliJ/VS Code with Gradle support
- Internet access for the first Gradle dependency download
- Forge 1.20.1 server

```bash
cd forge-server-mod
gradle build
```

The jar will be under:

```text
forge-server-mod/build/libs/
```

Copy the built jar to your Forge server's `mods/` folder.

---

## Run the React admin UI

```bash
cd admin-ui
npm install
npm run dev
```

Then open the Vite URL, usually:

```text
http://localhost:5173
```

The UI is usable even when the Minecraft server/mod is offline. The config is owned by the UI and stored in browser localStorage.

Default mod REST API:

```text
http://127.0.0.1:8766
```

Default token:

```text
change-me-now
```

Change the token before exposing anything beyond your local machine.

---

## How config sync works now

There is **no WebSocket in this version**.

```text
React UI localStorage config
        ↓
REST PUT /api/config when the mod is reachable
        ↓
Forge mod applies and saves config
```

If the mod is offline:

- Current page still opens
- Config page still opens
- edits still save locally
- JSON import/export still works
- UI polls periodically
- latest config applies when the mod REST API becomes reachable

The mod exposes these admin endpoints:

```text
GET  /api/status
GET  /api/config
PUT  /api/config
POST /api/reload-config
GET  /api/placed-blocks?limit=500
POST /api/rollback/placed-blocks?limit=250
POST /api/rollback/placed-blocks?all=true
```

The UI sends the token in:

```text
x-apocalypse-token: change-me-now
```

---

## How waves and entity spawning work

Waves, entity spawning, and drops all use the same profile idea, but they are three independent rolls. Wave profiles never affect the drop-profile chance calculation, entity profiles never affect the drop-profile chance calculation, and drop profiles never affect wave/entity selection.

```text
LEGACY_RULES     old flat config behavior
NIGHT_PROFILES   recommended profile-based behavior
```

### Wave profiles

`waves.activeMode` controls how wave count and wave size are selected.

In `LEGACY_RULES`, the old day-1/day-30 fields are used:

```text
minWavesDay1 / maxWavesDay1
minWavesDay30 / maxWavesDay30
minMobsDay1 / maxMobsDay1
minMobsDay30 / maxMobsDay30
```

In `NIGHT_PROFILES`, the mod rolls one weighted wave profile per Minecraft night from wave profiles that are active on that same day. The UI chance preview for a wave profile only compares it against other active wave profiles for that selected day. Each wave profile has its own:

```text
id
name
enabled
minDay
maxDay
weight
minWaves / maxWaves
minMobs / maxMobs
spawnRadiusMin / spawnRadiusMax
maxSpawnAttemptsPerMob
spawnAroundEachPlayer
avoidCreativeAndSpectator
announceWaves
```

That means night 12 could roll a normal `Midnight Surge`, while another night in the same range could roll a rare `Blood Moon Wave`.

### Entity spawn profiles

`entitySpawning.activeMode` controls which hostile entity pool is used.

In `LEGACY_RULES`, every spawn attempt uses `entitySpawning.legacyWeights`. The legacy top-level `entityWeights` field is still mirrored for older configs.

In `NIGHT_PROFILES`, the mod rolls one weighted entity pool from entity profiles that are active on that same day. Then every individual spawn attempt rolls inside that selected pool. The entity-profile chance preview only compares it against other active entity profiles, not wave or drop profiles.

Example entity entry inside a profile:

```json
{
  "entity": "minecraft:ghast",
  "weight": 30,
  "minDay": 24,
  "spawnChance": 0.35,
  "enabled": true
}
```

There are now **two rolls** for each spawn attempt:

```text
1. Selection roll: weight decides which entity is picked.
2. Confirmation roll: spawnChance decides whether that picked entity actually spawns.
```

If the selected entity pool totals 100 and Ghast has weight 30, Ghast has a 30% selection chance. If Ghast also has `spawnChance: 0.35`, then its rough per-attempt chance inside that selected profile is:

```text
30% selection chance × 35% spawn chance = 10.5% actual chance per spawn attempt
```


### Per-profile mob properties

Entity rows can now include optional `properties`. This lets the same mob behave differently depending on which entity profile spawned it.

Entity rows are selected from a dropdown in the UI instead of typed freehand. This prevents the table row from re-rendering/unfocusing on every keypress and also makes sure special-goal options are recalculated only after the selected mob changes.

Example: a zombie in `Overworld Pack` can be normal, while a zombie in `Raider Night` can have more health, more damage, faster movement, and extra armor.

```json
{
  "entity": "minecraft:zombie",
  "weight": 18,
  "minDay": 1,
  "spawnChance": 1.0,
  "enabled": true,
  "properties": {
    "enabled": true,
    "maxHealthMode": "RANGED",
    "maxHealth": 28,
    "maxHealthMin": 24,
    "maxHealthMax": 34,
    "attackDamageMode": "FIXED",
    "attackDamage": 4,
    "movementSpeedMode": "FIXED",
    "movementSpeed": 0.27,
    "followRangeMode": "FIXED",
    "followRange": 40,
    "armorMode": "FIXED",
    "armor": 2,
    "armorToughnessMode": "FIXED",
    "armorToughness": 0,
    "knockbackResistanceMode": "FIXED",
    "knockbackResistance": 0,
    "stepHeightMode": "RANGED",
    "stepHeightMin": 0.6,
    "stepHeightMax": 1.05,
    "persistent": false,
    "customName": ""
  }
}
```

These are applied after the mob is created and finalized, using vanilla server-side attributes. Clients still do not need Apocalypse Mobs installed.

Numeric mob properties now support two modes:

```text
FIXED   uses the exact value field every time this entity row spawns a mob
RANGED  rolls a random value between the matching Min and Max fields for each spawned mob
```

This applies to max health, attack damage, movement speed, follow range, armor, armor toughness, knockback resistance, and step height. These are absolute set values, not multipliers. `0` leaves that property vanilla/unchanged. Step height values around `1.0` help mobs step onto full blocks more easily.

Special goals also live under `properties`, but they are entity-specific. The UI only shows a special goal when the selected entity can actually use it, and the Forge side ignores unsupported special-goal flags as a safety fallback. Each goal has its own enabled flag plus a percentage chance, so enabling a special goal does not mean it fires every time.

```json
{
  "entity": "minecraft:skeleton",
  "weight": 20,
  "minDay": 1,
  "spawnChance": 1.0,
  "enabled": true,
  "properties": {
    "explodingArrows": true,
    "explodingArrowChance": 0.12,
    "explodingArrowPower": 1.8,
    "explodingArrowBreakBlocks": true
  }
}
```

Current special goals:

```text
Exploding arrows          skeletons/strays/pillagers/arrow shooters can make arrows explode on impact
Creeper wall explosions   creepers can use a controlled explosion against a blocking wall
Enderman teleports        endermen can move a targeted player to a nearby safe location
Spider webs players       spiders can place cobwebs at/on the targeted player; these web blocks are tracked in the rollback ledger
```

UI meaning:

```text
Props       enables/disables this row's mob property modifiers
Max health    sets max health to an exact value or a rolled ranged value
Damage        sets attack damage when the mob has that attribute
Speed         sets movement speed
Range         sets follow/target range when available
Armor         sets armor
Step height   optionally overrides how high the mob can step up; supports fixed or ranged
Persistent    prevents normal despawn
Special goals are shown only for compatible entities, each with an enabled checkbox and a 0-100% chance field
```

`entitySpawning.failedChanceBehavior` controls what happens when a selected entity fails the spawn chance roll:

```text
SKIP_SPAWN     the spawn attempt produces no mob
REROLL_ENTITY  try another weighted entity before giving up
```

This means waves can target 30 spawn attempts, but the final mob count may be lower when `SKIP_SPAWN` is used and some selected entities fail their spawn chance roll.

---

## How mob-placed block cleanup works

The mod now has two separate block systems.

### 1. Placement palette

This is the list of blocks mobs are allowed to place when bridging or building upward:

```json
"placementBlocks": [
  { "block": "minecraft:cobblestone", "weight": 80, "minDay": 1, "enabled": true },
  { "block": "minecraft:dirt", "weight": 35, "minDay": 1, "enabled": true },
  { "block": "minecraft:netherrack", "weight": 25, "minDay": 16, "enabled": true },
  { "block": "minecraft:blackstone", "weight": 10, "minDay": 22, "enabled": true }
]
```

The active palette is weighted by day, just like mob selection.

### 2. Placement ledger

Every time a mob places a block, the mod records it in:

```text
config/apocalypse-mobs-placed-blocks.json
```

Each record contains:

```text
id
dimension
x, y, z
previousBlock
placedBlock
reason
entityType
entityUuid
gameTime
createdAt
rolledBack
rolledBackAt
notes
```

Rollback is intentionally safe by default. The mod only removes the block if the current block still matches the recorded `placedBlock`. So if a player later edits that location, rollback should skip it instead of deleting the player's work.

Cleanup config:

```json
"cleanup": {
  "enabled": true,
  "trackPlacedBlocks": true,
  "rollbackOnlyIfBlockStillMatches": true,
  "rollbackOnServerStart": false,
  "maxLedgerEntries": 20000,
  "maxRollbackPerRequest": 2000
}
```

---

## How nightly drops work

Drops use **nightly weighted drop profiles**.

That means different nights can have different drop behavior.

Example profiles:

```text
Nights 1-9: Scraps
Nights 10-19: Supplies
Nights 10-30: Rare Blood Moon
Nights 20-30: Endgame Relics
```

Each profile has:

```text
id
name
enabled
minDay
maxDay
weight
overrideVanillaDrops
rules[]
```

The mod chooses one active drop profile per Minecraft world-day/night key using only drop profiles that are active on that same day. Overlapping drop-profile day ranges are allowed, so you can create rare event nights. Wave profiles and entity profiles are separate rolls and do not affect this drop-profile percentage.

Example:

```json
{
  "id": "blood-moon-rare",
  "name": "Nights 10-30: Rare Blood Moon",
  "enabled": true,
  "minDay": 10,
  "maxDay": 30,
  "weight": 12,
  "overrideVanillaDrops": false,
  "rules": [
    {
      "entity": "*",
      "item": "minecraft:emerald",
      "minCount": 1,
      "maxCount": 2,
      "chance": 0.1,
      "minDay": 10,
      "enabled": true
    }
  ]
}
```

The drop-rule `entity` field is a dropdown in the UI. Choose a specific hostile entity id, or choose `All hostile mobs (*)` to write `*` into the config and apply that rule to every hostile mob.

The drop-rule `item` field is an autocomplete/dropdown. When the mod REST API is online, the UI can load the live Forge item registry from:

```text
GET /api/registry/items
```

That gives the UI every loaded item id, including items from other Forge mods. The UI also has an offline fallback list of common vanilla items and still allows typed custom ids, so editing works even while the mod is offline.

`activeMode` can be:

```text
NIGHT_PROFILES   recommended
LEGACY_RULES     old behavior, always evaluates the flat rules list
```

---

## Difficulty day modes

`REAL_MONTH_DAY`:

- June 1 = difficulty 1
- June 15 = difficulty 15
- June 30 = difficulty 30
- June 31 clamps to 30

`WORLD_DAY_CYCLE`:

- Uses Minecraft world day modulo 30
- Useful for long-running worlds where you want repeated 1-30 cycles

`MANUAL`:

- Uses `manualDifficultyDay`
- Useful for testing

---

## Safety notes

Block breaking and placing can be very destructive if you make it too aggressive. Keep these enabled:

```json
"protectSpawnRadius": 24,
"protectedBlocks": [
  "minecraft:bedrock",
  "minecraft:obsidian",
  "minecraft:end_portal_frame",
  "minecraft:command_block",
  "minecraft:barrier"
]
```

Also keep this true unless you intentionally want a risky cleanup mode:

```json
"rollbackOnlyIfBlockStillMatches": true
```

---

## Current status of this generated project

This is a source-code starter package. It has not been compiled in this environment because Forge/Gradle dependencies are not available here. Build it locally with Java 17 and Gradle.

### Drop item selector

The Drops page item field uses an autocomplete. When the mod is online, the UI loads the live Forge item registry from `GET /api/registry/items`, which includes modded items. When the mod is offline, the UI falls back to a broad vanilla Minecraft 1.20.1 item list so common items like `stone_sword`, `diamond_block`, and tools/blocks still appear. Minecraft namespace items display as `diamond_block`, but the saved config still stores `minecraft:diamond_block`.

### Multi-page UI and Scheduled Events

The admin UI now has these top-level pages:

```text
Admin
Apocalypse
Scheduled Events
Clear Lag
```

`Admin` contains connection/status and core config settings, including the Mod REST API settings and OurMagic integration settings.

`Apocalypse` contains the mob gameplay controls: wave profiles, entity profiles, drops, mob cleanup/rollback, and raw JSON.

`Clear Lag` is a UI-ready configuration page for a future lag-cleanup scheduler. It stores settings for dropped items, XP orbs, projectiles, empty vehicles, warning/completion messages, interval timing, and item whitelist rules.

`Scheduled Events` is the first-pass event-sequence builder. Each event can contain ordered steps:

```text
COMMAND        run a server command
WAIT           wait a number of ticks before the next step
TARGET_PLAYER  set a target-player intent/placeholder for later commands
STOP           end the event sequence
```

Each command step now uses a registry-style command builder, similar to the older frontend/backend event registry flow: choose the command definition first, then fill separate parameter fields. For example, `Difficulty` shows a difficulty dropdown; `Give Item` shows target/item/count fields; `Summon Entity` shows entity/position/NBT fields.

When the mod REST API is online, the UI loads root server commands from:

```text
GET /api/registry/commands
```

Commands that do not yet have a structured UI schema still appear in the dropdown with a raw arguments field. The scheduled event model keeps both the generated `command` string and the structured `commandKey` / `commandArgs` values. The scheduled event model is saved into config under:

```json
"scheduledEvents": {
  "enabled": true,
  "events": []
}
```

This step adds the UI/config model and live command suggestion endpoints. Actual scheduled-event execution is intentionally left as the next server-side step.

### Mod-owned Scheduled Event types

Scheduled Events now support three event types:

```text
Command Sequence   ordered command/wait/target/stop steps
Item Drop Party    mod-owned event where configured items fall from the sky around players/location
Experience Farm    mod-owned XP boost event over a configured duration
```

`Item Drop Party` stores settings such as target mode, drop center, radius, duration, interval, max items per interval, and a weighted item list.

`Experience Farm` stores settings such as target mode, XP provider, XP per interval, duration, interval, multiplier, and reason/source.

The UI/config shape is ready for server-side execution. The actual timed executor can be wired next.

### OurMagic XP rewards inside Drops

OurMagic XP rewards are configured inside **Apocalypse → Drops**, not as a separate page.
Each drop rule has an **OurMagic XP** checkbox. When enabled, the UI shows a second line directly underneath that drop row with the XP reward settings.

```text
Drop profile
  Rule: zombie → iron_nugget
    OurMagic XP reward: killer gets 2-4 XP
```

The item drop and the OurMagic reward live in the same drop profile/rule, so they use the same entity/profile/min-day context. The reward has its own chance, XP min/max, target mode, and reason/source.

The fields are stored on the drop rule:

```json
{
  "entity": "minecraft:zombie",
  "item": "minecraft:iron_nugget",
  "minCount": 1,
  "maxCount": 2,
  "chance": 0.2,
  "minDay": 1,
  "enabled": true,
  "ourMagicRewardEnabled": true,
  "ourMagicRewardChance": 1,
  "ourMagicRewardTargetMode": "KILLER",
  "ourMagicRewardMinExperience": 2,
  "ourMagicRewardMaxExperience": 4,
  "ourMagicRewardReason": "early-scraps-zombie"
}
```

OurMagic API settings are edited in **Admin → Config → Core Config**, beside the Mod REST API settings. They are still stored under:

```json
"integrations": {
  "ourMagic": {
    "enabled": false,
    "baseUrl": "http://127.0.0.1:8767",
    "giveExperiencePath": "/api/experience/give",
    "token": "",
    "tokenHeader": "X-Admin-Token",
    "timeoutMillis": 3000
  }
}
```

The Drops page only controls per-rule reward rows. The OurMagic base URL, header, token, path, and timeout are centralized in the Admin → Config tab so they are not repeated inside Drops. Server-side calls to the final OurMagic `giveEXP` endpoint can be wired after that endpoint contract is finalized.
