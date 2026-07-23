"use client";

import { useRouter } from "next/navigation";
import { getEditorSession, setEditorSession } from "@/lib/editorSession";

interface EditorButtonProps{
    type: "DFSM" | "NDFSM";
}

export default function EditorButton({
    type,
}: EditorButtonProps) {
    const router = useRouter();

    function handleClick() {
        const session = getEditorSession(type);

        if (!session) {
            setEditorSession(`${type}`, {
                mode: "new"
            });

            router.push(`/${type.toLowerCase()}?new=true`);
            return;
        }

        if (
            session.mode === "saved" &&
            session.projectId
        ) {
            router.push(
                `/${type.toLowerCase()}?id=${session.projectId}`
            );
        }
        else {
            router.push(`/${type.toLowerCase()}?new=true`);
        }
    }


    return (
        <button 
            onClick={handleClick}
            className="px-10 py-5 bg-gray-600 text-2xl text-white rounded hover:bg-black hover:shadow-lg hover:scale-105 transition-transform duration-400"
        >
            {type}
        </button>
    );
}