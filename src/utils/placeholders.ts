/**
 * Cute placeholder names for notebooks featuring our animal friends:
 * - Gogo the Dragon
 * - Tutu the Turtle
 * - Bibi the Rabbit
 * - Pipi the Pigeon
 */

const characters = [
  { name: "Gogo", animal: "Dragon", emoji: "🐉" },
  { name: "Tutu", animal: "Turtle", emoji: "🐢" },
  { name: "Bibi", animal: "Rabbit", emoji: "🐰" },
  { name: "Pipi", animal: "Pigeon", emoji: "🐦" },
];

const activities = [
  "Adventures",
  "Thoughts",
  "Journal",
  "Notes",
  "Musings",
  "Stories",
  "Dreams",
  "Ideas",
  "Discoveries",
  "Secrets",
];

const adjectives = [
  "Cozy",
  "Magical",
  "Sunny",
  "Sparkly",
  "Dreamy",
  "Whimsical",
  "Happy",
  "Little",
  "Secret",
  "Wonderful",
];

const places = [
  "Garden",
  "Cloud",
  "Meadow",
  "Forest",
  "Cave",
  "Treehouse",
  "Burrow",
  "Nest",
  "Kingdom",
  "World",
];

/**
 * Generate a random cute notebook name
 */
export function generateNotebookName(): string {
  const character = characters[Math.floor(Math.random() * characters.length)];
  const pattern = Math.floor(Math.random() * 5);

  switch (pattern) {
    case 0:
      // "Gogo's Adventures"
      const activity = activities[Math.floor(Math.random() * activities.length)];
      return `${character.name}'s ${activity}`;

    case 1:
      // "Tutu's Cozy Notes"
      const adj1 = adjectives[Math.floor(Math.random() * adjectives.length)];
      const act1 = activities[Math.floor(Math.random() * activities.length)];
      return `${character.name}'s ${adj1} ${act1}`;

    case 2:
      // "The Magical Garden of Bibi"
      const adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
      const place = places[Math.floor(Math.random() * places.length)];
      return `The ${adj2} ${place} of ${character.name}`;

    case 3:
      // "Pipi & Friends"
      const friend = characters.filter((c) => c.name !== character.name)[
        Math.floor(Math.random() * (characters.length - 1))
      ];
      return `${character.name} & ${friend.name}'s Corner`;

    case 4:
    default:
      // "Little Dragon Tales"
      const act2 = activities[Math.floor(Math.random() * activities.length)];
      return `Little ${character.animal} ${act2}`;
  }
}

/**
 * Get a random character for display
 */
export function getRandomCharacter() {
  return characters[Math.floor(Math.random() * characters.length)];
}

/**
 * Get all characters
 */
export function getCharacters() {
  return characters;
}
