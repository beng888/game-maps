import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { SyncService } from "@/lib/syncService";

export function useSync() {
  const { data: session } = useSession();
  const userId = session?.user?.email;
  const syncInProgress = useRef(false);

  // Sync from database to localStorage whenever characters change
  const syncFromDB = async (characters: any[]) => {
    if (!userId || syncInProgress.current) return characters;

    try {
      syncInProgress.current = true;
      const synced = await SyncService.syncFromDatabase(userId, characters);
      return synced;
    } finally {
      syncInProgress.current = false;
    }
  };

  // Sync from localStorage to database (when DB is empty)
  const syncToDB = async (apiCallbacks: {
    createCharacter: (character: any) => Promise<any>;
    createFoundLocation: (characterId: number, locationId: number, mapId: number) => Promise<any>;
  }) => {
    if (!userId || syncInProgress.current) return [];

    try {
      syncInProgress.current = true;
      return await SyncService.syncToDatabase(userId, apiCallbacks);
    } finally {
      syncInProgress.current = false;
    }
  };

  // Check if user has local data
  const hasLocalData = (): boolean => {
    if (!userId) return false;
    const data = SyncService.getUserData(userId);
    return !!(data && data.characters.length > 0);
  };

  return {
    syncFromDB,
    syncToDB,
    hasLocalData,
    getLocalCharacters: () => (userId ? SyncService.getUserCharacters(userId) : []),
    saveCharacter: (character: any) => userId && SyncService.saveCharacter(userId, character),
    deleteCharacter: (characterId: number) =>
      userId && SyncService.deleteCharacter(userId, characterId),
    saveFoundLocation: (characterId: number, locationId: number, mapId: number, found: boolean) =>
      userId && SyncService.saveFoundLocation(userId, characterId, locationId, mapId, found),
  };
}
