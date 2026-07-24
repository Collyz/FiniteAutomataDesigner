"use client";

interface NewProjectButtonProps {
    handleNewProject: () => void;
}

export default function NewProjectButton({
    handleNewProject,
}: NewProjectButtonProps) {

    return (
        <button
            onClick={handleNewProject}
            className="flex px-8 py-3 bg-gray-700 text-white rounded hover:bg-black transition"
        >
            New Project
        </button>
    );
}