/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
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
  foundAt: string;
}

const STORAGE_KEY = "game-maps-data";
const USER_DATA_PREFIX = "user_";

export class SyncService {
  // Get all data for a specific user
  static getUserData(userId: string): { characters: LocalCharacter[] } | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${USER_DATA_PREFIX}${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  // Save all data for a user
  static saveUserData(userId: string, data: { characters: LocalCharacter[] }) {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${USER_DATA_PREFIX}${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // Get characters for a user
  static getUserCharacters(userId: string): LocalCharacter[] {
    const userData = this.getUserData(userId);
    return userData?.characters || [];
  }

  // Save a character for a user
  static saveCharacter(userId: string, character: LocalCharacter) {
    const userData = this.getUserData(userId) || { characters: [] };
    const existingIndex = userData.characters.findIndex((c) => c.id === character.id);

    if (existingIndex >= 0) {
      userData.characters[existingIndex] = character;
    } else {
      userData.characters.push(character);
    }

    this.saveUserData(userId, userData);
  }

  // Delete a character for a user
  static deleteCharacter(userId: string, characterId: number) {
    const userData = this.getUserData(userId);
    if (userData) {
      userData.characters = userData.characters.filter((c) => c.id !== characterId);
      this.saveUserData(userId, userData);
    }
  }

  // Get found locations for a character
  static getFoundLocations(userId: string, characterId: number): LocalFoundLocation[] {
    const userData = this.getUserData(userId);
    const character = userData?.characters.find((c) => c.id === characterId);
    return character?.foundLocations || [];
  }

  // Save a found location for a character
  static saveFoundLocation(
    userId: string,
    characterId: number,
    locationId: number,
    mapId: number,
    found: boolean,
  ) {
    const userData = this.getUserData(userId);
    if (!userData) return;

    const character = userData.characters.find((c) => c.id === characterId);
    if (!character) return;

    if (found) {
      // Add found location
      const existingIndex = character.foundLocations.findIndex(
        (f) => f.locationId === locationId && f.mapId === mapId,
      );

      if (existingIndex === -1) {
        character.foundLocations.push({
          characterId,
          locationId,
          mapId,
          foundAt: new Date().toISOString(),
        });
      }
    } else {
      // Remove found location
      character.foundLocations = character.foundLocations.filter(
        (f) => !(f.locationId === locationId && f.mapId === mapId),
      );
    }

    this.saveUserData(userId, userData);
  }

  // Sync from database to localStorage
  static async syncFromDatabase(userId: string, dbCharacters: any[]): Promise<LocalCharacter[]> {
    const localData = this.getUserData(userId) || { characters: [] };

    // Merge database characters with local data
    for (const dbChar of dbCharacters) {
      const existingLocal = localData.characters.find((c) => c.id === dbChar.id);

      if (!existingLocal) {
        // New character from DB, add to localStorage
        localData.characters.push({
          id: dbChar.id,
          userId: dbChar.userId,
          gameId: dbChar.gameId,
          name: dbChar.name,
          level: dbChar.level,
          createdAt: dbChar.createdAt,
          foundLocations: [],
        });
      }
    }

    this.saveUserData(userId, localData);
    return localData.characters;
  }

  // Sync from localStorage to database (when DB is empty)
  static async syncToDatabase(
    userId: string,
    apiCallbacks: {
      createCharacter: (character: any) => Promise<any>;
      createFoundLocation: (characterId: number, locationId: number, mapId: number) => Promise<any>;
    },
  ): Promise<any[]> {
    const localData = this.getUserData(userId);
    if (!localData) return [];

    const syncedCharacters = [];

    for (const localChar of localData.characters) {
      try {
        // Create character in database
        const dbChar = await apiCallbacks.createCharacter({
          gameId: localChar.gameId,
          name: localChar.name,
          level: localChar.level,
        });

        // Create found locations in database
        for (const found of localChar.foundLocations) {
          await apiCallbacks.createFoundLocation(dbChar.id, found.locationId, found.mapId);
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
}
