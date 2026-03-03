import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { SyncService, LocalCharacter } from "@/lib/syncService";

export function useSync() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const syncInProgress = useRef(false);

  // Sync from database to localStorage
  const syncFromDB = useCallback(
    async (characters: any[]) => {
      if (!email || syncInProgress.current) return characters;

      try {
        syncInProgress.current = true;
        const synced = await SyncService.syncFromDatabase(email, characters);
        return synced;
      } finally {
        syncInProgress.current = false;
      }
    },
    [email],
  );

  // Sync from localStorage to database
  const syncToDB = useCallback(
    async (apiCallbacks: {
      findCharacterByName: (name: string) => Promise<any>;
      createCharacter: (character: any) => Promise<any>;
      createFoundLocation: (characterId: number, locationId: number, mapId: number) => Promise<any>;
    }) => {
      if (!email || syncInProgress.current) return [];

      try {
        syncInProgress.current = true;
        return await SyncService.syncToDatabase(email, apiCallbacks);
      } finally {
        syncInProgress.current = false;
      }
    },
    [email],
  );

  // Get local characters
  const getLocalCharacters = useCallback((): LocalCharacter[] => {
    if (!email) return [];
    return SyncService.getUserCharacters(email);
  }, [email]);

  // Find character by name
  const findCharacterByName = useCallback(
    (name: string): LocalCharacter | undefined => {
      if (!email) return undefined;
      return SyncService.findCharacterByName(email, name);
    },
    [email],
  );

  // Save character
  const saveCharacter = useCallback(
    (character: LocalCharacter) => {
      if (!email) return;
      SyncService.saveCharacter(email, character);
    },
    [email],
  );

  // Delete character by name
  const deleteCharacter = useCallback(
    (characterName: string) => {
      if (!email) return;
      SyncService.deleteCharacter(email, characterName);
    },
    [email],
  );

  // Save found location
  const saveFoundLocation = useCallback(
    (characterName: string, locationId: number, mapId: number, found: boolean) => {
      if (!email) return;
      SyncService.saveFoundLocation(email, characterName, locationId, mapId, found);
    },
    [email],
  );

  // Get found locations for character
  const getFoundLocations = useCallback(
    (characterName: string) => {
      if (!email) return [];
      return SyncService.getFoundLocations(email, characterName);
    },
    [email],
  );

  // Check if user has local data
  const hasLocalData = useCallback((): boolean => {
    if (!email) return false;
    return SyncService.hasLocalData(email);
  }, [email]);

  return {
    syncFromDB,
    syncToDB,
    hasLocalData,
    getLocalCharacters,
    findCharacterByName,
    saveCharacter,
    deleteCharacter,
    saveFoundLocation,
    getFoundLocations,
  };
}
