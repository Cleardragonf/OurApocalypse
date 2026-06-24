import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { VANILLA_DROP_ITEM_OPTIONS } from "../registryOptions";
import type {
  ApocalypseConfig,
  ScheduledCommandDefinition,
  ScheduledCommandParameterDefinition,
  ScheduledEvent,
  ScheduledEventKind,
  ScheduledEventStep,
  ScheduledEventStepType,
  ScheduledEventTargetMode,
  ItemDropPartyItemRule,
  ModEventCenterMode,
  ExperienceProvider,
} from "../types";

const ITEM_DISPLAY_TOOLTIP = "Minecraft items display without the minecraft: prefix; modded IDs keep their namespace. The saved config still stores the full registry ID.";

type ParameterValue = string | number | boolean;
type ParameterValues = Record<string, ParameterValue>;

const TARGET_TOKEN_OPTIONS = [
  { value: "@p", label: "@p nearest player" },
  { value: "@a", label: "@a all players" },
  { value: "@r", label: "@r random player" },
  { value: "@s", label: "@s command source" },
  {
    value: "%target_player%",
    label: "%target_player% event target placeholder",
  },
];

const ENTITY_OPTIONS = [
  "minecraft:zombie",
  "minecraft:skeleton",
  "minecraft:creeper",
  "minecraft:spider",
  "minecraft:cave_spider",
  "minecraft:enderman",
  "minecraft:witch",
  "minecraft:husk",
  "minecraft:drowned",
  "minecraft:stray",
  "minecraft:slime",
  "minecraft:pillager",
  "minecraft:vindicator",
  "minecraft:evoker",
  "minecraft:ravager",
  "minecraft:phantom",
  "minecraft:blaze",
  "minecraft:magma_cube",
  "minecraft:wither_skeleton",
  "minecraft:zoglin",
  "minecraft:ghast",
];

const EFFECT_OPTIONS = [
  "minecraft:speed",
  "minecraft:slowness",
  "minecraft:haste",
  "minecraft:mining_fatigue",
  "minecraft:strength",
  "minecraft:instant_health",
  "minecraft:instant_damage",
  "minecraft:jump_boost",
  "minecraft:nausea",
  "minecraft:regeneration",
  "minecraft:resistance",
  "minecraft:fire_resistance",
  "minecraft:water_breathing",
  "minecraft:invisibility",
  "minecraft:blindness",
  "minecraft:night_vision",
  "minecraft:hunger",
  "minecraft:weakness",
  "minecraft:poison",
  "minecraft:wither",
  "minecraft:health_boost",
  "minecraft:absorption",
  "minecraft:saturation",
  "minecraft:glowing",
  "minecraft:levitation",
  "minecraft:luck",
  "minecraft:bad_omen",
  "minecraft:hero_of_the_village",
  "minecraft:darkness",
];

const PARTICLE_OPTIONS = [
  "minecraft:flame",
  "minecraft:smoke",
  "minecraft:large_smoke",
  "minecraft:explosion",
  "minecraft:campfire_cosy_smoke",
  "minecraft:soul_fire_flame",
  "minecraft:ash",
  "minecraft:witch",
  "minecraft:portal",
  "minecraft:dragon_breath",
  "minecraft:angry_villager",
  "minecraft:happy_villager",
];

const SOUND_OPTIONS = [
  "minecraft:entity.ender_dragon.growl",
  "minecraft:entity.wither.spawn",
  "minecraft:entity.lightning_bolt.thunder",
  "minecraft:ambient.cave",
  "minecraft:block.portal.trigger",
  "minecraft:entity.ghast.scream",
  "minecraft:entity.zombie.ambient",
  "minecraft:entity.creeper.primed",
];

const BLOCK_OPTIONS = [
  "minecraft:air",
  "minecraft:fire",
  "minecraft:cobweb",
  "minecraft:stone",
  "minecraft:cobblestone",
  "minecraft:dirt",
  "minecraft:netherrack",
  "minecraft:blackstone",
  "minecraft:obsidian",
  "minecraft:diamond_block",
  "minecraft:gold_block",
  "minecraft:emerald_block",
  "minecraft:redstone_block",
  "minecraft:lava",
  "minecraft:water",
];

const PLAYER_SELECTOR_OPTIONS = TARGET_TOKEN_OPTIONS.map((option) => option.value);

const FALLBACK_COMMAND_DEFINITIONS: ScheduledCommandDefinition[] = [
  {
    key: "difficulty",
    name: "Difficulty",
    description: "Changes the server difficulty.",
    parameters: [
      {
        key: "level",
        label: "Difficulty",
        type: "SELECT",
        options: ["peaceful", "easy", "normal", "hard"],
        defaultValue: "normal",
        required: true,
      },
    ],
  },
  {
    key: "gamemode",
    name: "Game Mode",
    description: "Changes a player's game mode.",
    parameters: [
      {
        key: "mode",
        label: "Game Mode",
        type: "SELECT",
        options: ["survival", "creative", "adventure", "spectator"],
        defaultValue: "survival",
        required: true,
      },
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@p",
      },
    ],
  },
  {
    key: "time",
    name: "Time",
    description: "Sets, adds, or queries world time.",
    parameters: [
      {
        key: "action",
        label: "Action",
        type: "SELECT",
        options: ["set", "add", "query"],
        defaultValue: "set",
        required: true,
      },
      {
        key: "value",
        label: "Value",
        type: "SELECT",
        options: [
          "day",
          "noon",
          "night",
          "midnight",
          "0",
          "6000",
          "12000",
          "18000",
          "daytime",
          "gametime",
        ],
        defaultValue: "night",
        required: true,
      },
    ],
  },
  {
    key: "weather",
    name: "Weather",
    description: "Changes weather and optional duration.",
    parameters: [
      {
        key: "weather",
        label: "Weather",
        type: "SELECT",
        options: ["clear", "rain", "thunder"],
        defaultValue: "thunder",
        required: true,
      },
      {
        key: "duration",
        label: "Duration Ticks",
        type: "NUMBER",
        defaultValue: 600,
      },
    ],
  },
  {
    key: "give",
    name: "Give Item",
    description: "Gives an item to one or more players.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@p",
        required: true,
      },
      {
        key: "item",
        label: "Item",
        type: "SELECT",
        options: VANILLA_DROP_ITEM_OPTIONS,
        defaultValue: "minecraft:diamond_block",
        required: true,
      },
      {
        key: "count",
        label: "Count",
        type: "NUMBER",
        defaultValue: 1,
      },
    ],
  },
  {
    key: "summon",
    name: "Summon Entity",
    description: "Summons an entity at a position.",
    parameters: [
      {
        key: "entity",
        label: "Entity",
        type: "SELECT",
        options: ENTITY_OPTIONS,
        defaultValue: "minecraft:zombie",
        required: true,
      },
      {
        key: "position",
        label: "Position",
        type: "STRING",
        defaultValue: "~ ~ ~",
        placeholder: "~ ~ ~",
      },
      {
        key: "nbt",
        label: "NBT JSON",
        type: "STRING",
        defaultValue: "",
        placeholder: "{CustomName:'{\"text\":\"Boss\"}'}",
      },
    ],
  },
  {
    key: "effect",
    name: "Potion Effect",
    description: "Applies or clears a status effect.",
    parameters: [
      {
        key: "action",
        label: "Action",
        type: "SELECT",
        options: ["give", "clear"],
        defaultValue: "give",
        required: true,
      },
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@p",
        required: true,
      },
      {
        key: "effect",
        label: "Effect",
        type: "SELECT",
        options: EFFECT_OPTIONS,
        defaultValue: "minecraft:strength",
      },
      {
        key: "seconds",
        label: "Seconds",
        type: "NUMBER",
        defaultValue: 60,
      },
      {
        key: "amplifier",
        label: "Amplifier",
        type: "NUMBER",
        defaultValue: 1,
      },
      {
        key: "hideParticles",
        label: "Hide Particles",
        type: "BOOLEAN",
        defaultValue: true,
      },
    ],
  },
  {
    key: "title",
    name: "Title",
    description: "Shows a title, subtitle, or actionbar message.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@a",
        required: true,
      },
      {
        key: "slot",
        label: "Display Slot",
        type: "SELECT",
        options: ["title", "subtitle", "actionbar", "clear", "reset"],
        defaultValue: "title",
        required: true,
      },
      {
        key: "text",
        label: "JSON Text",
        type: "STRING",
        defaultValue: '{"text":"The apocalypse begins","color":"red"}',
      },
    ],
  },
  {
    key: "tellraw",
    name: "Tellraw Message",
    description: "Sends a JSON chat message.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@a",
        required: true,
      },
      {
        key: "json",
        label: "JSON Text",
        type: "STRING",
        defaultValue: '{"text":"Apocalypse event","color":"gold"}',
        required: true,
      },
    ],
  },
  {
    key: "playsound",
    name: "Play Sound",
    description: "Plays a sound to players.",
    parameters: [
      {
        key: "sound",
        label: "Sound",
        type: "SELECT",
        options: SOUND_OPTIONS,
        defaultValue: "minecraft:entity.wither.spawn",
        required: true,
      },
      {
        key: "source",
        label: "Source",
        type: "SELECT",
        options: [
          "master",
          "music",
          "record",
          "weather",
          "hostile",
          "neutral",
          "player",
          "ambient",
          "voice",
        ],
        defaultValue: "hostile",
      },
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@a",
      },
      {
        key: "position",
        label: "Position",
        type: "STRING",
        defaultValue: "~ ~ ~",
      },
      {
        key: "volume",
        label: "Volume",
        type: "NUMBER",
        defaultValue: 1,
      },
      {
        key: "pitch",
        label: "Pitch",
        type: "NUMBER",
        defaultValue: 1,
      },
    ],
  },
  {
    key: "particle",
    name: "Particle",
    description: "Spawns particles at a location.",
    parameters: [
      {
        key: "particle",
        label: "Particle",
        type: "SELECT",
        options: PARTICLE_OPTIONS,
        defaultValue: "minecraft:soul_fire_flame",
        required: true,
      },
      {
        key: "position",
        label: "Position",
        type: "STRING",
        defaultValue: "~ ~1 ~",
      },
      {
        key: "delta",
        label: "Delta XYZ",
        type: "STRING",
        defaultValue: "0.5 0.5 0.5",
      },
      {
        key: "speed",
        label: "Speed",
        type: "NUMBER",
        defaultValue: 0.02,
      },
      {
        key: "count",
        label: "Count",
        type: "NUMBER",
        defaultValue: 30,
      },
    ],
  },
  {
    key: "setblock",
    name: "Set Block",
    description: "Places a block at one position.",
    parameters: [
      {
        key: "position",
        label: "Position",
        type: "STRING",
        defaultValue: "~ ~ ~",
        required: true,
      },
      {
        key: "block",
        label: "Block",
        type: "SELECT",
        options: BLOCK_OPTIONS,
        defaultValue: "minecraft:fire",
        required: true,
      },
      {
        key: "mode",
        label: "Mode",
        type: "SELECT",
        options: ["replace", "destroy", "keep"],
        defaultValue: "replace",
      },
    ],
  },
  {
    key: "fill",
    name: "Fill Blocks",
    description: "Fills an area with a block.",
    parameters: [
      {
        key: "from",
        label: "From Position",
        type: "STRING",
        defaultValue: "~-3 ~ ~-3",
        required: true,
      },
      {
        key: "to",
        label: "To Position",
        type: "STRING",
        defaultValue: "~3 ~ ~3",
        required: true,
      },
      {
        key: "block",
        label: "Block",
        type: "SELECT",
        options: BLOCK_OPTIONS,
        defaultValue: "minecraft:fire",
        required: true,
      },
      {
        key: "mode",
        label: "Mode",
        type: "SELECT",
        options: ["replace", "destroy", "keep", "hollow", "outline"],
        defaultValue: "replace",
      },
    ],
  },
  {
    key: "tp",
    name: "Teleport",
    description: "Teleports targets to another target or position.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "%target_player%",
        required: true,
      },
      {
        key: "destination",
        label: "Destination",
        type: "STRING",
        defaultValue: "~ ~ ~",
        required: true,
      },
    ],
  },
  {
    key: "kill",
    name: "Kill",
    description: "Kills entities matching the target selector.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "STRING",
        defaultValue: "@e[type=minecraft:zombie,distance=..32]",
        required: true,
      },
    ],
  },
  {
    key: "clear",
    name: "Clear Inventory",
    description: "Clears items from players.",
    parameters: [
      {
        key: "target",
        label: "Target",
        type: "SELECT",
        options: PLAYER_SELECTOR_OPTIONS,
        defaultValue: "@p",
      },
      {
        key: "item",
        label: "Optional Item",
        type: "SELECT",
        options: VANILLA_DROP_ITEM_OPTIONS,
        defaultValue: "",
      },
      {
        key: "maxCount",
        label: "Max Count",
        type: "NUMBER",
        defaultValue: 0,
        helperText: "0 means leave count blank.",
      },
    ],
  },
  {
    key: "say",
    name: "Say",
    description: "Broadcasts a plain server message.",
    parameters: [
      {
        key: "message",
        label: "Message",
        type: "STRING",
        defaultValue: "Apocalypse event started",
        required: true,
      },
    ],
  },
  {
    key: "raw",
    name: "Raw Command",
    description: "Advanced: type the rest of the command manually.",
    parameters: [
      {
        key: "command",
        label: "Full Command",
        type: "STRING",
        defaultValue: "/say Apocalypse event command",
        required: true,
        helperText: "Use this when a command is not in the structured list yet.",
      },
    ],
  },
];

const STEP_TYPE_LABELS: Record<ScheduledEventStepType, string> = {
  COMMAND: "Command",
  WAIT: "Wait",
  STOP: "Stop",
  TARGET_PLAYER: "Target Player",
};

const TARGET_MODE_LABELS: Record<ScheduledEventTargetMode, string> = {
  NEAREST_PLAYER: "Nearest Player",
  RANDOM_PLAYER: "Random Player",
  ALL_PLAYERS: "All Players",
  SPECIFIC_PLAYER: "Specific Player",
  EVENT_PLAYER: "Event Player",
};

const EVENT_KIND_LABELS: Record<ScheduledEventKind, string> = {
  COMMAND_SEQUENCE: "Command Sequence",
  ITEM_DROP_PARTY: "Item Drop Party",
  EXPERIENCE_FARM: "Experience Farm",
};

const CENTER_MODE_LABELS: Record<ModEventCenterMode, string> = {
  TARGET_PLAYER: "Around Target Player",
  WORLD_SPAWN: "Around World Spawn",
  SPECIFIC_COORDINATES: "Specific Coordinates",
};

const EXPERIENCE_PROVIDER_LABELS: Record<ExperienceProvider, string> = {
  VANILLA_XP: "Vanilla XP Command",
  OURMAGIC_API: "OurMagic giveEXP API",
};

type Props = {
  config: ApocalypseConfig;
  commandRegistry: string[];
  refreshCommandRegistry: () => void;
  fetchCommandSuggestions: (input: string) => Promise<string[]>;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultParameterValue(parameter: ScheduledCommandParameterDefinition): ParameterValue {
  if (parameter.defaultValue !== undefined) return parameter.defaultValue;
  if (parameter.type === "NUMBER") return 0;
  if (parameter.type === "BOOLEAN") return false;
  return "";
}

function defaultParameterValues(definition: ScheduledCommandDefinition): ParameterValues {
  return definition.parameters.reduce<ParameterValues>((values, parameter) => {
    values[parameter.key] = defaultParameterValue(parameter);
    return values;
  }, {});
}

function getDefinitionKey(step: ScheduledEventStep): string {
  if (step.commandKey) return step.commandKey;
  const command = (step.command ?? "").trim();
  if (!command) return "say";
  const withoutSlash = command.replace(/^\//, "");
  return withoutSlash.split(/\s+/)[0] || "say";
}

function defaultStep(type: ScheduledEventStepType = "COMMAND"): ScheduledEventStep {
  if (type === "WAIT") return { id: newId("step"), type, waitTicks: 20 };
  if (type === "STOP") return { id: newId("step"), type };
  if (type === "TARGET_PLAYER") {
    return {
      id: newId("step"),
      type,
      targetMode: "NEAREST_PLAYER",
      targetPlayerName: "",
    };
  }
  const definition = FALLBACK_COMMAND_DEFINITIONS.find((entry) => entry.key === "say") ?? FALLBACK_COMMAND_DEFINITIONS[0];
  const commandArgs = defaultParameterValues(definition);
  return {
    id: newId("step"),
    type,
    commandKey: definition.key,
    commandArgs,
    command: buildCommandLine(definition, commandArgs),
  };
}

function defaultDropPartyItem(): ItemDropPartyItemRule {
  return {
    id: newId("drop-party-item"),
    enabled: true,
    item: "minecraft:bread",
    weight: 50,
    minCount: 1,
    maxCount: 2,
    chance: 1,
  };
}

function defaultItemDropPartySettings() {
  return {
    targetMode: "RANDOM_PLAYER" as ScheduledEventTargetMode,
    targetPlayerName: "",
    centerMode: "TARGET_PLAYER" as ModEventCenterMode,
    x: 0,
    y: 90,
    z: 0,
    radius: 24,
    durationTicks: 800,
    intervalTicks: 20,
    maxItemsPerInterval: 10,
    announce: true,
    items: [
      defaultDropPartyItem(),
      { ...defaultDropPartyItem(), id: newId("drop-party-item"), item: "minecraft:iron_ingot", weight: 20, maxCount: 3, chance: 0.8 },
    ],
  };
}

function defaultExperienceFarmSettings() {
  return {
    targetMode: "ALL_PLAYERS" as ScheduledEventTargetMode,
    targetPlayerName: "",
    provider: "OURMAGIC_API" as ExperienceProvider,
    amountPerInterval: 5,
    durationTicks: 1200,
    intervalTicks: 100,
    multiplier: 1.5,
    reason: "experience-farm-event",
    announce: true,
  };
}

function newEvent(): ScheduledEvent {
  const suffix = Date.now().toString(36);
  return {
    id: `event-${suffix}`,
    name: `Scheduled Event ${suffix}`,
    enabled: true,
    minDay: 1,
    maxDay: 30,
    chance: 1,
    cooldownTicks: 0,
    runOncePerNight: true,
    eventKind: "COMMAND_SEQUENCE",
    itemDropParty: defaultItemDropPartySettings(),
    experienceFarm: defaultExperienceFarmSettings(),
    steps: [defaultStep("COMMAND")],
  };
}

function normalizeCommand(value: string): string {
  const trimmed = value.trimStart();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function compactParts(parts: Array<string | number | boolean | undefined | null>): string[] {
  return parts
    .map((part) => (part === undefined || part === null ? "" : String(part).trim()))
    .filter((part) => part.length > 0);
}

function buildCommandLine(definition: ScheduledCommandDefinition, args: ParameterValues): string {
  const value = (key: string) => args[key];
  const stringValue = (key: string) => String(value(key) ?? "").trim();
  const numberValue = (key: string) => Number(value(key));

  if (definition.key === "raw") return normalizeCommand(stringValue("command"));
  if (definition.key === "difficulty") return `/${definition.key} ${stringValue("level")}`;
  if (definition.key === "gamemode") return `/${definition.key} ${stringValue("mode")} ${stringValue("target")}`.trim();
  if (definition.key === "time") return `/${definition.key} ${stringValue("action")} ${stringValue("value")}`.trim();
  if (definition.key === "weather") return `/${definition.key} ${stringValue("weather")} ${stringValue("duration")}`.trim();
  if (definition.key === "give") return `/${definition.key} ${stringValue("target")} ${stringValue("item")} ${stringValue("count")}`.trim();
  if (definition.key === "summon") {
    return compactParts(["/summon", value("entity"), value("position"), value("nbt")]).join(" ");
  }
  if (definition.key === "effect") {
    if (stringValue("action") === "clear") {
      return compactParts(["/effect", "clear", value("target"), value("effect")]).join(" ");
    }
    return compactParts([
      "/effect",
      "give",
      value("target"),
      value("effect"),
      value("seconds"),
      value("amplifier"),
      value("hideParticles"),
    ]).join(" ");
  }
  if (definition.key === "title") {
    const slot = stringValue("slot");
    if (slot === "clear" || slot === "reset") return `/title ${stringValue("target")} ${slot}`;
    return compactParts(["/title", value("target"), slot, value("text")]).join(" ");
  }
  if (definition.key === "tellraw") return compactParts(["/tellraw", value("target"), value("json")]).join(" ");
  if (definition.key === "playsound") {
    return compactParts([
      "/playsound",
      value("sound"),
      value("source"),
      value("target"),
      value("position"),
      value("volume"),
      value("pitch"),
    ]).join(" ");
  }
  if (definition.key === "particle") {
    return compactParts([
      "/particle",
      value("particle"),
      value("position"),
      value("delta"),
      value("speed"),
      value("count"),
    ]).join(" ");
  }
  if (definition.key === "setblock") {
    return compactParts(["/setblock", value("position"), value("block"), value("mode")]).join(" ");
  }
  if (definition.key === "fill") {
    return compactParts(["/fill", value("from"), value("to"), value("block"), value("mode")]).join(" ");
  }
  if (definition.key === "tp" || definition.key === "teleport") {
    return compactParts([`/${definition.key}`, value("target"), value("destination")]).join(" ");
  }
  if (definition.key === "kill") return compactParts(["/kill", value("target")]).join(" ");
  if (definition.key === "clear") {
    const maxCount = numberValue("maxCount");
    return compactParts([
      "/clear",
      value("target"),
      value("item"),
      maxCount > 0 ? maxCount : "",
    ]).join(" ");
  }
  if (definition.key === "say") return compactParts(["/say", value("message")]).join(" ");

  return compactParts([`/${definition.key}`, value("rawArgs")]).join(" ");
}

function createUnknownCommandDefinition(command: string): ScheduledCommandDefinition {
  const key = command.replace(/^\//, "");
  return {
    key,
    name: formatLabel(key),
    description: "Live command registry entry. Arguments are currently configured as raw text.",
    parameters: [
      {
        key: "rawArgs",
        label: "Arguments",
        type: "STRING",
        defaultValue: "",
        helperText: "This command is available on the server, but no structured UI schema exists for its arguments yet.",
      },
    ],
  };
}

function buildDefinitions(commandRegistry: string[]): ScheduledCommandDefinition[] {
  const byKey = new Map<string, ScheduledCommandDefinition>();
  FALLBACK_COMMAND_DEFINITIONS.forEach((definition) => byKey.set(definition.key, definition));
  commandRegistry.forEach((command) => {
    const key = command.replace(/^\//, "");
    if (!byKey.has(key)) byKey.set(key, createUnknownCommandDefinition(key));
  });
  return [...byKey.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function sanitizeArgs(definition: ScheduledCommandDefinition, current: ParameterValues | undefined): ParameterValues {
  const next = defaultParameterValues(definition);
  Object.entries(current ?? {}).forEach(([key, value]) => {
    if (definition.parameters.some((parameter) => parameter.key === key)) {
      next[key] = value;
    }
  });
  return next;
}

function displayRegistryId(option: string): string {
  return option.startsWith("minecraft:") ? option.slice("minecraft:".length) : option;
}

function stepSummary(step: ScheduledEventStep): string {
  if (step.type === "COMMAND") return step.command || "/command";
  if (step.type === "WAIT") return `wait ${step.waitTicks ?? 0} ticks`;
  if (step.type === "TARGET_PLAYER") return `target ${TARGET_MODE_LABELS[step.targetMode ?? "NEAREST_PLAYER"]}`;
  return "stop event";
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ScheduledEventsEditor({
  config,
  commandRegistry,
  refreshCommandRegistry,
  updateConfig,
}: Props) {
  const events = config.scheduledEvents?.events ?? [];
  const [selectedEventId, setSelectedEventId] = useState(() => events[0]?.id ?? "");
  const [thenTypeByStepId, setThenTypeByStepId] = useState<Record<string, ScheduledEventStepType>>({});
  const [eventIdDraft, setEventIdDraft] = useState("");
  const [eventIdError, setEventIdError] = useState("");

  const commandDefinitions = useMemo(() => buildDefinitions(commandRegistry), [commandRegistry]);
  const commandDefinitionByKey = useMemo(() => {
    return new Map(commandDefinitions.map((definition) => [definition.key, definition]));
  }, [commandDefinitions]);

  const selectedEvent = useMemo(() => {
    return events.find((event) => event.id === selectedEventId) ?? events[0];
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) return;
    setEventIdDraft(selectedEvent.id);
    setEventIdError("");
  }, [selectedEvent?.id]);

  const commitEventId = (event: ScheduledEvent) => {
    const nextId = eventIdDraft.trim();
    if (!nextId) {
      setEventIdDraft(event.id);
      setEventIdError("Event ID cannot be blank.");
      return;
    }
    if (nextId === event.id) {
      setEventIdError("");
      return;
    }
    if (events.some((entry) => entry.id === nextId && entry.id !== event.id)) {
      setEventIdDraft(event.id);
      setEventIdError("That Event ID is already used by another event.");
      return;
    }
    updateConfig((draft) => {
      draft.scheduledEvents.events = (draft.scheduledEvents.events ?? []).map((entry) =>
        entry.id === event.id ? { ...entry, id: nextId } : entry,
      );
    });
    setSelectedEventId(nextId);
    setEventIdError("");
  };

  const updateScheduledSettings = (patch: Partial<ApocalypseConfig["scheduledEvents"]>) => {
    updateConfig((draft) => {
      draft.scheduledEvents = {
        ...(draft.scheduledEvents ?? { enabled: true, events: [] }),
        ...patch,
      };
    });
  };

  const updateEvent = (eventId: string, patch: Partial<ScheduledEvent>) => {
    updateConfig((draft) => {
      draft.scheduledEvents.events = (draft.scheduledEvents.events ?? []).map((event) =>
        event.id === eventId ? { ...event, ...patch } : event,
      );
    });
  };


  const updateItemDropParty = (eventId: string, patch: Partial<ScheduledEvent["itemDropParty"]>) => {
    updateConfig((draft) => {
      draft.scheduledEvents.events = (draft.scheduledEvents.events ?? []).map((event) =>
        event.id === eventId
          ? { ...event, itemDropParty: { ...(event.itemDropParty ?? defaultItemDropPartySettings()), ...patch } }
          : event,
      );
    });
  };

  const updateExperienceFarm = (eventId: string, patch: Partial<ScheduledEvent["experienceFarm"]>) => {
    updateConfig((draft) => {
      draft.scheduledEvents.events = (draft.scheduledEvents.events ?? []).map((event) =>
        event.id === eventId
          ? { ...event, experienceFarm: { ...(event.experienceFarm ?? defaultExperienceFarmSettings()), ...patch } }
          : event,
      );
    });
  };

  const updateDropPartyItems = (eventId: string, items: ItemDropPartyItemRule[]) => {
    updateItemDropParty(eventId, { items });
  };

  const updateSteps = (eventId: string, steps: ScheduledEventStep[]) => {
    updateEvent(eventId, { steps });
  };

  const addEvent = () => {
    const event = newEvent();
    updateConfig((draft) => {
      draft.scheduledEvents.events = [...(draft.scheduledEvents.events ?? []), event];
    });
    setSelectedEventId(event.id);
  };

  const duplicateEvent = (event: ScheduledEvent) => {
    const copy: ScheduledEvent = {
      ...JSON.parse(JSON.stringify(event)),
      id: newId("event"),
      name: `${event.name} Copy`,
      eventKind: event.eventKind ?? "COMMAND_SEQUENCE",
      itemDropParty: event.itemDropParty ?? defaultItemDropPartySettings(),
      experienceFarm: event.experienceFarm ?? defaultExperienceFarmSettings(),
      steps: (event.steps ?? []).map((step) => ({ ...step, id: newId("step") })),
    };
    updateConfig((draft) => {
      draft.scheduledEvents.events = [...(draft.scheduledEvents.events ?? []), copy];
    });
    setSelectedEventId(copy.id);
  };

  const removeEvent = (eventId: string) => {
    const next = events.filter((event) => event.id !== eventId);
    updateConfig((draft) => {
      draft.scheduledEvents.events = next;
    });
    setSelectedEventId(next[0]?.id ?? "");
  };

  const insertStepAfter = (eventId: string, afterIndex: number, type: ScheduledEventStepType) => {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    const next = [...event.steps];
    next.splice(afterIndex + 1, 0, defaultStep(type));
    updateSteps(eventId, next);
  };

  const changeCommandDefinition = (eventId: string, stepIndex: number, definition: ScheduledCommandDefinition) => {
    const args = defaultParameterValues(definition);
    const command = buildCommandLine(definition, args);
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    updateSteps(
      eventId,
      event.steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              commandKey: definition.key,
              commandArgs: args,
              command,
            }
          : step,
      ),
    );
  };

  const changeParameter = (
    eventId: string,
    stepIndex: number,
    definition: ScheduledCommandDefinition,
    parameter: ScheduledCommandParameterDefinition,
    value: ParameterValue,
  ) => {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    updateSteps(
      eventId,
      event.steps.map((step, index) => {
        if (index !== stepIndex) return step;
        const args = sanitizeArgs(definition, step.commandArgs as ParameterValues | undefined);
        args[parameter.key] = value;
        return {
          ...step,
          commandKey: definition.key,
          commandArgs: args,
          command: buildCommandLine(definition, args),
        };
      }),
    );
  };

  const insertTargetToken = (eventId: string, stepIndex: number, token: string) => {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    const nextSteps = event.steps.map((step, index) => {
      if (index !== stepIndex) return step;
      const definition = commandDefinitionByKey.get(getDefinitionKey(step)) ?? createUnknownCommandDefinition(getDefinitionKey(step));
      const args = sanitizeArgs(definition, step.commandArgs as ParameterValues | undefined);
      const targetParameter = definition.parameters.find((parameter) => parameter.key.toLowerCase().includes("target"));
      if (targetParameter) {
        args[targetParameter.key] = token;
        return {
          ...step,
          commandKey: definition.key,
          commandArgs: args,
          command: buildCommandLine(definition, args),
        };
      }
      const rawDefinition = commandDefinitionByKey.get("raw") ?? FALLBACK_COMMAND_DEFINITIONS.find((entry) => entry.key === "raw")!;
      const current = step.command ?? "/";
      const separator = current.endsWith(" ") || current === "/" ? "" : " ";
      const rawArgs = { command: `${current}${separator}${token}` };
      return {
        ...step,
        commandKey: rawDefinition.key,
        commandArgs: rawArgs,
        command: buildCommandLine(rawDefinition, rawArgs),
      };
    });
    updateSteps(eventId, nextSteps);
  };

  const renderParameterInput = (
    eventId: string,
    stepIndex: number,
    definition: ScheduledCommandDefinition,
    step: ScheduledEventStep,
    parameter: ScheduledCommandParameterDefinition,
  ) => {
    const args = sanitizeArgs(definition, step.commandArgs as ParameterValues | undefined);
    const value = args[parameter.key] ?? defaultParameterValue(parameter);

    if (parameter.type === "BOOLEAN") {
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(event) =>
                changeParameter(eventId, stepIndex, definition, parameter, event.target.checked)
              }
            />
          }
          label={parameter.label}
        />
      );
    }

    if (parameter.type === "SELECT") {
      const options = parameter.options ?? [];
      return (
        <Autocomplete
          freeSolo
          options={options}
          value={String(value ?? "")}
          onChange={(_, selected) =>
            changeParameter(eventId, stepIndex, definition, parameter, selected ?? "")
          }
          onInputChange={(_, input, reason) => {
            if (reason !== "input") return;
            changeParameter(eventId, stepIndex, definition, parameter, input);
          }}
          filterOptions={(availableOptions, state) => {
            const query = state.inputValue.toLowerCase();
            if (!query) return availableOptions.slice(0, 100);
            return availableOptions
              .filter((option) =>
                `${option} ${displayRegistryId(option)}`.toLowerCase().includes(query),
              )
              .slice(0, 100);
          }}
          getOptionLabel={(option) => displayRegistryId(option)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={parameter.label}
              placeholder={parameter.placeholder}
              helperText={parameter.helperText}
            />
          )}
        />
      );
    }

    return (
      <TextField
        fullWidth
        type={parameter.type === "NUMBER" ? "number" : "text"}
        label={parameter.label}
        value={value}
        placeholder={parameter.placeholder}
        helperText={parameter.helperText}
        inputProps={parameter.type === "NUMBER" ? { step: 0.01 } : undefined}
        onChange={(event) =>
          changeParameter(
            eventId,
            stepIndex,
            definition,
            parameter,
            parameter.type === "NUMBER" ? numberValue(event.target.value, Number(value) || 0) : event.target.value,
          )
        }
      />
    );
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", lg: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Scheduled Events
          </Typography>
          <Typography color="text.secondary">
            Build event scripts as ordered steps. Command steps now use a registry-style builder with
            separate parameters instead of one Minecraft chat-style text box.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={refreshCommandRegistry}>
            Load Command Registry
          </Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addEvent}>
            Add Event
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info">
        This is modeled after the frontend/backend registry pattern: choose a command definition, then fill in
        its parameters. Live server commands without a structured schema still appear with a raw arguments field.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.scheduledEvents?.enabled ?? true}
                      onChange={(event) => updateScheduledSettings({ enabled: event.target.checked })}
                    />
                  }
                  label="Scheduled Events Enabled"
                />
                <Divider />
                <Typography variant="subtitle2" fontWeight={800}>
                  Events
                </Typography>
                <Stack spacing={1}>
                  {events.map((event) => (
                    <Button
                      key={event.id}
                      variant={event.id === selectedEvent?.id ? "contained" : "outlined"}
                      color={event.enabled ? "primary" : "inherit"}
                      onClick={() => setSelectedEventId(event.id)}
                      sx={{ justifyContent: "flex-start", textAlign: "left" }}
                    >
                      {event.name}
                    </Button>
                  ))}
                  {events.length === 0 && (
                    <Typography color="text.secondary" variant="body2">
                      No events yet.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {!selectedEvent ? (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography fontWeight={800}>No scheduled event selected.</Typography>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={addEvent}>
                    Create First Event
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={900}>
                        {selectedEvent.name}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                        <Chip size="small" label={`Days ${selectedEvent.minDay}-${selectedEvent.maxDay}`} />
                        <Chip size="small" label={`${Math.round((selectedEvent.chance ?? 1) * 100)}% chance`} />
                        <Chip size="small" label={`${selectedEvent.steps.length} steps`} />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<ContentCopyIcon />} onClick={() => duplicateEvent(selectedEvent)}>
                        Duplicate
                      </Button>
                      <Button color="error" startIcon={<DeleteIcon />} onClick={() => removeEvent(selectedEvent.id)}>
                        Delete
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Event Name"
                        value={selectedEvent.name}
                        onChange={(event) => updateEvent(selectedEvent.id, { name: event.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Event ID"
                        value={eventIdDraft}
                        error={Boolean(eventIdError)}
                        helperText={eventIdError || "Updates after blur or Enter so the page does not jump while typing."}
                        onChange={(event) => {
                          setEventIdDraft(event.target.value);
                          setEventIdError("");
                        }}
                        onBlur={() => commitEventId(selectedEvent)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitEventId(selectedEvent);
                            event.currentTarget.blur();
                          }
                          if (event.key === "Escape") {
                            setEventIdDraft(selectedEvent.id);
                            setEventIdError("");
                            event.currentTarget.blur();
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Event Type</InputLabel>
                        <Select
                          label="Event Type"
                          value={selectedEvent.eventKind ?? "COMMAND_SEQUENCE"}
                          onChange={(event) => {
                            const eventKind = event.target.value as ScheduledEventKind;
                            updateEvent(selectedEvent.id, {
                              eventKind,
                              itemDropParty: selectedEvent.itemDropParty ?? defaultItemDropPartySettings(),
                              experienceFarm: selectedEvent.experienceFarm ?? defaultExperienceFarmSettings(),
                              steps: selectedEvent.steps ?? [],
                            });
                          }}
                        >
                          {(Object.keys(EVENT_KIND_LABELS) as ScheduledEventKind[]).map((kind) => (
                            <MenuItem key={kind} value={kind}>{EVENT_KIND_LABELS[kind]}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Min Day"
                        value={selectedEvent.minDay}
                        onChange={(event) =>
                          updateEvent(selectedEvent.id, {
                            minDay: numberValue(event.target.value, selectedEvent.minDay),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Day"
                        value={selectedEvent.maxDay}
                        onChange={(event) =>
                          updateEvent(selectedEvent.id, {
                            maxDay: numberValue(event.target.value, selectedEvent.maxDay),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ step: 0.01, min: 0, max: 1 }}
                        label="Chance 0-1"
                        value={selectedEvent.chance}
                        onChange={(event) =>
                          updateEvent(selectedEvent.id, {
                            chance: numberValue(event.target.value, selectedEvent.chance),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Cooldown Ticks"
                        value={selectedEvent.cooldownTicks}
                        onChange={(event) =>
                          updateEvent(selectedEvent.id, {
                            cooldownTicks: numberValue(event.target.value, selectedEvent.cooldownTicks),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedEvent.enabled}
                            onChange={(event) => updateEvent(selectedEvent.id, { enabled: event.target.checked })}
                          />
                        }
                        label="Enabled"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedEvent.runOncePerNight}
                            onChange={(event) =>
                              updateEvent(selectedEvent.id, { runOncePerNight: event.target.checked })
                            }
                          />
                        }
                        label="Once Per Night"
                      />
                    </Grid>
                  </Grid>

                  <Divider />

                  {(selectedEvent.eventKind ?? "COMMAND_SEQUENCE") === "ITEM_DROP_PARTY" && (() => {
                    const party = selectedEvent.itemDropParty ?? defaultItemDropPartySettings();
                    return (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={900}>Item Drop Party</Typography>
                          <Typography color="text.secondary" variant="body2">
                            Mod-owned event: items fall from the sky around the chosen player/location.
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Target Players</InputLabel>
                              <Select label="Target Players" value={party.targetMode} onChange={(event) => updateItemDropParty(selectedEvent.id, { targetMode: event.target.value as ScheduledEventTargetMode })}>
                                {(Object.keys(TARGET_MODE_LABELS) as ScheduledEventTargetMode[]).map((mode) => <MenuItem key={mode} value={mode}>{TARGET_MODE_LABELS[mode]}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Drop Center</InputLabel>
                              <Select label="Drop Center" value={party.centerMode} onChange={(event) => updateItemDropParty(selectedEvent.id, { centerMode: event.target.value as ModEventCenterMode })}>
                                {(Object.keys(CENTER_MODE_LABELS) as ModEventCenterMode[]).map((mode) => <MenuItem key={mode} value={mode}>{CENTER_MODE_LABELS[mode]}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth label="Specific Player" value={party.targetPlayerName} disabled={party.targetMode !== "SPECIFIC_PLAYER"} onChange={(event) => updateItemDropParty(selectedEvent.id, { targetPlayerName: event.target.value })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Radius" value={party.radius} onChange={(event) => updateItemDropParty(selectedEvent.id, { radius: numberValue(event.target.value, party.radius) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="X" value={party.x} disabled={party.centerMode !== "SPECIFIC_COORDINATES"} onChange={(event) => updateItemDropParty(selectedEvent.id, { x: numberValue(event.target.value, party.x) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Y" value={party.y} disabled={party.centerMode !== "SPECIFIC_COORDINATES"} onChange={(event) => updateItemDropParty(selectedEvent.id, { y: numberValue(event.target.value, party.y) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Z" value={party.z} disabled={party.centerMode !== "SPECIFIC_COORDINATES"} onChange={(event) => updateItemDropParty(selectedEvent.id, { z: numberValue(event.target.value, party.z) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Duration Ticks" value={party.durationTicks} onChange={(event) => updateItemDropParty(selectedEvent.id, { durationTicks: numberValue(event.target.value, party.durationTicks) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Interval Ticks" value={party.intervalTicks} onChange={(event) => updateItemDropParty(selectedEvent.id, { intervalTicks: numberValue(event.target.value, party.intervalTicks) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Max Items / Interval" value={party.maxItemsPerInterval} onChange={(event) => updateItemDropParty(selectedEvent.id, { maxItemsPerInterval: numberValue(event.target.value, party.maxItemsPerInterval) })} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <FormControlLabel control={<Switch checked={party.announce} onChange={(event) => updateItemDropParty(selectedEvent.id, { announce: event.target.checked })} />} label="Announce" />
                          </Grid>
                        </Grid>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant="subtitle2" fontWeight={800}>Drop Items</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={() => updateDropPartyItems(selectedEvent.id, [...(party.items ?? []), defaultDropPartyItem()])}>Add Drop Item</Button>
                        </Stack>
                        {(party.items ?? []).map((itemRule, itemIndex) => (
                          <Grid container spacing={2} key={itemRule.id} alignItems="center">
                            <Grid item xs={12} md={1}><FormControlLabel control={<Switch checked={itemRule.enabled} onChange={(event) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, enabled: event.target.checked } : entry))} />} label="" /></Grid>
                            <Grid item xs={12} md={4}>
                              <Autocomplete
                                freeSolo
                                options={VANILLA_DROP_ITEM_OPTIONS}
                                value={itemRule.item}
                                onChange={(_, selected) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, item: selected ?? "" } : entry))}
                                onInputChange={(_, input, reason) => { if (reason === "input") updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, item: input } : entry)); }}
                                filterOptions={(availableOptions, state) => {
                                  const query = state.inputValue.toLowerCase();
                                  if (!query) return availableOptions.slice(0, 100);
                                  return availableOptions.filter((option) => `${option} ${displayRegistryId(option)}`.toLowerCase().includes(query)).slice(0, 100);
                                }}
                                getOptionLabel={displayRegistryId}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label={`Item ${itemIndex + 1}`}
                                    InputProps={{
                                      ...params.InputProps,
                                      endAdornment: (
                                        <>
                                          <Tooltip title={ITEM_DISPLAY_TOOLTIP} arrow>
                                            <HelpOutlineIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                                          </Tooltip>
                                          {params.InputProps.endAdornment}
                                        </>
                                      )
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={6} md={1}><TextField fullWidth type="number" label="Weight" value={itemRule.weight} onChange={(event) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, weight: numberValue(event.target.value, itemRule.weight) } : entry))} /></Grid>
                            <Grid item xs={6} md={1}><TextField fullWidth type="number" label="Min" value={itemRule.minCount} onChange={(event) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, minCount: numberValue(event.target.value, itemRule.minCount) } : entry))} /></Grid>
                            <Grid item xs={6} md={1}><TextField fullWidth type="number" label="Max" value={itemRule.maxCount} onChange={(event) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, maxCount: numberValue(event.target.value, itemRule.maxCount) } : entry))} /></Grid>
                            <Grid item xs={6} md={2}><TextField fullWidth type="number" inputProps={{ step: 0.01, min: 0, max: 1 }} label="Chance" value={itemRule.chance} onChange={(event) => updateDropPartyItems(selectedEvent.id, party.items.map((entry) => entry.id === itemRule.id ? { ...entry, chance: numberValue(event.target.value, itemRule.chance) } : entry))} /></Grid>
                            <Grid item xs={12} md={2}><Button color="error" startIcon={<DeleteIcon />} onClick={() => updateDropPartyItems(selectedEvent.id, party.items.filter((entry) => entry.id !== itemRule.id))}>Remove</Button></Grid>
                          </Grid>
                        ))}
                        {(party.items ?? []).length === 0 && <Alert severity="warning">Add at least one item for the drop party.</Alert>}
                      </Stack>
                    );
                  })()}

                  {(selectedEvent.eventKind ?? "COMMAND_SEQUENCE") === "EXPERIENCE_FARM" && (() => {
                    const farm = selectedEvent.experienceFarm ?? defaultExperienceFarmSettings();
                    return (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={900}>Experience Farm</Typography>
                          <Typography color="text.secondary" variant="body2">
                            Mod-owned event: gives players an XP boost over time. OurMagic can be selected now and wired to giveEXP once that endpoint is finalized.
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>Target Players</InputLabel>
                              <Select label="Target Players" value={farm.targetMode} onChange={(event) => updateExperienceFarm(selectedEvent.id, { targetMode: event.target.value as ScheduledEventTargetMode })}>
                                {(Object.keys(TARGET_MODE_LABELS) as ScheduledEventTargetMode[]).map((mode) => <MenuItem key={mode} value={mode}>{TARGET_MODE_LABELS[mode]}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                              <InputLabel>XP Provider</InputLabel>
                              <Select label="XP Provider" value={farm.provider} onChange={(event) => updateExperienceFarm(selectedEvent.id, { provider: event.target.value as ExperienceProvider })}>
                                {(Object.keys(EXPERIENCE_PROVIDER_LABELS) as ExperienceProvider[]).map((provider) => <MenuItem key={provider} value={provider}>{EXPERIENCE_PROVIDER_LABELS[provider]}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth label="Specific Player" value={farm.targetPlayerName} disabled={farm.targetMode !== "SPECIFIC_PLAYER"} onChange={(event) => updateExperienceFarm(selectedEvent.id, { targetPlayerName: event.target.value })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="XP / Interval" value={farm.amountPerInterval} onChange={(event) => updateExperienceFarm(selectedEvent.id, { amountPerInterval: numberValue(event.target.value, farm.amountPerInterval) })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Duration Ticks" value={farm.durationTicks} onChange={(event) => updateExperienceFarm(selectedEvent.id, { durationTicks: numberValue(event.target.value, farm.durationTicks) })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Interval Ticks" value={farm.intervalTicks} onChange={(event) => updateExperienceFarm(selectedEvent.id, { intervalTicks: numberValue(event.target.value, farm.intervalTicks) })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" inputProps={{ step: 0.1 }} label="XP Multiplier" value={farm.multiplier} onChange={(event) => updateExperienceFarm(selectedEvent.id, { multiplier: numberValue(event.target.value, farm.multiplier) })} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <FormControlLabel control={<Switch checked={farm.announce} onChange={(event) => updateExperienceFarm(selectedEvent.id, { announce: event.target.checked })} />} label="Announce" />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Reason / OurMagic Source" value={farm.reason} onChange={(event) => updateExperienceFarm(selectedEvent.id, { reason: event.target.value })} />
                          </Grid>
                        </Grid>
                      </Stack>
                    );
                  })()}

                  <Divider />

                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900}>
                          Command Sequence
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Each row runs in order. Command rows are built from a command plus parameters.
                        </Typography>
                      </Box>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={() => updateSteps(selectedEvent.id, [...selectedEvent.steps, defaultStep("COMMAND")])}
                      >
                        Add Command Step
                      </Button>
                    </Stack>

                    {selectedEvent.steps.map((step, index) => {
                      const definitionKey = getDefinitionKey(step);
                      const definition =
                        commandDefinitionByKey.get(definitionKey) ?? createUnknownCommandDefinition(definitionKey);
                      const args = sanitizeArgs(definition, step.commandArgs as ParameterValues | undefined);
                      const thenType = thenTypeByStepId[step.id] ?? "COMMAND";

                      return (
                        <Card key={step.id} variant="outlined">
                          <CardContent>
                            <Stack spacing={2}>
                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                alignItems={{ xs: "stretch", md: "center" }}
                                spacing={1}
                              >
                                <Chip label={`Step ${index + 1}`} />
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                  <InputLabel>Step Type</InputLabel>
                                  <Select
                                    label="Step Type"
                                    value={step.type}
                                    onChange={(event) => {
                                      const type = event.target.value as ScheduledEventStepType;
                                      const nextSteps = selectedEvent.steps.map((entry, rowIndex) =>
                                        rowIndex === index ? { ...defaultStep(type), id: entry.id } : entry,
                                      );
                                      updateSteps(selectedEvent.id, nextSteps);
                                    }}
                                  >
                                    {(Object.keys(STEP_TYPE_LABELS) as ScheduledEventStepType[]).map((type) => (
                                      <MenuItem key={type} value={type}>
                                        {STEP_TYPE_LABELS[type]}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
                                  {stepSummary(step)}
                                </Typography>
                                <IconButton
                                  color="error"
                                  onClick={() =>
                                    updateSteps(
                                      selectedEvent.id,
                                      selectedEvent.steps.filter((_, rowIndex) => rowIndex !== index),
                                    )
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>

                              {step.type === "COMMAND" && (
                                <Stack spacing={2}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={5}>
                                      <Autocomplete
                                        options={commandDefinitions}
                                        value={definition}
                                        isOptionEqualToValue={(option, value) => option.key === value.key}
                                        getOptionLabel={(option) => `${option.name} /${option.key}`}
                                        onChange={(_, selected) => {
                                          if (selected) changeCommandDefinition(selectedEvent.id, index, selected);
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="Command"
                                            helperText="Registry-style command selection. Pick the command first, then fill parameters."
                                          />
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={7}>
                                      <TextField
                                        fullWidth
                                        label="Generated Command Preview"
                                        value={buildCommandLine(definition, args)}
                                        InputProps={{ readOnly: true }}
                                        helperText={definition.description}
                                      />
                                    </Grid>
                                  </Grid>

                                  {definition.parameters.length > 0 && (
                                    <Grid container spacing={2}>
                                      {definition.parameters.map((parameter) => (
                                        <Grid item xs={12} md={parameter.type === "STRING" ? 6 : 4} key={parameter.key}>
                                          {renderParameterInput(selectedEvent.id, index, definition, step, parameter)}
                                        </Grid>
                                      ))}
                                    </Grid>
                                  )}

                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {TARGET_TOKEN_OPTIONS.map((token) => (
                                      <Button
                                        key={token.value}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => insertTargetToken(selectedEvent.id, index, token.value)}
                                      >
                                        {token.label}
                                      </Button>
                                    ))}
                                  </Stack>
                                </Stack>
                              )}

                              {step.type === "WAIT" && (
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Wait Ticks"
                                      value={step.waitTicks ?? 20}
                                      helperText="20 ticks = 1 second"
                                      onChange={(event) => {
                                        const nextSteps = selectedEvent.steps.map((entry, rowIndex) =>
                                          rowIndex === index
                                            ? { ...entry, waitTicks: numberValue(event.target.value, step.waitTicks ?? 20) }
                                            : entry,
                                        );
                                        updateSteps(selectedEvent.id, nextSteps);
                                      }}
                                    />
                                  </Grid>
                                </Grid>
                              )}

                              {step.type === "TARGET_PLAYER" && (
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                      <InputLabel>Target Mode</InputLabel>
                                      <Select
                                        label="Target Mode"
                                        value={step.targetMode ?? "NEAREST_PLAYER"}
                                        onChange={(event) => {
                                          const nextSteps = selectedEvent.steps.map((entry, rowIndex) =>
                                            rowIndex === index
                                              ? {
                                                  ...entry,
                                                  targetMode: event.target.value as ScheduledEventTargetMode,
                                                }
                                              : entry,
                                          );
                                          updateSteps(selectedEvent.id, nextSteps);
                                        }}
                                      >
                                        {(Object.keys(TARGET_MODE_LABELS) as ScheduledEventTargetMode[]).map((mode) => (
                                          <MenuItem key={mode} value={mode}>
                                            {TARGET_MODE_LABELS[mode]}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <TextField
                                      fullWidth
                                      label="Specific Player Name"
                                      value={step.targetPlayerName ?? ""}
                                      disabled={(step.targetMode ?? "NEAREST_PLAYER") !== "SPECIFIC_PLAYER"}
                                      onChange={(event) => {
                                        const nextSteps = selectedEvent.steps.map((entry, rowIndex) =>
                                          rowIndex === index ? { ...entry, targetPlayerName: event.target.value } : entry,
                                        );
                                        updateSteps(selectedEvent.id, nextSteps);
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <TextField
                                      fullWidth
                                      label="Placeholder"
                                      value="%target_player%"
                                      InputProps={{ readOnly: true }}
                                      helperText="Use this token inside later command steps."
                                    />
                                  </Grid>
                                </Grid>
                              )}

                              {step.type === "STOP" && (
                                <Alert severity="warning">
                                  This ends the event sequence. Steps after this are ignored once execution support is added.
                                </Alert>
                              )}

                              <Divider />

                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                  <InputLabel>Then...</InputLabel>
                                  <Select
                                    label="Then..."
                                    value={thenType}
                                    onChange={(event) =>
                                      setThenTypeByStepId((prev) => ({
                                        ...prev,
                                        [step.id]: event.target.value as ScheduledEventStepType,
                                      }))
                                    }
                                  >
                                    {(Object.keys(STEP_TYPE_LABELS) as ScheduledEventStepType[]).map((type) => (
                                      <MenuItem key={type} value={type}>
                                        {STEP_TYPE_LABELS[type]}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Button startIcon={<AddIcon />} onClick={() => insertStepAfter(selectedEvent.id, index, thenType)}>
                                  Add After This Step
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
