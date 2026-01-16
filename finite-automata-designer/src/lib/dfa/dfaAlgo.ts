import { Circle, circles } from "../../../public/scripts/Shapes/Circle";
import { alphabet } from "../../../public/scripts/alphabet";
import { Arrow } from "../../../public/scripts/Shapes/Arrow";
import { SelfArrow } from "../../../public/scripts/Shapes/SelfArrow";
import { startState } from "../../../public/scripts/Shapes/EntryArrow";
import { parseInputString } from "../input/InputStringLexer";

// I haven't figured out how to stop compiling the imports into JS, so here's a command
// to get rid of them once you cd into their directory lol:
// rm alphabet.js && rm arrow.js && rm circle.js && rm draw.js && rm EntryArrow.js && rm SelfArrow.js

// This is a "correctness" check: does the new transition coincide
// with other transitions going out from that state? If it does,
// then it fails determinism.
export function transitionDeterminismCheck(lastEditedArrow: Arrow | SelfArrow | null){
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
      
      if(!alphabet.has(newTransition)){
        lastEditedArrow.text = "";
        alert("\'" + newTransition + "\' has not been defined in the alphabet!");
        return false;
      }
    }

    // Check the outArrows of the initial node
    const startCircOutArrows = lastEditedArrow.startCircle.outArrows;
    
    // Keep track of all invalid transitions to be printed to the user later
    const existingTransitions: Array<string> = [];

    // You iterate through every arrow that goes outwards from this current node
    for(const arrow of startCircOutArrows){
      const oldTransitions = arrow.transition;

      // Then, you iterate through each of the old transitions for each arrow
      for(const oldTransition of oldTransitions){
        
        // Next, you iterate through each transition in the new
        // transition, and compare it against each transition
        // in the original transition for that arrow
        for(const newTransition of newTransitions){

          // If a transition already exists, then it fails determinism
          if(newTransition === oldTransition){
            lastEditedArrow.text = "";
            existingTransitions.push(newTransition);
          }
        }
      }
    }

    if(existingTransitions.length == 1){
      alert("This translation violates determinism since \'" + existingTransitions[0] + "\' is already present for an outgoing arrow of this node");
      return false;
    }
    else if(existingTransitions.length > 1){
      alert("This translation violates determinism since \'" + existingTransitions.toString() + "\' are already present for an outgoing arrows of this node");
      return false;
    }
    else{
      // Update the transition with the new one
      lastEditedArrow.transition = new Set(newTransitions);
      lastEditedArrow.text = lastEditedArrow.transition.values().toArray().join(",");
      return true;
    }
}

// function printTransitions(){
//   console.log("Printing transitions");
  
//   for(let circle of circles){
//     console.log("Num of trans for circle " + circle.text + " is: " + circle.outArrows.size);
//     console.log("Trans for circle: " + circle.text + "{ ");
//     const outArrows = circle.outArrows;
//     for(let arrow of outArrows){
//       console.log(arrow.transition);
//     }
//     console.log("}");
//   }
// }

// This is a "completeness" check: were all characters of the
// alphabet used when building the DFA? This is processed
// every time we input a string.
export function inputDeterminismCheck(){
  
  // We iterate over every single state
  for(const node of circles){
    // We retrieve the outgoing arrows from the current state
    const outArrows = node.outArrows;
    for(const char of alphabet){
      // The "exists" variable will be used to track if
			// this specific character in the alphabet has been
			// used as a transition or not for this specific state
      let exists: boolean = false;

      // We iterate over all the outgoing arrows from the
			// current state
      for(const arrow of outArrows){

        // Then, for each arrow, we iterate over every
				// transition for it.
        for(const transition of arrow.transition){

          // If the current character in the alphabet
					// does exist as a transition for this current
					// state, then exists = true and we break out
					// of this loop.
          if (char === transition){
            exists = true;
            break;
          }

          // If the transition does not exist in the alphabet,
					// then immediately return false, since it violates
					// determinism.
          if(!alphabet.has(transition)){
            alert("Transition " + transition + " for state " + node.text + " has not been defined in the alphabet");
            return false;
          }
        }
      }

      // If we iterated over all the transitions for all the outgoing
			// arrows of this state, and the current character in the alphabet
			// was not found to be a transition at all, then it fails determinism
      if(!exists){
        alert(char + " has not been implemented for this state: " + node.text + "; not all characters from alphabet were used");
        return false;
      }
    }
  }

  return true;
}

export function dfaAlgo(input: string){
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
  // for(const char of input){
  //   if(!alphabet.has(char)){
  //     alert("Input contains \'" + char + "\', which is not in the alphabet");
  //     return false;
  //   }
  // }

  const parseResult = parseInputString(input, alphabet);

  if (!parseResult.success) {
    alert(parseResult.error);
    return false;
  }
  const tokens = parseResult.tokens;

  // This "curr" variable will be used to traverse over the whole DFA
  let curr: Circle = startState.pointsToCircle;

  // We check if the DFA has been defined correctly. If not, then return false.
  if(!inputDeterminismCheck()){
    return false;
  }

  // We begin traversing the input string.
  for(const char of tokens){

    // We go through every outgoing arrow for the 
		// current state.
    const currOutArrows = curr.outArrows;
    //console.log("Char: " + char);
    for(const arrow of currOutArrows){
      //console.log("At: " + curr.text);
      //console.log("Checking transition: " + arrow.transition);

      // If the current character from the input string
			// is found in one of the transitions, then we 
			// use that transition to move to the next state.
      if(arrow.transition.has(char)){
        //console.log("Taking transition: " + arrow.transition + " to node " + arrow.endCircle.text);
        curr = arrow.endCircle;
        break;
      }
      else{
        //console.log("Not taking transition: " + arrow.transition + " to node " + arrow.endCircle.text);
      }
    }
  }

  //console.log("Finally at: " + curr.text);

  // If the final state that we arrived at is the end state,
	// that means the string was accepted.
  if(curr.isAccept){
    alert("The string, \"" + tokens.toString() + "\", was accepted!");
    //console.log("Accepted!");
    return true;
  }
  // Else, the final state we arrived at is not the end state,
	// which means the string was rejected.
  else{
    alert("The string, \"" + tokens.toString() + "\", was rejected!");
    //console.log("Rejected!");
    return false;
  }


}
