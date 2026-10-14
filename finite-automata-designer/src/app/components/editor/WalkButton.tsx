"use client";

interface WalkButton{
    type: "DFSM" | "NDFSM";
}

export default function RunButton({ type }: WalkButton){
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