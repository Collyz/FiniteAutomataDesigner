"use client";

import { useState } from "react";

interface InstructionsProps{
    type: "DFSM" | "NDFSM" | "DRAW";
}

export default function Instructions({ type }: InstructionsProps){

    const [instructionsOpen, setInstructionsOpen] = useState(false);
    
    return (
        <div className="mt-6 pr-4 w-full text-black">
            <button
                type="button"
                onClick={() => setInstructionsOpen(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-black transition"
            >
                Instructions
                <svg
                    className={`h-4 w-4 transition-transform ${instructionsOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path 
                        fillRule="evenodd" 
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" 
                        clipRule="evenodd" 
                    />
                </svg>
            </button>
            {instructionsOpen && (
                <ul className="list-disc text-left mt-3 ml-4 text-sm space-y-1">
                    <li><p className="font-semibold inline">Add a state: </p>Double-click on the canvas</li>
                    <li><p className="font-semibold inline">Define start state: </p>Shift + Click empty space on canvas + Drag your desired start state</li>
                    <li><p className="font-semibold inline">Add an arrow between states: </p>Shift + Click initial state + Drag the mouse to your desired terminal state</li>
                    <li><p className="font-semibold inline">Add a looped arrow on a state: </p>Shift + Click existing state</li>
                    <li><p className="font-semibold inline">Curve arrows: </p>Click your desired arrow and drag in the direction you wish to curve it</li>
                    <li><p className="font-semibold inline">Move anything: </p>Click + Drag it around</li>
                    <li><p className="font-semibold inline">Delete anything: </p>Click it and press the delete key (not backspace)</li>
                    <li><p className="font-semibold inline">Make accept state: </p>Double-click an existing state</li>
                    <li><p className="font-semibold inline">Type onto arrow or state: </p>Click on desired state, then begin typing. Click again anywhere else to submit</li>
                    <li><p className="font-semibold inline">Type numeric subscript: </p>Put an underscore before the number (ex: &quot;q_0&quot;)</li>
                    {type !== "DRAW" && (
                        <>
                            <li><p className="font-semibold inline">Set alphabet: </p>Type a comma-separated list of all the characters you wish to define for your DFSM. Press Enter to submit</li>
                            <li><p className="font-semibold inline">Run {type}: </p>Type an input string containing only the characters from your alphabet. Press Enter to submit</li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}