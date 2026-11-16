'use client';

import { Suspense } from "react";
import AutomataEditor from "../components/editor/AutomataEditor";

export default function DrawPage() {
    return (
        <Suspense>
            <AutomataEditor type="DRAW" />
        </Suspense>
    );
}
