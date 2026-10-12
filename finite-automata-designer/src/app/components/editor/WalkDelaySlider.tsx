"use client";

export default function WalkDelaySlider(){
    return (
        <div>
            {/* The canvas script keeps this label in sync with the slider */}
            <label
                id="walkDelayLabel"
                htmlFor="walkDelay"
                className="block mb-1 text-gray-700 text-xl font-bold"
            >
                Walkthrough Delay: 1.0s
            </label>
            {/* Slider for the delay between walkthrough steps, in ms */}
            <input
                id="walkDelay"
                type="range"
                min={500}
                max={10000}
                step={500}
                defaultValue={1000}
                className="w-full accent-gray-700 cursor-pointer"
            />
        </div>
    );
}
