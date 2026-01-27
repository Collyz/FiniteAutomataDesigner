import { Circle, circles } from "../../../public/scripts/Shapes/Circle";
import { alphabet, nfaTransitionSymbols } from "./nfaTransitionSymbols";
import { Arrow, arrows } from "../../../public/scripts/Shapes/Arrow";
import { SelfArrow } from "../../../public/scripts/Shapes/SelfArrow";
import { startState } from "../../../public/scripts/Shapes/EntryArrow";
import { Queue } from "../data-structures/";
import { parseInputString } from "../input/InputStringLexer";


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
      
      if(!nfaTransitionSymbols.has(newTransition)){
        lastEditedArrow.text = "";
        alert("\'" + newTransition + "\' has not been defined in the alphabet!");
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
        alert("Arrow from " + arrow.startCircle.text + " to " + arrow.endCircle.text + " has no transition!");
        return false;
      }
    }
  }

  return true;
}

// This function performs BFS to do epsilon closure from a given state
function epsilonTransitions(pointer: Circle, nextPointers: Set<Circle>){
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
      }
    }
  }

} 

// This function runs the NFA algorithm on the given input string
export function nfaAlgo(input: string){

  // Check if there is a start state and at least one accept state
  let acceptStateExists: boolean = false;
  for(const circle of circles){
    if(circle.isAccept){
      acceptStateExists = true;
      break;
    }
  }

  if(startState === null && !acceptStateExists){
    alert("Start state and accept states are both undefined!");
    return false;
  }
  else if(startState === null){
    alert("Start state undefined!");
    return false;
  }
  else if(!acceptStateExists){
    alert("Accept state undefined!");
    return false;
  }

  // First, we make sure the input string is legal. If it contains
  // characters not defined in the alphabet, then we return false immediately.
  for(const char of input){
    if(!nfaTransitionSymbols.has(char)){
      alert("Input contains \'" + char + "\', which is not in the alphabet");
      return false;
    }
  }

  // This will contain the pointers that will be used in the next iteration
  // of the NFA algorithm.
  const nextPointers: Set<Circle> = new Set();  

  nextPointers.add(startState.pointsToCircle);

  // Run an initial epsilon closure from the start state
  epsilonTransitions(startState.pointsToCircle, nextPointers);

  // We parse the input string into tokens
  const parseResult = parseInputString(input, alphabet);

  // If parsing failed, alert the user and return false
  if (!parseResult.success) {
    alert(parseResult.error);
    return false;
  }
  const tokens = parseResult.tokens;

  // Before beginning the NFA algorithm, we check if all transitions
  // of the NFA are complete. If not, we return false immediately.
  if(!completenessCheck()){
    return false;
  }

  // We begin traversing the input string.
  for(const char of tokens){
    // console.log("Processing character: " + char);
    // We make a copy of the current pointers set to iterate over.
    // This is because we don't want to modify the set while iterating over it.
    const currPointers : Set<Circle> = new Set(nextPointers);
    nextPointers.clear();

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

            // We also perform epsilon closure from the new state
            epsilonTransitions(arrow.endCircle, nextPointers);
          
          }
        }
        // console.log("Leaving state: " + pointer.text);
        
      }
    }
  }

  // After processing all input characters, we check if any
  // of the current pointers are in an accept state.
  for(const pointer of nextPointers){
    if(pointer !== undefined && pointer.isAccept){
      alert("The string, \"" + tokens.toString() + "\", was accepted!");
      //console.log("Accepted!");
      nextPointers.clear();
      return true;
    }
  }
  
  alert("The string, \"" + tokens.toString() + "\", was rejected!");
  //console.log("Rejected!");
  nextPointers.clear();
  return false;
}

