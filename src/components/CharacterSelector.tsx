"use client";

import { useState, useEffect } from "react";
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
  onCharacterSelect: (characterId: number | null) => void;
  onFoundLocationsLoad: (foundSet: Set<string>) => void;
}

export default function CharacterSelector({
  gameId,
  currentMapId,
  onCharacterSelect,
  onFoundLocationsLoad,
}: CharacterSelectorProps) {
  const { data: session } = useSession();
  const userId = session?.user?.email;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
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

      if (data.length === 0 && sync.hasLocalData() && userId) {
        // Database is empty but we have local data - sync to DB
        await syncToDatabase();
      } else {
        // Normal load - sync from DB to localStorage
        setCharacters(data);
        if (data.length > 0) {
          setSelectedCharId(data[0].id);
          onCharacterSelect(data[0].id);
          loadFoundLocations(data[0].id);
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
        createCharacter: async (char) => {
          const res = await fetch("/api/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(char),
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
        setSelectedCharId(syncedChars[0].id);
        onCharacterSelect(syncedChars[0].id);
        loadFoundLocations(syncedChars[0].id);
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
      setCharacters(localChars);
      setSelectedCharId(localChars[0].id);
      onCharacterSelect(localChars[0].id);

      // Load found locations for current map - fix the type
      const foundSet: Set<string> = new Set(
        localChars[0].foundLocations
          .filter((f: any) => f.mapId === currentMapId)
          .map((f: any) => f.locationId.toString()),
      );
      onFoundLocationsLoad(foundSet);
    }
  };

  const loadFoundLocations = async (charId: number) => {
    try {
      const res = await fetch(`/api/characters/${charId}/found`);
      const data = await res.json();
      const foundSet: Set<string> = new Set(
        data.filter((f: any) => f.mapId === currentMapId).map((f: any) => f.locationId.toString()),
      );
      onFoundLocationsLoad(foundSet);

      // Backup to localStorage
      if (userId) {
        for (const f of data) {
          sync.saveFoundLocation(charId, f.locationId, f.mapId, true);
        }
      }
    } catch (error) {
      console.error("Failed to load found locations:", error);
    }
  };

  const handleCharacterChange = async (charId: string) => {
    const id = parseInt(charId);
    setSelectedCharId(id);
    onCharacterSelect(id);
    await loadFoundLocations(id);
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
        setSelectedCharId(newChar.id);
        onCharacterSelect(newChar.id);

        // Backup to localStorage
        if (userId) {
          sync.saveCharacter({
            ...newChar,
            foundLocations: [],
          });
        }

        loadFoundLocations(newChar.id);
        setShowNewCharInput(false);
        setNewCharName("");
      }
    } catch (error) {
      console.error("Failed to create character:", error);
    }
  };

  const deleteCharacter = async (charId: number) => {
    if (!confirm("Delete this character? All progress will be lost.")) return;

    try {
      const res = await fetch(`/api/characters/${charId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newCharacters = characters.filter((c) => c.id !== charId);
        setCharacters(newCharacters);

        // Remove from localStorage
        if (userId) {
          sync.deleteCharacter(charId);
        }

        if (newCharacters.length > 0) {
          setSelectedCharId(newCharacters[0].id);
          onCharacterSelect(newCharacters[0].id);
          loadFoundLocations(newCharacters[0].id);
        } else {
          setSelectedCharId(null);
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
            value={selectedCharId || ""}
            onChange={(e) => handleCharacterChange(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md bg-white min-w-[120px]"
          >
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name} (Lvl {char.level})
              </option>
            ))}
          </select>
          {selectedCharId && (
            <button
              type="button"
              onClick={() => deleteCharacter(selectedCharId)}
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
