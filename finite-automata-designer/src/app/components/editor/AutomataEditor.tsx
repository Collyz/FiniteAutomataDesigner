"use client";

{/* Script */}
import Script from 'next/script';

{/* Hooks */}
import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

{/* Components */}
import Instructions from "./Instructions";
import AutomataHeader from "./AutomataHeader";
import ImportContainer from "./import/ImportContainer";
import ExportContainer from "./export/ExportContainer";
import ExportTextArea from "./export/ExportTextArea";
import ImportTextArea from "./import/ImportTextArea";
import InputString from "./InputString";
import AlphabetInput from "./alphabet/AlphabetInput";
import AlphabetLabel from "./alphabet/AlphabetLabel";
import RunButton from "./RunButton";
import WalkButton from './WalkButton';
import WalkDelaySlider from './WalkDelaySlider';
import ProjectsButton from "./ProjectsButton";
import ClearCanvasButton from "./ClearCanvasButton";
import BackButton from "./BackButton";
import SaveActions from './SaveActions';
import SaveProjectModal from "../projects/SaveProjectModal";
import { showToast } from "../misc/ToastNotification";
import NewProjectButton from './NewProjectButton';
import PrintButton from '../printing/PrintButton';

{/* Database/Serialization */}
import { SerializedFA } from '@/lib/shared/types';
import { FiniteAutomaton } from '@/lib/shared/types';
import { getAutomaton } from '@/lib/automata/queries';
import { saveAutomaton, updateAutomaton } from "@/lib/automata/mutations";

import { automataApi } from './api/automataApi';
import { getEditorSession, setEditorSession } from '@/lib/editorSession';
import Loading from '../misc/Loading';
import ErrorMessage from '../misc/ErrorMessage';
import ToastHost from '../misc/ToastHost';

// Project ids are Postgres UUIDs; anything else would make the query itself fail
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AutomataEditorProps {
    type: "DFSM" | "NDFSM";
}

export default function AutomataEditor({ type }: AutomataEditorProps){

    const [hasMultiCharAlphabet, setHasMultiCharAlphabet] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Id of the project that couldn't be loaded. Storing the id (not a boolean)
    // means the error clears itself as soon as the URL points somewhere else.
    const [notFoundId, setNotFoundId] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const automatonId = searchParams?.get("id") as string;
    const projectNotFound = !!automatonId && notFoundId === automatonId;
    const isNewProject = (searchParams?.get("new") === "true") as boolean;

    const title: string = type === "DFSM" ? "Deterministic Finite State Machine" : "Non-Deterministic Finite State Machine";

    const api = automataApi[type];

    // Holds automaton data fetched before the canvas script has finished loading.
    // onReady on the <Script> tag drains this once the script is ready.
    const pendingAutomaton = useRef<SerializedFA | null>(null);

    useEffect(() => {
        if(isNewProject){
            api.resetEditor();
            return;
        }

        if (automatonId) {
            return;
        }

        const session = getEditorSession(type);

        if (!session) {
            router.replace(
                `/${type.toLowerCase()}?new=true`
            );

            return;
        }


        if (
            session.mode === "saved" &&
            session.projectId
        ) {
            router.replace(
                `/${type.toLowerCase()}?id=${session.projectId}`
            );

            return;
        }


        if (session.mode === "new") {
            router.replace(
                `/${type.toLowerCase()}?new=true`
            );
        }

    }, [
        type,
        automatonId,
        isNewProject,
        router,
        api
    ]);


    function syncAlphabet(symbols: string[]) {
        setHasMultiCharAlphabet(
            symbols.some(symbol => symbol.length > 1)
        );
    }

    useEffect(() => {

        // This will listen for alphabet updates from the canvas script
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<{ alphabet: string[] }>;

            syncAlphabet(customEvent.detail.alphabet);
        };

        // Ex: dfsmAlphabetUpdated or ndfsmAlphabetUpdated, where "type" is either "DFSM" or "NDFSM"
        window.addEventListener(`${type.toLowerCase()}AlphabetUpdated`, handler);

        return () => {
            // Ex: dfsmAlphabetUpdated or ndfsmAlphabetUpdated, where "type" is either "DFSM" or "NDFSM"
            window.removeEventListener(`${type.toLowerCase()}AlphabetUpdated`, handler);
        }

    }, [type]);

    // A project that can't be fetched (not logged in, query failed) or can't be
    // deserialized. Missing or inaccessible projects are handled separately by
    // the "Project not found" page. Without this the loading overlay
    // never clears, and the editor session keeps redirecting back to the same
    // broken id on every visit.
    const handleLoadFailure = useCallback((error: unknown) => {
        console.error(error);
        pendingAutomaton.current = null;

        setEditorSession(type, { mode: "new" });
        setName(null);
        setDescription(null);

        const reason = error instanceof Error ? error.message : String(error);
        showToast("Could not open project: " + reason, { color: "red", duration: 6000 });

        setLoading(false);
        // Ex: /dfsm?new=true or /ndfsm?new=true, where "type" is either "DFSM" or "NDFSM"
        router.replace(`/${type.toLowerCase()}?new=true`);
    }, [router, type]);

    useEffect(() => {
        // Clear stale pending data whenever the target id changes
        pendingAutomaton.current = null;

        async function loadAutomaton(){
            if(!automatonId){
                return;
            }

            // A malformed id can never match a project, so skip the round trip
            if(!UUID_PATTERN.test(automatonId)){
                setNotFoundId(automatonId);
                return;
            }

            try {
                const finiteAutomatonData: FiniteAutomaton = await getAutomaton(automatonId);

                // RLS hides other users' projects, so "missing" and "not yours" both land here
                if(!finiteAutomatonData){
                    setNotFoundId(automatonId);
                    return;
                }

                setName(finiteAutomatonData.name);
                setDescription(finiteAutomatonData.description);

                setEditorSession(type, {
                    mode: "saved",
                    projectId: automatonId
                });

                if (typeof api.loadFAIntoCanvas === 'function') {
                    // Canvas script is already loaded — call directly.
                    api.loadFAIntoCanvas(finiteAutomatonData.automaton);

                    setLoading(false);

                } else {
                    // Canvas script hasn't finished loading yet (production race).
                    // Store the data so the onReady callback can deliver it once ready.
                    pendingAutomaton.current = finiteAutomatonData.automaton;
                }
            }
            catch (error) {
                handleLoadFailure(error);
            }
        }

        loadAutomaton();
    },[automatonId, api, type, handleLoadFailure]);

    useEffect(() => {
        if (!isNewProject) return;

        setEditorSession(type, {
            mode: "new"
        });

        setLoading(false);

    }, [automatonId, api, isNewProject, type]);

    async function handleSaveAsNew(newName: string, newDescription: string){
    
        const serialized = api.exportFA();
        console.log(serialized);

        try{
            // The database stores the legacy DFA/NFA type names; map the UI name here
            const dbType = type === "DFSM" ? "DFA" as const : "NFA" as const;
            const finiteAutomataData = await saveAutomaton(serialized, newName, newDescription, dbType);
            showToast("Automaton saved!");
            // Ex: /dfsm?id=123 or /ndfsm?id=456, where "type" is either "DFSM" or "NDFSM"
            router.push(`/${type.toLowerCase()}?id=${finiteAutomataData.id}`);
        }
        catch (error) {
            console.error(error);
            showToast("Save failed: " + error, { color: "red", duration: 6000 });
        }
    }

    async function handleSave(){
        const serialized = api.exportFA();
        console.log(serialized);

        try{
            await updateAutomaton(automatonId, serialized);
            showToast("Automaton saved!");
        }
        catch (err) {
            console.error(err);
            showToast("Save failed.", { color: "red", duration: 6000 });
        }
    }

    const handleNewProject = () => {
        setEditorSession(type, {
            mode: "new",
        });

        setName(null);
        setDescription("");

        api.resetEditor();

        router.push(`/${type.toLowerCase()}?new=true`);
    };

    if (projectNotFound) {
        return (
            <ErrorMessage
                title="Project not found"
                message="This project doesn't exist, or you don't have access to it."
                action={<NewProjectButton handleNewProject={handleNewProject} />}
            />
        );
    }

    return (
        <div className="relative min-h-screen">
            {loading && (
                <div className="absolute inset-0 z-50">
                    <Loading />
                </div>
            )}

            <main className="min-h-screen bg-blue-100 flex flex-col items-center">
                <ToastHost />

                {/* FA title at the top */}
                <AutomataHeader
                    title={!name ? title : (type.toUpperCase() + ": " + name)}
                    description={description}
                />

                <div
                    className="flex w-full"
                >
                    {/* Back Button + Instructions parent div */}
                    <div className="flex-1 flex flex-col items-start h-13 pl-5" >
                        {/* Back Button to return to Home Page */}
                        <BackButton />

                        {/* Instructions dropdown */}
                        <Instructions 
                            type={type.toUpperCase() as "DFSM" | "NDFSM"}
                        />

                    </div>

                    {/* Canvas parent div */}
                    <div>
                        <div id="canvasDiv" className="flex flex-col text-black">
                            {/* Canvas for drawing FSM */}
                            {/* Ex: id=DFSMCanvas or id=NDFSMCanvas, where "type" is either "DFSM" or "NDFSM" */}
                            <canvas id={`${type.toUpperCase()}Canvas`} width={800} height={600} className="rounded-lg border border-gray-400"></canvas>

                            { /* Project Related buttons below the canvas */}
                            <div className="pt-3 flex gap-1 self-center">
                                {/* Save button to save the FA to the database only if the user is logged in */}
                                {!automatonId ? 
                                    ( <SaveActions onSave={() => setIsSaving(true)} />) : 
                                    ( <SaveActions onSave={handleSave} onSaveAs={() => setIsSaving(true)} />
                                )}
                                {/* My Projects button to open the projects page that will list all of the users project when logged in */}
                                <ProjectsButton />
                                <NewProjectButton handleNewProject={handleNewProject} /> 
                                { /* Print button parent container */}
                                <PrintButton />
                            </div>
                            {/* Exporting dropdowns container */}
                            <ExportContainer />

                            {/* Importing dropdowns container */}
                            <ImportContainer />
                            
                            {/* Exporting text area */}
                            <ExportTextArea />

                            {/* Importing text area */}
                            <ImportTextArea />
                        
                        </div>
                    </div>
                        
                    {/* Right hand parent div*/}
                    <div className="flex-1">
                        <div className="flex flex-col gap-3 h-13 justify-start-safe pl-5">
                            <div className="flex flex-col gap-5">
                                <div id='inputDiv' className="flex flex-col self-center w-full max-w-md text-black">
                                    {/* Textbox for inputting strings */}
                                    <InputString />
                                    {/* Alphabet display */}
                                    <AlphabetLabel hasMultiCharAlphabet={hasMultiCharAlphabet}
                                    />
                                    {/* Input box for new alphabet */}
                                    <AlphabetInput />
                                    {/* Canvas Related Buttons Parent Container */}
                                    <div className="flex self-center gap-3 pt-3">
                                        {/* Run button to run the FA with the given input string */}
                                        <RunButton type={type.toUpperCase() as "DFSM" | "NDFSM"}/>
                                        {/* Clear Canvas parent container */}
                                        <ClearCanvasButton />
                                        <WalkButton type={type.toUpperCase() as "DFSM" | "NDFSM"} />
                                    </div>
                                    {/* Slider for the delay between walkthrough steps */}
                                    <div className="pt-3">
                                        <WalkDelaySlider />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SaveProjectModal 
                    isOpen={isSaving}
                    initialName={null}
                    initialDescription={null}
                    onClose={() => setIsSaving(false)}
                    onSave={handleSaveAsNew}
                />

            </main>

            <Script
                // Ex: /scripts/dfsm/dfsmCanvas.js or /scripts/ndfsm/ndfsmCanvas.js, where "type" is either "DFSM" or "NDFSM"
                src={`/scripts/${type.toLowerCase()}/${type.toLowerCase()}Canvas.js`}
                type="module"
                strategy="afterInteractive"
                crossOrigin="anonymous"
                onReady={() => {
                    // Fires when the script first loads AND after every subsequent
                    // component mount where the script is already cached.
                    // Delivers any automaton data that arrived before the script was ready.
                    if (pendingAutomaton.current !== null) {
                        try {
                            api.loadFAIntoCanvas(pendingAutomaton.current);
                            pendingAutomaton.current = null;
                            setLoading(false);
                        }
                        catch (error) {
                            handleLoadFailure(error);
                        }
                    }
                    else{
                        // Synchronize React with the current alphabet now that the
                        // canvas API definitely exists.
                        syncAlphabet(api.getAlphabet());
                    }   
                }}
            />
        </div>

    );
}


