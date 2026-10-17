"use client";

interface WalkButtonProps{
    type: "DFSM" | "NDFSM";
}

export default function WalkButton({ type }: WalkButtonProps){
    return (
        <button
            id={`${type.toLowerCase()}WalkBtn`}
            type="button"
            className="flex-none px-8 py-3 bg-gray-700 text-white rounded hover:bg-black transition"
        >
            Walkthrough
        </button>
    );
}