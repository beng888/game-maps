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
}

export default function CategoryFilter({ groups, onFilterChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
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

  const clearFilters = () => {
    setSelectedCategories(new Set());
    onFilterChange(new Set());
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
        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
          selectedCount > 0 && selectedCount < totalCategories
            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            : selectedCount === totalCategories
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span>🔍</span>
        <span>Categories</span>
        {selectedCount > 0 && (
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
              Clear
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
