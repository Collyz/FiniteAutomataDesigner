import { Circle, circles } from "../../../public/scripts/Shapes/Circle";
import { alphabet, ndfsmTransitionSymbols, transitionLabelInputValidator } from "./ndfsmTransitionSymbols";
import { Arrow, arrows } from "../../../public/scripts/Shapes/Arrow";
import { SelfArrow } from "../../../public/scripts/Shapes/SelfArrow";
import { startState } from "../../../public/scripts/Shapes/EntryArrow";
import type { WalkStep } from "../../../public/scripts/canvasUtil/fsmCanvas";
import { Queue } from "../data-structures/";
import { parseInputString } from "../input/InputStringLexer";
import { showToast } from "../toast";


// Commits the transition to a given Arrow or SelfArrow after validating it.
export function commitTransition(lastEditedArrow: Arrow | SelfArrow | null){
    if(lastEditedArrow === null){
      return false;
    }
    if(lastEditedArrow.text === ""){
      lastEditedArrow.transition = new Set();
      console.log("Empty transition, accepted");
      return true;
    }

    // Leaving this here commented-out, for debugging purposes if the
    // need for it arises.
    // printTransitions();

    // Note: the code below will cover both the Arrow and the SelfArrow.
    // We won't need to split them into two separate cases.
    // This is because Arrow and SelfArrow both contain the startCircle
    // and endCircle attributes.
    
    // You don't want to check the transition for this current arrow
    // when iterating through all the arrows, so just empty it here.
    // If the transition is incorrect, then it'll remain empty.
    // If the transition is correct, then we'll reassign it to a new
    // value after all the checks.
    lastEditedArrow.transition = new Set();

    // The regex will remove any trailing/leading commas and whitespace
    const newTransitions = lastEditedArrow.text.replace(/^[,\s]+|[,\s]+$/g, "").split(",");

    // When you're typing the transition, the keydown listener checks if the
    // key pressed is in the alphabet. However, this is not enough.
    // This for-loop here will check if the entire transition itself is defined
    // in the alphabet.
    // For example, if the alphabet is {0,1}, but the transition is {00,01}, then
    // it should not work, since "00" and "01" are not in the alphabet.
    for(const newTransition of newTransitions){
      
      if(!ndfsmTransitionSymbols.has(newTransition)){
        lastEditedArrow.text = "";
        showToast("\'" + newTransition + "\' has not been defined in the alphabet!", { color: "red", duration: 6000 });
        return false;
      }
    }

    
    // Update the transition with the new one
    lastEditedArrow.transition = new Set(newTransitions);
    lastEditedArrow.text = lastEditedArrow.transition.values().toArray().join(",");
    return true;
    
}

// This is a "completeness" check: do all the arrows have a valid transition?
export function completenessCheck(){
  
  // We iterate over every single state
  for(const arrow of arrows){
    if(arrow instanceof Arrow || arrow instanceof SelfArrow){
      if(arrow.transition.size === 0){
        showToast("Arrow from " + arrow.startCircle.text + " to " + arrow.endCircle.text + " has no transition!", { color: "red", duration: 6000 });
        return false;
      }
    }
  }

  return true;
}

// This function performs BFS to do epsilon closure from a given state.
// Every epsilon arrow followed is added to epsilonArrows, for the walkthrough.
function epsilonTransitions(pointer: Circle, nextPointers: Set<Circle>, epsilonArrows: Set<Arrow | SelfArrow>){
  const queue: Queue<Circle> = new Queue();
  const visited: Map<Circle, boolean> = new Map();
  queue.offer(pointer);
  visited.set(pointer, true);


  while(!queue.isEmpty()){
    const current: Circle | undefined = queue.poll();
    let currentOutArrows: Set<Arrow | SelfArrow> = new Set();
    if(current !== undefined){
      currentOutArrows = current.outArrows;
    }
    for(const arrow of currentOutArrows){
      // If the transition contains epsilon, and the endCircle
      // has not been visited yet, then we add it to the queue.
      // We don't want to revisit nodes, since that could lead to infinite loops.
      if(arrow.transition.has("\\epsilon") && !visited.has(arrow.endCircle)){
        console.log("Splitting epsilon transition to " + arrow.endCircle.text);
        visited.set(arrow.endCircle, true);
        queue.offer(arrow.endCircle);
        nextPointers.add(arrow.endCircle);
        epsilonArrows.add(arrow);
      }
    }
  }

} 

// This function runs the NDFSM algorithm on the given input string.
// If step is provided, the run is a walkthrough: the set of active states and
// the transitions taken out of them are highlighted in turn.
export async function ndfsmAlgo(input: string, step: WalkStep | null){
  // Check if there is a start state and at least one accept state
  let acceptStateExists: boolean = false;
  for(const circle of circles){
    if(circle.isAccept){
      acceptStateExists = true;
      break;
    }
  }

  if(startState === null && !acceptStateExists){
    showToast("Start state and accept states are both undefined!", { color: "red", duration: 6000 });
    return false;
  }
  else if(startState === null){
    showToast("Start state undefined!", { color: "red", duration: 6000 });
    return false;
  }
  else if(!acceptStateExists){
    showToast("Accept state undefined!", { color: "red", duration: 6000 });
    return false;
  }

  // This will contain the pointers that will be used in the next iteration
  // of the NDFSM algorithm.
  const nextPointers: Set<Circle> = new Set();  

  nextPointers.add(startState.pointsToCircle);

  // Run an initial epsilon closure from the start state
  const startEpsilonArrows: Set<Arrow | SelfArrow> = new Set();
  epsilonTransitions(startState.pointsToCircle, nextPointers, startEpsilonArrows);

  // We parse the input string into tokens
  const parseResult = parseInputString(input, alphabet, transitionLabelInputValidator);

  // If parsing failed, alert the user and return false
  if (!parseResult.success) {
    showToast(parseResult.error, { color: "red", duration: 6000 });
    return false;
  }
  const tokens = parseResult.tokens;

  // Before beginning the NDFSM algorithm, we check if all transitions
  // of the NDFSM are complete. If not, we return false immediately.
  if(!completenessCheck()){
    return false;
  }

  // Walkthrough: show the entry arrow and the start state, then any epsilon
  // arrows followed from it and the full set of active states they lead to
  if(step){
    await step([startState]);
    await step([startState.pointsToCircle]);
    if(startEpsilonArrows.size > 0){
      await step([...startEpsilonArrows]);
      await step([...nextPointers]);
    }
  }

  // We begin traversing the input string.
  for(const char of tokens){
    // console.log("Processing character: " + char);
    // We make a copy of the current pointers set to iterate over.
    // This is because we don't want to modify the set while iterating over it.
    const currPointers : Set<Circle> = new Set(nextPointers);
    nextPointers.clear();

    // Every transition taken on this character, across all active states
    const takenArrows: (Arrow | SelfArrow)[] = [];

    for(const pointer of currPointers){
      if(pointer !== undefined){
        //console.log("At state: " + pointer.text);
        
        // We go through every outgoing arrow for the 
        // current state.
        const currOutArrows = pointer.outArrows;
        //console.log("Char: " + char);

        for(const arrow of currOutArrows){
          //console.log("At: " + curr.text);

          // If the current character from the input string
          // is found in one of the transitions, then we 
          // use that transition to move to the next state.
          if(arrow.transition.has(char)){
            // console.log("Taking transition: " + Array.from(arrow.transition).toString() + " to node " + arrow.endCircle.text);

            // We add the endCircle to the nextPointers set, since we will
            // iterate over it in the next round.
            nextPointers.add(arrow.endCircle);
            takenArrows.push(arrow);

          }
        }
        // console.log("Leaving state: " + pointer.text);

      }
    }

    // We also perform epsilon closure from every state reached on this character.
    // This happens after all transitions are taken so the walkthrough can show
    // the states reached directly before the ones reached through epsilon.
    const reachedStates: Circle[] = [...nextPointers];
    const epsilonArrows: Set<Arrow | SelfArrow> = new Set();
    for(const state of reachedStates){
      epsilonTransitions(state, nextPointers, epsilonArrows);
    }

    // Walkthrough: show the transitions taken and the states they reach, then
    // any epsilon arrows followed and the full set of active states they lead to
    if(step){
      await step(takenArrows);
      await step(reachedStates);
      if(epsilonArrows.size > 0){
        await step([...epsilonArrows]);
        await step([...nextPointers]);
      }
    }
  }

  // After processing all input characters, we check if any
  // of the current pointers are in an accept state.
  for(const pointer of nextPointers){
    if(pointer !== undefined && pointer.isAccept){
      showToast("The string, \"" + tokens.toString() + "\", was accepted!", { duration: 6000 });
    
      nextPointers.clear();
      return true;
    }
  }
  showToast("The string, \"" + tokens.toString() + "\", was rejected!", { duration: 6000, color: "red" });
  nextPointers.clear();
  return false;
}

