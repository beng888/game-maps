"use client";

import { useState, useEffect } from "react";

interface Character {
  id: number;
  name: string;
  level: number;
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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [showNewCharInput, setShowNewCharInput] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("CharacterSelector mounted, fetching characters...");
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      const data = await res.json();
      console.log("Characters loaded:", data);
      setCharacters(data);
      if (data.length > 0) {
        // Auto-select the first character
        console.log("Auto-selecting character:", data[0].id);
        setSelectedCharId(data[0].id);
        onCharacterSelect(data[0].id);
        await loadFoundLocations(data[0].id);
      } else {
        onCharacterSelect(null);
        onFoundLocationsLoad(new Set());
      }
    } catch (error) {
      console.error("Failed to load characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoundLocations = async (charId: number) => {
    try {
      console.log("Loading found locations for character:", charId, "map:", currentMapId);
      const res = await fetch(`/api/characters/${charId}/found`);
      const data = await res.json();
      console.log("Found locations loaded:", data);

      // Explicitly type the filter and map
      const foundSet = new Set<string>(
        data.filter((f: any) => f.mapId === currentMapId).map((f: any) => f.locationId.toString()),
      );

      console.log("Filtered found locations for current map:", Array.from(foundSet));
      onFoundLocationsLoad(foundSet);
    } catch (error) {
      console.error("Failed to load found locations:", error);
      onFoundLocationsLoad(new Set<string>());
    }
  };

  const handleCharacterChange = async (charId: string) => {
    const id = parseInt(charId);
    console.log("Character selected:", id);
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
        console.log("Character created:", newChar);
        setCharacters([...characters, newChar]);
        setSelectedCharId(newChar.id);
        onCharacterSelect(newChar.id);
        await loadFoundLocations(newChar.id);
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

        if (newCharacters.length > 0) {
          // Select the first remaining character
          setSelectedCharId(newCharacters[0].id);
          onCharacterSelect(newCharacters[0].id);
          await loadFoundLocations(newCharacters[0].id);
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

  if (loading) {
    return <div className="text-sm text-gray-500 whitespace-nowrap">Loading...</div>;
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
            autoFocus
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
