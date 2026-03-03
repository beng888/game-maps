"use client";

import { useState, useEffect, useRef } from "react";

interface CategoryFilterProps {
  groups: Array<{
    id: number;
    title: string;
    categories: Array<{
      id: number;
      title: string;
    }>;
  }>;
  onFilterChange: (enabledCategories: Set<number>) => void;
  showUndiscovered?: boolean;
  onUndiscoveredChange?: (showUndiscovered: boolean) => void;
}

export default function CategoryFilter({
  groups,
  onFilterChange,
  showUndiscovered = false,
  onUndiscoveredChange,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUndiscovered, setShowOnlyUndiscovered] = useState(showUndiscovered);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setShowOnlyUndiscovered(showUndiscovered);
  }, [showUndiscovered]);

  const toggleCategory = (categoryId: number) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
    onFilterChange(newSelected);
  };

  const toggleUndiscovered = () => {
    const newValue = !showOnlyUndiscovered;
    setShowOnlyUndiscovered(newValue);
    if (onUndiscoveredChange) {
      onUndiscoveredChange(newValue);
    }
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    onFilterChange(new Set());
    setShowOnlyUndiscovered(false);
    if (onUndiscoveredChange) {
      onUndiscoveredChange(false);
    }
    setIsOpen(false);
  };

  const selectAll = () => {
    const allCategories = new Set<number>();
    groups.forEach((group) => {
      group.categories.forEach((cat) => {
        allCategories.add(cat.id);
      });
    });
    setSelectedCategories(allCategories);
    onFilterChange(allCategories);
  };

  const selectedCount = selectedCategories.size;
  const totalCategories = groups.reduce((acc, group) => acc + group.categories.length, 0);

  // Filter groups based on search
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      categories: group.categories.filter((cat) =>
        cat.title.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((group) => group.categories.length > 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 whitespace-nowrap ${
          showOnlyUndiscovered
            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
            : selectedCount > 0 && selectedCount < totalCategories
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              : selectedCount === totalCategories
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span>🔍</span>
        <span>Filter</span>
        {showOnlyUndiscovered && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-200 rounded-full">
            Undiscovered
          </span>
        )}
        {!showOnlyUndiscovered && selectedCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-white rounded-full">{selectedCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl z-20 border max-h-[70vh] flex flex-col">
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* Undiscovered filter - always first */}
            <div className="mb-4 pb-2 border-b border-gray-200">
              <label className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showOnlyUndiscovered}
                  onChange={toggleUndiscovered}
                  className="rounded text-purple-500 focus:ring-purple-500 w-4 h-4"
                />
                <span className="flex items-center gap-2">
                  <span className="text-lg">🕵️</span>
                  <span>Hide discovered locations</span>
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-9">
                Only show locations you haven't found yet
              </p>
            </div>

            {filteredGroups.map((group) => (
              <div key={group.id} className="mb-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span>{category.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-gray-50 flex justify-between gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select All Categories
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
