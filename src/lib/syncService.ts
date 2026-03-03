/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */

// Optimized compact storage format
export interface StoredCharacter {
  i: number; // id (local temporary ID)
  n: string; // name
  l: number; // level
  g: number; // gameId
  f: string; // found locations - comma-separated "mapId:locationId"
}

export interface StoredUserData {
  v: 1; // version for future migrations
  c: StoredCharacter[];
}

// Full interface for runtime use
export interface LocalCharacter {
  id: number;
  userId: string;
  gameId: number;
  name: string;
  level: number;
  createdAt: string;
  foundLocations: LocalFoundLocation[];
}

export interface LocalFoundLocation {
  characterId: number;
  locationId: number;
  mapId: number;
}

const STORAGE_PREFIX = "gm_"; // game-maps
const USER_PREFIX = "u_";
const CURRENT_VERSION = 1;

export class SyncService {
  // Get storage key for user (using email as identifier)
  private static getUserStorageKey(email: string): string {
    return `${STORAGE_PREFIX}${USER_PREFIX}${email}`;
  }

  // Get all data for a specific user by email
  static getUserData(email: string): { characters: LocalCharacter[] } | null {
    if (!email) return null;

    try {
      const key = this.getUserStorageKey(email);
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data) as StoredUserData;
      return this.expandStoredData(email, parsed);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  // Save all data for a user (in compact format)
  static saveUserData(email: string, data: { characters: LocalCharacter[] }) {
    if (!email) return;

    try {
      const compact = this.compactData(data);
      const key = this.getUserStorageKey(email);
      localStorage.setItem(key, JSON.stringify(compact));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // Compact data for storage
  private static compactData(data: { characters: LocalCharacter[] }): StoredUserData {
    return {
      v: CURRENT_VERSION,
      c: data.characters.map((char) => ({
        i: char.id,
        n: char.name,
        l: char.level,
        g: char.gameId,
        f: char.foundLocations.map((f) => `${f.mapId}:${f.locationId}`).join(","),
      })),
    };
  }

  // Expand compact data for runtime use
  private static expandStoredData(
    email: string,
    stored: StoredUserData,
  ): { characters: LocalCharacter[] } {
    if (stored.v !== CURRENT_VERSION) {
      // Handle migrations here if needed
    }

    return {
      characters: stored.c.map((char) => ({
        id: char.i,
        userId: email, // Use email as userId
        gameId: char.g,
        name: char.n,
        level: char.l,
        createdAt: new Date().toISOString(), // Approximate, but we don't really need this
        foundLocations: char.f
          ? char.f
              .split(",")
              .filter(Boolean)
              .map((pair) => {
                const [mapId, locationId] = pair.split(":").map(Number);
                return {
                  characterId: char.i,
                  locationId,
                  mapId,
                };
              })
          : [],
      })),
    };
  }

  // Get characters for a user by email
  static getUserCharacters(email: string): LocalCharacter[] {
    const userData = this.getUserData(email);
    return userData?.characters || [];
  }

  // Find character by name (case-insensitive)
  static findCharacterByName(email: string, name: string): LocalCharacter | undefined {
    const characters = this.getUserCharacters(email);
    return characters.find((c) => c.name.toLowerCase() === name.toLowerCase());
  }

  // Save a character for a user
  static saveCharacter(email: string, character: LocalCharacter) {
    const userData = this.getUserData(email) || { characters: [] };
    const existingIndex = userData.characters.findIndex(
      (c) => c.name.toLowerCase() === character.name.toLowerCase(),
    );

    if (existingIndex >= 0) {
      // Merge found locations if character exists
      const existing = userData.characters[existingIndex];
      const foundMap = new Map(
        existing.foundLocations.map((f) => [`${f.mapId}:${f.locationId}`, f]),
      );

      for (const found of character.foundLocations) {
        foundMap.set(`${found.mapId}:${found.locationId}`, found);
      }

      userData.characters[existingIndex] = {
        ...existing,
        level: character.level,
        foundLocations: Array.from(foundMap.values()),
      };
    } else {
      userData.characters.push(character);
    }

    this.saveUserData(email, userData);
  }

  // Delete a character for a user by name
  static deleteCharacter(email: string, characterName: string) {
    const userData = this.getUserData(email);
    if (userData) {
      userData.characters = userData.characters.filter(
        (c) => c.name.toLowerCase() !== characterName.toLowerCase(),
      );
      this.saveUserData(email, userData);
    }
  }

  // Get found locations for a character by name
  static getFoundLocations(email: string, characterName: string): LocalFoundLocation[] {
    const userData = this.getUserData(email);
    const character = userData?.characters.find(
      (c) => c.name.toLowerCase() === characterName.toLowerCase(),
    );
    return character?.foundLocations || [];
  }

  // Save a found location for a character by name
  static saveFoundLocation(
    email: string,
    characterName: string,
    locationId: number,
    mapId: number,
    found: boolean,
  ) {
    const userData = this.getUserData(email);
    if (!userData) return;

    const character = userData.characters.find(
      (c) => c.name.toLowerCase() === characterName.toLowerCase(),
    );
    if (!character) return;

    if (found) {
      // Add found location
      const existingIndex = character.foundLocations.findIndex(
        (f) => f.locationId === locationId && f.mapId === mapId,
      );

      if (existingIndex === -1) {
        character.foundLocations.push({
          characterId: character.id,
          locationId,
          mapId,
        });
      }
    } else {
      // Remove found location
      character.foundLocations = character.foundLocations.filter(
        (f) => !(f.locationId === locationId && f.mapId === mapId),
      );
    }

    this.saveUserData(email, userData);
  }

  // Sync from database to localStorage (merge by character name)
  static syncFromDatabase(email: string, dbCharacters: any[]): LocalCharacter[] {
    const localData = this.getUserData(email) || { characters: [] };
    const localByName = new Map(localData.characters.map((c) => [c.name.toLowerCase(), c]));

    // Merge database characters with local data
    for (const dbChar of dbCharacters) {
      const existingLocal = localByName.get(dbChar.name.toLowerCase());

      if (existingLocal) {
        // Update local character with DB id but keep found locations
        existingLocal.id = dbChar.id;
        existingLocal.level = dbChar.level;
        // Keep existing found locations
      } else {
        // New character from DB, add to localStorage
        localData.characters.push({
          id: dbChar.id,
          userId: email,
          gameId: dbChar.gameId,
          name: dbChar.name,
          level: dbChar.level,
          createdAt: dbChar.createdAt,
          foundLocations: [],
        });
      }
    }

    this.saveUserData(email, localData);
    return localData.characters;
  }

  // Sync from localStorage to database (match by character name)
  static async syncToDatabase(
    email: string,
    apiCallbacks: {
      findCharacterByName: (name: string) => Promise<any>;
      createCharacter: (character: any) => Promise<any>;
      createFoundLocation: (characterId: number, locationId: number, mapId: number) => Promise<any>;
    },
  ): Promise<any[]> {
    const localData = this.getUserData(email);
    if (!localData) return [];

    const syncedCharacters = [];

    for (const localChar of localData.characters) {
      try {
        // Try to find existing character by name
        let dbChar = await apiCallbacks.findCharacterByName(localChar.name);

        if (!dbChar) {
          // Create new character in database
          dbChar = await apiCallbacks.createCharacter({
            gameId: localChar.gameId,
            name: localChar.name,
            level: localChar.level,
          });
        }

        // Get existing found locations from DB
        // This would need an API endpoint to fetch by characterId
        // For now, we'll sync all found locations
        for (const found of localChar.foundLocations) {
          try {
            await apiCallbacks.createFoundLocation(dbChar.id, found.locationId, found.mapId);
          } catch (error) {
            // Ignore duplicates
            console.log("Found location might already exist:", error);
          }
        }

        syncedCharacters.push({
          ...dbChar,
          foundLocations: localChar.foundLocations,
        });
      } catch (error) {
        console.error("Error syncing character to database:", error);
      }
    }

    return syncedCharacters;
  }

  // Check if user has local data
  static hasLocalData(email: string): boolean {
    if (!email) return false;
    const data = this.getUserData(email);
    return !!(data && data.characters.length > 0);
  }

  // Clear all data for a user (useful for testing)
  static clearUserData(email: string) {
    if (!email) return;
    const key = this.getUserStorageKey(email);
    localStorage.removeItem(key);
  }
}
