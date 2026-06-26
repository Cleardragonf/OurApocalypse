export type EntityOption = { id: string; label: string; category: 'Hostile' | 'Passive' | 'Neutral' | 'Water' | 'Utility' | 'Player' };

export const VANILLA_ENTITY_OPTIONS: EntityOption[] = [
  { id: '*', label: 'All entities (*)', category: 'Utility' },
  { id: 'minecraft:player', label: 'Player', category: 'Player' },
  { id: 'minecraft:allay', label: 'Allay', category: 'Passive' },
  { id: 'minecraft:armadillo', label: 'Armadillo', category: 'Passive' },
  { id: 'minecraft:axolotl', label: 'Axolotl', category: 'Water' },
  { id: 'minecraft:bat', label: 'Bat', category: 'Passive' },
  { id: 'minecraft:bee', label: 'Bee', category: 'Neutral' },
  { id: 'minecraft:camel', label: 'Camel', category: 'Passive' },
  { id: 'minecraft:cat', label: 'Cat', category: 'Passive' },
  { id: 'minecraft:chicken', label: 'Chicken', category: 'Passive' },
  { id: 'minecraft:cod', label: 'Cod', category: 'Water' },
  { id: 'minecraft:cow', label: 'Cow', category: 'Passive' },
  { id: 'minecraft:dolphin', label: 'Dolphin', category: 'Water' },
  { id: 'minecraft:donkey', label: 'Donkey', category: 'Passive' },
  { id: 'minecraft:fox', label: 'Fox', category: 'Passive' },
  { id: 'minecraft:frog', label: 'Frog', category: 'Passive' },
  { id: 'minecraft:glow_squid', label: 'Glow Squid', category: 'Water' },
  { id: 'minecraft:goat', label: 'Goat', category: 'Neutral' },
  { id: 'minecraft:horse', label: 'Horse', category: 'Passive' },
  { id: 'minecraft:iron_golem', label: 'Iron Golem', category: 'Neutral' },
  { id: 'minecraft:llama', label: 'Llama', category: 'Neutral' },
  { id: 'minecraft:mooshroom', label: 'Mooshroom', category: 'Passive' },
  { id: 'minecraft:mule', label: 'Mule', category: 'Passive' },
  { id: 'minecraft:ocelot', label: 'Ocelot', category: 'Passive' },
  { id: 'minecraft:panda', label: 'Panda', category: 'Neutral' },
  { id: 'minecraft:parrot', label: 'Parrot', category: 'Passive' },
  { id: 'minecraft:pig', label: 'Pig', category: 'Passive' },
  { id: 'minecraft:polar_bear', label: 'Polar Bear', category: 'Neutral' },
  { id: 'minecraft:pufferfish', label: 'Pufferfish', category: 'Water' },
  { id: 'minecraft:rabbit', label: 'Rabbit', category: 'Passive' },
  { id: 'minecraft:salmon', label: 'Salmon', category: 'Water' },
  { id: 'minecraft:sheep', label: 'Sheep', category: 'Passive' },
  { id: 'minecraft:snow_golem', label: 'Snow Golem', category: 'Utility' },
  { id: 'minecraft:squid', label: 'Squid', category: 'Water' },
  { id: 'minecraft:strider', label: 'Strider', category: 'Passive' },
  { id: 'minecraft:tadpole', label: 'Tadpole', category: 'Water' },
  { id: 'minecraft:tropical_fish', label: 'Tropical Fish', category: 'Water' },
  { id: 'minecraft:turtle', label: 'Turtle', category: 'Passive' },
  { id: 'minecraft:villager', label: 'Villager', category: 'Passive' },
  { id: 'minecraft:wandering_trader', label: 'Wandering Trader', category: 'Passive' },
  { id: 'minecraft:wolf', label: 'Wolf', category: 'Neutral' },
  { id: 'minecraft:zombie_horse', label: 'Zombie Horse', category: 'Passive' },
  { id: 'minecraft:blaze', label: 'Blaze', category: 'Hostile' },
  { id: 'minecraft:cave_spider', label: 'Cave Spider', category: 'Hostile' },
  { id: 'minecraft:creeper', label: 'Creeper', category: 'Hostile' },
  { id: 'minecraft:drowned', label: 'Drowned', category: 'Hostile' },
  { id: 'minecraft:elder_guardian', label: 'Elder Guardian', category: 'Hostile' },
  { id: 'minecraft:enderman', label: 'Enderman', category: 'Hostile' },
  { id: 'minecraft:endermite', label: 'Endermite', category: 'Hostile' },
  { id: 'minecraft:evoker', label: 'Evoker', category: 'Hostile' },
  { id: 'minecraft:ghast', label: 'Ghast', category: 'Hostile' },
  { id: 'minecraft:guardian', label: 'Guardian', category: 'Hostile' },
  { id: 'minecraft:hoglin', label: 'Hoglin', category: 'Hostile' },
  { id: 'minecraft:husk', label: 'Husk', category: 'Hostile' },
  { id: 'minecraft:illusioner', label: 'Illusioner', category: 'Hostile' },
  { id: 'minecraft:magma_cube', label: 'Magma Cube', category: 'Hostile' },
  { id: 'minecraft:phantom', label: 'Phantom', category: 'Hostile' },
  { id: 'minecraft:piglin', label: 'Piglin', category: 'Neutral' },
  { id: 'minecraft:piglin_brute', label: 'Piglin Brute', category: 'Hostile' },
  { id: 'minecraft:pillager', label: 'Pillager', category: 'Hostile' },
  { id: 'minecraft:ravager', label: 'Ravager', category: 'Hostile' },
  { id: 'minecraft:shulker', label: 'Shulker', category: 'Hostile' },
  { id: 'minecraft:silverfish', label: 'Silverfish', category: 'Hostile' },
  { id: 'minecraft:skeleton', label: 'Skeleton', category: 'Hostile' },
  { id: 'minecraft:skeleton_horse', label: 'Skeleton Horse', category: 'Passive' },
  { id: 'minecraft:slime', label: 'Slime', category: 'Hostile' },
  { id: 'minecraft:spider', label: 'Spider', category: 'Hostile' },
  { id: 'minecraft:stray', label: 'Stray', category: 'Hostile' },
  { id: 'minecraft:vex', label: 'Vex', category: 'Hostile' },
  { id: 'minecraft:vindicator', label: 'Vindicator', category: 'Hostile' },
  { id: 'minecraft:warden', label: 'Warden', category: 'Hostile' },
  { id: 'minecraft:witch', label: 'Witch', category: 'Hostile' },
  { id: 'minecraft:wither_skeleton', label: 'Wither Skeleton', category: 'Hostile' },
  { id: 'minecraft:zoglin', label: 'Zoglin', category: 'Hostile' },
  { id: 'minecraft:zombie', label: 'Zombie', category: 'Hostile' },
  { id: 'minecraft:zombie_villager', label: 'Zombie Villager', category: 'Hostile' },
  { id: 'minecraft:zombified_piglin', label: 'Zombified Piglin', category: 'Neutral' }
];

export function shortEntityLabel(value: string): string {
  if (!value) return '';
  if (value === '*') return 'All entities';
  const found = VANILLA_ENTITY_OPTIONS.find((option) => option.id === value);
  if (found) return found.label;
  const separatorIndex = value.indexOf(':');
  if (separatorIndex < 0) return value;
  const namespace = value.slice(0, separatorIndex);
  const path = value.slice(separatorIndex + 1);
  return namespace === 'minecraft' ? path.replace(/_/g, ' ') : value;
}

export function entityOptionLabel(value: string): string {
  if (!value) return '';
  if (value === '*') return 'All entities (*)';
  const found = VANILLA_ENTITY_OPTIONS.find((option) => option.id === value);
  const label = found ? found.label : shortEntityLabel(value);
  return `${label} (${value})`;
}

export function entitySearchText(value: string): string {
  return `${entityOptionLabel(value)} ${value}`.toLowerCase();
}

export function mergeEntityRegistryOptions(registryEntities: string[] = [], includeWildcard = false): string[] {
  const values = new Set<string>();
  if (includeWildcard) values.add('*');
  VANILLA_ENTITY_OPTIONS.forEach((option) => {
    if (!includeWildcard && (option.id === '*' || option.id === 'minecraft:player')) return;
    if (includeWildcard || option.id !== '*') values.add(option.id);
  });
  registryEntities.forEach((entity) => {
    if (entity && entity !== 'minecraft:player') values.add(entity);
  });
  return [...values].sort((a, b) => entityOptionLabel(a).localeCompare(entityOptionLabel(b)));
}

export function resolveEntityInput(value: string, options: string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const exactId = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (exactId) return exactId;
  const exactLabel = options.find((option) => shortEntityLabel(option).toLowerCase() === trimmed.toLowerCase());
  return exactLabel ?? trimmed;
}
