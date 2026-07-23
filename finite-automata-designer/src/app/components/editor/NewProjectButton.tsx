"use client";

import { setEditorSession } from "@/lib/editorSession";
import { useRouter } from "next/navigation";

interface NewProjectButtonProps {
    type: "DFSM" | "NDFSM";
}

export default function NewProjectButton({
    type,
}: NewProjectButtonProps) {
    const router = useRouter();

    const handleNewProject = () => {
        setEditorSession(type, {
            mode: "new"
        });

        router.push(`/${type.toLowerCase()}?new=true`);
    };

    return (
        <button
            onClick={handleNewProject}
            className="flex px-8 py-3 bg-gray-700 text-white rounded hover:bg-black transition"
        >
            New Project
        </button>
    );
}