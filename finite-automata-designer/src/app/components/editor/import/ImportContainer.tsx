"use client";

import { useState } from "react";
import { useDropdownFloating } from "../useDropdownFloating";


export default function ImportContainer(){

    const [importOpen, setImportOpen] = useState(false);
    const { refs, floatingStyles } = useDropdownFloating(importOpen);

    return (
        <div className="flex gap-2 mt-2">
            <p className="text-lg">Import as: </p>
            <div className="flex gap-2">
                {/* Importing options parent selector*/}
                <div className="relative inline-block text-left">
                    <button
                        ref={refs.setReference}
                        id="importMenuBtn"
                        type="button"
                        onClick={() => setImportOpen(prev => !prev)}
                        className="flex justify-center gap-x-1.5 rounded-md bg-gray-700 text-white px-2 py-1 text-md hover:bg-black transition"
                    >
                        Import Options
                        <svg
                            className={`-mr-1 h-5 w-5 text-gray-400 h-4 w-4 transition-transform ${importOpen ? "rotate-180" : ""}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                    {/* Import Menu options (SVG and LaTeX).
                        Kept mounted (toggled via `hidden`) because the canvas script
                        binds to the button IDs once on load. */}
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        id="importMenu"
                        hidden={!importOpen}
                        className="w-40 rounded-md bg-gray-700 shadow-lg z-20"
                    >
                        <button
                            id="svgImportBtn"
                            type="button"
                            onClick={() => setImportOpen(false)}
                            className="block w-full px-4 py-2 text-left text-white hover:bg-gray-600"
                        >
                            Import as SVG
                        </button>
                        <button
                            id="latexImportBtn"
                            type="button"
                            onClick={() => setImportOpen(false)}
                            className="block w-full px-4 py-2 text-left text-white hover:bg-gray-600"
                        >
                            Import as LaTeX
                        </button>
                    </div>
                </div>
                <button
                    id="confirmImport"
                    className="flex justify-center gap-x-1.5 rounded-md bg-gray-700 text-white px-2 py-1 text-md hover:bg-black transition"
                    hidden
                >
                    Draw Import
                </button>
            </div>
        </div>
    );
}
