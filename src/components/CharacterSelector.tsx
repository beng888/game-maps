"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSync } from "@/hooks/useSync";

interface Character {
  id: number;
  name: string;
  level: number;
  gameId: number;
  userId: string;
}

interface CharacterSelectorProps {
  gameId: number;
  currentMapId: number;
  onCharacterSelect: (characterId: number | null, characterName?: string) => void;
  onFoundLocationsLoad: (foundSet: Set<string>) => void;
}

export default function CharacterSelector({
  gameId,
  currentMapId,
  onCharacterSelect,
  onFoundLocationsLoad,
}: CharacterSelectorProps) {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharName, setSelectedCharName] = useState<string | null>(null);
  const [showNewCharInput, setShowNewCharInput] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const sync = useSync();

  // Load characters on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/characters");
      const data = await res.json();

      if (data.length === 0 && sync.hasLocalData() && email) {
        // Database is empty but we have local data - sync to DB
        await syncToDatabase();
      } else {
        // Normal load - sync from DB to localStorage
        setCharacters(data);

        // Try to restore selected character from localStorage
        const localChars = sync.getLocalCharacters();
        if (localChars.length > 0 && data.length > 0) {
          // Match by name
          const matchingChar = data.find((dbChar: Character) =>
            localChars.some((lc) => lc.name.toLowerCase() === dbChar.name.toLowerCase()),
          );

          if (matchingChar) {
            setSelectedCharName(matchingChar.name);
            onCharacterSelect(matchingChar.id, matchingChar.name);
            loadFoundLocations(matchingChar.id, matchingChar.name);
          } else {
            setSelectedCharName(data[0].name);
            onCharacterSelect(data[0].id, data[0].name);
            loadFoundLocations(data[0].id, data[0].name);
          }
        } else if (data.length > 0) {
          setSelectedCharName(data[0].name);
          onCharacterSelect(data[0].id, data[0].name);
          loadFoundLocations(data[0].id, data[0].name);
        } else {
          onCharacterSelect(null);
          onFoundLocationsLoad(new Set());
        }

        // Backup to localStorage
        await sync.syncFromDB(data);
      }
    } catch (error) {
      console.error("Failed to load characters:", error);
      // Try to load from localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const syncToDatabase = async () => {
    setSyncInProgress(true);
    try {
      const syncedChars = await sync.syncToDB({
        findCharacterByName: async (name) => {
          const res = await fetch(
            `/api/characters/find?name=${encodeURIComponent(name)}&gameId=${gameId}`,
          );
          if (res.status === 404) return null;
          return res.json();
        },
        createCharacter: async (char) => {
          const res = await fetch("/api/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...char, gameId }),
          });
          return res.json();
        },
        createFoundLocation: async (characterId, locationId, mapId) => {
          await fetch(`/api/characters/${characterId}/found`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locationId,
              mapId,
              found: true,
            }),
          });
        },
      });

      setCharacters(syncedChars);
      if (syncedChars.length > 0) {
        setSelectedCharName(syncedChars[0].name);
        onCharacterSelect(syncedChars[0].id, syncedChars[0].name);
        loadFoundLocations(syncedChars[0].id, syncedChars[0].name);
      }
    } catch (error) {
      console.error("Failed to sync to database:", error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const loadFromLocalStorage = () => {
    const localChars = sync.getLocalCharacters();
    if (localChars.length > 0) {
      // Convert LocalCharacter to Character format for display
      const displayChars = localChars.map((lc) => ({
        id: lc.id,
        name: lc.name,
        level: lc.level,
        gameId: lc.gameId,
        userId: lc.userId,
      }));

      setCharacters(displayChars);
      setSelectedCharName(localChars[0].name);
      onCharacterSelect(localChars[0].id, localChars[0].name);

      // Load found locations for current map
      const foundSet: Set<string> = new Set(
        localChars[0].foundLocations
          .filter((f) => f.mapId === currentMapId)
          .map((f) => f.locationId.toString()),
      );
      onFoundLocationsLoad(foundSet);
    }
  };

  const loadFoundLocations = async (charId: number, charName: string) => {
    try {
      const res = await fetch(`/api/characters/${charId}/found`);
      const data = await res.json();
      const foundSet: Set<string> = new Set(
        data.filter((f: any) => f.mapId === currentMapId).map((f: any) => f.locationId.toString()),
      );
      onFoundLocationsLoad(foundSet);

      // Backup to localStorage
      if (email) {
        for (const f of data) {
          sync.saveFoundLocation(charName, f.locationId, f.mapId, true);
        }
      }
    } catch (error) {
      console.error("Failed to load found locations:", error);
    }
  };

  const handleCharacterChange = async (charName: string) => {
    const selectedChar = characters.find((c) => c.name === charName);
    if (!selectedChar) return;

    setSelectedCharName(charName);
    onCharacterSelect(selectedChar.id, charName);
    await loadFoundLocations(selectedChar.id, charName);
  };

  const createCharacter = async () => {
    if (!newCharName.trim()) return;

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, name: newCharName }),
      });

      if (res.ok) {
        const newChar = await res.json();
        setCharacters([...characters, newChar]);
        setSelectedCharName(newChar.name);
        onCharacterSelect(newChar.id, newChar.name);

        // Backup to localStorage
        if (email) {
          sync.saveCharacter({
            id: newChar.id,
            userId: email,
            gameId: newChar.gameId,
            name: newChar.name,
            level: newChar.level,
            createdAt: new Date().toISOString(),
            foundLocations: [],
          });
        }

        loadFoundLocations(newChar.id, newChar.name);
        setShowNewCharInput(false);
        setNewCharName("");
      }
    } catch (error) {
      console.error("Failed to create character:", error);
    }
  };

  const deleteCharacter = async (charName: string) => {
    const character = characters.find((c) => c.name === charName);
    if (!character) return;

    if (!confirm(`Delete "${charName}"? All progress will be lost.`)) return;

    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newCharacters = characters.filter((c) => c.id !== character.id);
        setCharacters(newCharacters);

        // Remove from localStorage
        if (email) {
          sync.deleteCharacter(charName);
        }

        if (newCharacters.length > 0) {
          setSelectedCharName(newCharacters[0].name);
          onCharacterSelect(newCharacters[0].id, newCharacters[0].name);
          loadFoundLocations(newCharacters[0].id, newCharacters[0].name);
        } else {
          setSelectedCharName(null);
          onCharacterSelect(null);
          onFoundLocationsLoad(new Set());
        }
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
    }
  };

  if (loading || syncInProgress) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {syncInProgress ? "Syncing backup..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Character:</span>
      {characters.length > 0 ? (
        <>
          <select
            value={selectedCharName || ""}
            onChange={(e) => handleCharacterChange(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md bg-white min-w-[120px]"
          >
            {characters.map((char) => (
              <option key={char.id} value={char.name}>
                {char.name} (Lvl {char.level})
              </option>
            ))}
          </select>
          {selectedCharName && (
            <button
              type="button"
              onClick={() => deleteCharacter(selectedCharName)}
              className="px-2 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 whitespace-nowrap"
              title="Delete character"
            >
              🗑️
            </button>
          )}
        </>
      ) : (
        <span className="text-sm text-gray-500 whitespace-nowrap">No characters</span>
      )}

      {!showNewCharInput ? (
        <button
          type="button"
          onClick={() => setShowNewCharInput(true)}
          className="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 whitespace-nowrap"
        >
          + New
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            placeholder="Name"
            className="px-2 py-1 text-sm border rounded-md w-24 md:w-32"
            onKeyDown={(e) => e.key === "Enter" && createCharacter()}
          />
          <button
            type="button"
            onClick={createCharacter}
            className="px-2 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 whitespace-nowrap"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowNewCharInput(false)}
            className="px-2 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
