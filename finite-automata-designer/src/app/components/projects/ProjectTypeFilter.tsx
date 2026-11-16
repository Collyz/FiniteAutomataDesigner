"use client";

// Filter values match the type names stored in the database, keeping legacy DFA/NFA spelling
export type ProjectType = "all" | "DFA" | "NFA" | "DRAW";

interface ProjectTypeFilterProps{
    filterType: ProjectType;
    onFilterChange: (filterType: ProjectType) => void;
}

export default function ProjectTypeFilter({
    filterType,
    onFilterChange,
}: ProjectTypeFilterProps){
    return (
        <div className="flex gap-2">
            <button
                onClick={() => onFilterChange("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterType === "all"
                        ? "bg-gray-600 text-white font-semibold border border-gray-700/100"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
                All
            </button>

            <button
                onClick={() => onFilterChange("DFA")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterType === "DFA"
                        ? "bg-blue-100 text-blue-700 font-semibold border border-blue-700/100"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-300 hover:text-blue-700"
                }`}
            >
                DFSM
            </button>

            <button
                onClick={() => onFilterChange("NFA")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterType === "NFA"
                        ? "bg-purple-100 text-purple-700 font-semibold border border-purple-700/100"
                        : "bg-gray-200 text-gray-700 hover:bg-purple-300 hover:text-purple-700"
                }`}
            >
                NDFSM
            </button>

            <button
                onClick={() => onFilterChange("DRAW")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterType === "DRAW"
                        ? "bg-green-100 text-green-700 font-semibold border border-green-700/100"
                        : "bg-gray-200 text-gray-700 hover:bg-green-300 hover:text-green-700"
                }`}
            >
                Drawing
            </button>
        </div>
    );
}