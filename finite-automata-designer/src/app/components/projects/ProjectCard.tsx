"use client";

import Link from "next/link";
import { DB_TO_EDITOR_TYPE, DbAutomatonType, EDITOR_TYPE_LABEL, EditorType, editorRoute } from "@/lib/automata/automatonTypes";

// Badge colors per editor type
const BADGE_CLASSES: Record<EditorType, string> = {
    DFSM: "bg-blue-100 text-blue-700",
    NDFSM: "bg-purple-100 text-purple-700",
    DRAW: "bg-green-100 text-green-700",
};

interface ProjectCardProps {
    id: string;
    name: string;
    description: string | null;
    type: string;
    onEdit: () => void;
    onDelete: () => void;
}

export default function ProjectCard({
    id,
    name,
    description,
    type,
    onEdit,
    onDelete,
}: ProjectCardProps) {
    // The database stores the legacy "DFA"/"NFA" type names (and "DRAW" for drawings). Map them to the renamed routes and display names here so existing rows keep working.
    const editorType: EditorType = DB_TO_EDITOR_TYPE[type as DbAutomatonType] ?? "NDFSM";
    const route = editorRoute(editorType);
    const displayType = EDITOR_TYPE_LABEL[editorType];

    return (
        <div
            className="
                bg-white
                rounded-xl
                shadow-md
                hover:shadow-xl
                transition-all
                duration-200
                border
                border-gray-200
                p-6
                flex
                flex-col
                gap-4
                hover:-translate-y-1
            "
        >
            <Link
                href={`${route}?id=${id}`}
                className="flex flex-col gap-4"
            >
                <div className="flex items-start justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 break-words">
                        {name}
                    </h2>

                    <span
                        className={`
                            px-3 py-1 rounded-full text-sm font-semibold
                            ${BADGE_CLASSES[editorType]}
                        `}
                    >
                        {displayType}
                    </span>
                </div>

                <p className="text-gray-600 flex-grow">
                    {description || "No description provided."}
                </p>

                <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-400 truncate">
                        ID: {id}
                    </p>
                </div>
            </Link>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="
                        flex-1
                        px-4
                        py-2
                        rounded-lg
                        bg-blue-500
                        text-white
                        hover:bg-red-600
                        transition
                    "
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="
                        flex-1
                        px-4
                        py-2
                        rounded-lg
                        bg-red-500
                        text-white
                        hover:bg-red-600
                        transition
                    "
                >
                    Delete
                </button>
            </div>
        </div>
    );
}