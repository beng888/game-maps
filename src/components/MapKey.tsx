"use client";

interface MapKeyProps {
  groups: Array<{
    id: number;
    title: string;
    categories: Array<{
      id: number;
      title: string;
    }>;
  }>;
}

export default function MapKey({ groups }: MapKeyProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-y-auto">
      <h3 className="font-semibold text-sm mb-2 sticky top-0 bg-white pb-2">Map Key</h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id}>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {group.title}
            </h4>
            <div className="space-y-1">
              {group.categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-gray-700">{category.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
