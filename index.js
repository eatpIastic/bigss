/// <reference types="../CTAutocomplete" />

import { registerWhen } from "../BloomCore/utils/Utils";
import RenderLib from "../RenderLib";


const buttonLocations = [-17, -37, -51, -74, 7, -60, -6, -28];

let timer = 0;
let tracker = 0;
let average = 0;
let aN = 0;
let timings = [];
let onPhase = -1;
let locations = null;
let pattern = [];
let currentPattern = [];
let itsHappening = false;
let splits = false;
let buttonLocation = -1;
let pb = -1;
let fullBlock = false;

const BUTTONWIDTH = 0.4;
const BUTTONHEIGHT = 0.26;


registerWhen(register("renderWorld", () => {
  if(!currentPattern || !currentPattern.length) return;

  if(itsHappening) {
    renderBackground();
  }

  const b = [...currentPattern]
  for (let i = 0; i < b.length; i++) {
    let [x, y, z] = b[i].split(",").map(a => parseInt(a))
    let color = [0, 1, 0]
    if (i == 1) color = [1, 1, 0]
    else if (i > 1) color = [1, 0, 0]

    RenderLib.drawInnerEspBox(
      x - 0.5,
      y + 0.5 - (BUTTONHEIGHT / 2) + 0.001,
      z + 0.07, 
      BUTTONWIDTH,
      BUTTONHEIGHT,
      ...color,
      0.7,
      false
    );
  }
}), () => currentPattern.length);


function renderBackground() {
  let blockStr = currentPattern[tracker-1];
  let [x, y, z] = blockStr.split(",");
  x = parseFloat(x) - .5;
  z = parseFloat(z) + .4;
  RenderLib.drawInnerEspBox(x, y, z, 1, 1, 0, .5, .5, .75, 0);
}


register("playerInteract", (action, pos) => {
  if(action.toString() !== "RIGHT_CLICK_BLOCK") return;
  if(itsHappening) return;
  let [x, y, z] = [pos.getX(), pos.getY(), pos.getZ()];
  
  // if it's the start button
  if (y == 5 && z == -26 && buttonLocations.includes(x)) { 
    buttonLocation = buttonLocations.indexOf(x);
    reset();
    initSS();
    return;
  }

  if(onPhase < 0 || !pattern.length || timer == 0 || tracker < onPhase) return;

  if(fullBlock && World.getBlockAt(x, y, z-1).type.getID() == 77) {
    z--;
  }

  let isButton = World.getBlockAt(x, y, z).type.getID() == 77;
  if (!isButton) return;
  let str = [x+1, y, z+1].join(",");

  if(currentPattern[0] != str) {
    return;
    // ChatLib.chat("You Failed!");
    // return reset();
  }

  World.playSound("note.pling", 1, 2);
  currentPattern = currentPattern.splice(1);

  if(onPhase==4 && !currentPattern.length) {
    let timeNow = Date.now();
    timings.push(timeNow);
    let completedIn = parseFloat(((timeNow - timer) / 1000.0).toFixed(2));
    if(completedIn < pb || pb <= 0) pb = completedIn;
    aN += 1;
    average = (average * (aN-1)/aN + (completedIn / aN)).toFixed(2);
    ChatLib.chat(`SS ${fullBlock ? "(FB) " : ""}Completed in ${completedIn} &7(${pb}) [${average}]`);

    if(splits) {
      let timingString = "";
      for(let j = 0; j < timings.length; j += 2) {
        timingString = timingString.concat(`${((timings[j + 1] - timings[j]) / 1000).toFixed(2)} `);
      }
      ChatLib.chat(`${completedIn}: ${timingString}`);
    }

    reset();
    return;
  }

  if(!currentPattern.length) {
    onPhase += 1;
    timings.push(Date.now());
    runPhase();
  }
})


register("worldLoad", () => reset());


function initSS() {
  timer = Date.now();
  onPhase = 1;
  locations = getLocations();
  pattern = shuffle(locations);
  runPhase();
}


function runPhase() {
  tracker = 0;
  itsHappening = true;
  for(let idx = 0; idx <= onPhase + 1; idx++) {
    setTimeout( () => {
      if(tracker>onPhase) {
        itsHappening = false;
        timings.push(Date.now());
        return;
      }
      currentPattern.push(pattern[tracker]);
      tracker++;
    }, 500 * idx);
  }
}


function getLocations() {
  let [x0, y0, z0] = [buttonLocations[buttonLocation], 4.0, -25];
  let buttons = [];
  for (let dy = 0; dy <= 3; dy++) {
    for (let dz = 0; dz <= 3; dz++) {
        let [x, y, z] = [x0 - dz, y0 + dy, z0];
        let str = [x, y, z].join(",");
        buttons.push(str);
    }
  }
  return buttons;
}


function shuffle(bigarray) {
  let array = [...bigarray];
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


register("command", (...args) => {
  switch(args[0]) {
    case "splits":
      splits = !splits;
      break;
    case "fullblock":
      fullBlock = !fullBlock
      break;
    default:
      ChatLib.chat("splits, fullblock");
      break;
  }
}).setName("bigss").setTabCompletions(["splits", "fullblock"]);


function reset() {
  tracker = 0;
  timer = 0
  onPhase = -1;
  timings = [];
  pattern = [];
  currentPattern = [];
}
