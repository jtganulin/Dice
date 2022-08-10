//This script is the logic behind Dice. The methods are incompatible with IE versions<9,
//So possibly, in main HTML, add a check similar to:
// 	if (el.addEventListener)  el.addEventListener('click', example, false); 
//	else if (el.attachEvent) 	el.attachEvent('onclick', example);
//which will determine the type of event handling required. Possibly have 2 separate Logic.js's,
//one compatible with IE pre-9, and one for the rest of the browsers. One of the 2 will be loaded
//from main HTML depending on feature detection result to reduce total download size.

//Possibly change click eventlisteners to onclick to eliminate incompatibilities
//But only one function can be assigned; for holding dice, can onclick take arguments?

//innerText for IE8 and textContent for all others: var elText = elArg.innerText || elArg.textContent

//Need color theme, compatibility, UI design improvements, gameOverBox transparent bg fallback, fiveOfKindBonus?,
//possible renaming of confusing identifiers, possibly minify by hand, optimize for smaller devices: on smaller devices increase width
//of hiddenColumn table, etc.

var rollsAvailable = 3;

//If the user wants to observe the possible score gained from playing a certain move, they
//can click one cell, observe the score change, then click another cell; after this "transition"
//stage, the user presses "Play" and the currently selected cell is permanently populated with
//the computed value, this array is then cleared, and the dice and controls are reset, thus starting
//a new round. previouslySelectedOption allows this functionality.
//This array holds a reference to a .valueCell that a user has selected before pressing "Play"
//The array is length 0 if a user has not yet selected a cell, and length 1 otherwise.
//previouslySelectedOption[0] accesses a reference to the previously selected cell
//this reference can be analyzed with el.getAttribute(attr), etc.
var previouslySelectedOption = [];

/*completedCells is incremented each time the player updates a cell. It is reset when reset() is called.
This allows the end of the game to determined; At the end of each computeTotals(), where scores are
computed and cells are updated, completedCells is checked for equality to (currently 13,
as multipleFiveOfKind functionality has not yet been implemented). If the condition matches, the current
game is deemed complete and the game over/final score modal dialog (gameOverBox) is shown.*/
var completedCells = 0;

//Resets the values of each cell to 'null'. Used when starting a new game.
function reset() {
	if(confirm("Are you sure you want to start a new game?")) {
		//Need to hide gameContentBox, and reset game over detection cell count, and gameOverBoxScore
		rollsAvailable = 3;
		previouslySelectedOption = [];
		completedCells = 0;
		var cells = ["ones", "twos", "threes", "fours", "fives", "sixes", "upSub", "upBonus", "threeOfKind", "fourOfKind", "fullHouse", 
		"smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance", "lowerTotal", "grandTotal"];
		for(var i=0; i<cells.length; i++) {
			document.getElementById(cells[i]).textContent = " ";
			//Skips resetting of .nonValue cells
			if(document.getElementById(cells[i]).className.match(/\bnonValue\b/)) continue;
			if(!document.getElementById(cells[i]).className.match(/\bnonValue\b/)) document.getElementById(cells[i]).style.backgroundColor = "white";
			//Remove disabled class from populated cells
			if(document.getElementById(cells[i]).className.match(/\bupperSectionCell\b/g)) document.getElementById(cells[i]).className = "cell valueCell upperSectionCell";
			else document.getElementById(cells[i]).className = "cell valueCell lowerSectionCell";
		
		}
		//Possibly remove variable and just set both of .upperTotal to null in individual statements.
		var upperTotals = document.getElementsByClassName("upperTotal");
		for(i=0; i<upperTotals.length; i++) upperTotals[i].textContent = " ";
		//Resets dice, rollBtn, and playBtn
		resetDice();
		//Hides gameOverBox, and gameOverBoxScore
		document.getElementById("gameOverBox").style.visibility = "hidden";
		document.getElementById("gameOverBoxScore").textContent = "0";
	} 
}

//Resets "rollBtn" and "playBtn", as well as dice.
function resetDice() {
	rollsAvailable = 3;
	document.getElementById("rollBtn").style.backgroundColor = "blue";
	document.getElementById("rollBtn").textContent = "Roll ("+rollsAvailable+" remaining)";
	document.getElementById("playBtn").style.backgroundColor = "gray";
	//Resets dice values and classes
	for(var i=1; i<=5; i++) {
		document.getElementById("die"+i).textContent = 0;
		document.getElementById("die"+i).className = "die";
	}
}

//Test load; remove on production
function testLoad() {
	document.getElementById("threeOfKind").textContent = 24;
	document.getElementById("fourOfKind").textContent = 28;
	document.getElementById("fullHouse").textContent = 28;
	document.getElementById("smallStraight").textContent = 28;
	document.getElementById("largeStraight").textContent = 28;
	document.getElementById("fiveOfKind").textContent = 28;
	document.getElementById("fiveOfKindBonus").textContent = 28;
	document.getElementById("chance").textContent = 28;
	completedCells += 8;
}

//Toggles #instructionsBox and instructionsColumn cells
function toggleInstructions() {
	document.getElementById("instructionsBox").style.display = (document.getElementById("instructionsBox").style.display === "none") ? "block" : "none";
	var cellsToHide = document.getElementsByClassName("instructionsColumn");
	for (var i=0; i<cellsToHide.length; i++) cellsToHide[i].classList.toggle("hiddenInstruction");
	document.getElementById("cellTable").classList.toggle("hiddenColumnTable");
}

//Possibly replace local cell arrays with one single global array and in functions and loops reference the needed section of the array
//such as var cells = ["ones", "twos", "threes", "fours", "fives", "sixes",
//			"threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance"];
//and in upper section requests start from cells[0] and for lower cells start from cells[6]

//Computes the total score from the upper section; in addition, checks if player receives the bonus
function computeUpperTotal() {
	var upperCells = ["ones", "twos", "threes", "fours", "fives", "sixes"];
	var sum = 0;
	for(var i=0; i<upperCells.length; i++) {
		//Checks for and skips empty cells, otherwise computes sum of cell values
		if(document.getElementById(upperCells[i]).textContent === " " || document.getElementById(upperCells[i]).textContent === null) continue;
		else sum += parseInt(document.getElementById(upperCells[i]).textContent);
	}
	document.getElementById("upSub").textContent = sum;
	//Give upper bonus if sum>=63
	if(sum>=63) {
		document.getElementById("upBonus").textContent = 35;
		sum += 35;
	} else document.getElementById("upBonus").textContent = 0;
	var upperTotals = document.getElementsByClassName("upperTotal");
	for(i=0; i<upperTotals.length; i++) upperTotals[i].textContent = sum;
}

//Computes the total score from the lower section
function computeLowerTotal() {
	var lowerCells = ["threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "chance"]; //, "fiveOfKindBonus", "chance"];
	var sum = 0;
	for(var i=0; i<lowerCells.length; i++) {
		//Checks for and skips empty cells, otherwise computes sum of cell values
		if(document.getElementById(lowerCells[i]).textContent === " " || document.getElementById(lowerCells[i]).textContent === null) continue;
		else sum += parseInt(document.getElementById(lowerCells[i]).textContent);
	}
	document.getElementById("lowerTotal").textContent = sum;
}


/*
//Need to implement fiveOfKindBonus functionality; After on five of a kind is acheived and entered, any subsequent five of a kind should
//be (automatically?) inserted into the fiveofKindBonus cell, each bonus should add 100 points. In order to reduce complexity of
//disabled checks and user entry of bonuses, it might be beneficial to automatically add the bonus whenever a player gets a five of a kind
//and after they select a cell. This method would however require the getLowerSectionCell function to check whether the player received
//a five of a kind on every cell click, even if they didn't click the fiveOfKind(Bonus) cell, and could therefore impact performance. 
*/
//Computes the total score from both sections; this could be adapted to be run whenever a cell is permanently populated.
//During temporary placements, either the computeUpper or ..Lower could be run to give the user an
//idea of their score if they played that specific move.
function computeTotals() {
	//Split conditions ?
	//If dice are not rolled or if an option has not been selected, do not allow confirmation of move
	if(parseInt(document.getElementById("die1").textContent) === 0) {
		alert("Please roll the dice"); //Possibly remove these as it is obvious 
		return;
	} else if(previouslySelectedOption.length === 0) {
		alert("Please select a cell to play");
		return;
	}
	computeUpperTotal();
	computeLowerTotal();
	//Compute total score and output to "grandTotal" cell
	document.getElementById("grandTotal").textContent = (parseInt(document.getElementById("lowerTotal").textContent) +
		parseInt(document.getElementsByClassName("upperTotal").item(0).textContent));
	//Reset holds on all dice and set values to 0
	resetDice();
	//Disable previously selected cell/temporary value when starting a new round
	//If fiveOfKindBonus has been achieved, do not disable it
	//previouslySelectedOption[0].className.match(/\bdisabled\b/g)
	// if(previouslySelectedOption[0].getAttribute("id") === "fiveOfKindBonus" && (parseInt(previouslySelectedOption[0].textContent) != 0 && parseInt(previouslySelectedOption[0].textContent) != 300)) {
	// 	previouslySelectedOption[0].style.backgroundColor = "white";
	// 	previouslySelectedOption = [];
	// } else {
		previouslySelectedOption[0].className += " disabled";
		previouslySelectedOption[0].style.backgroundColor = "white";
		//Clear previously selected cell reference
		previouslySelectedOption = [];
		//Checks if player has completed all possible cells, and if so, shows the game over dialog (gameOverBox)
		//Currently 13, update when multipleFiveOfKind is implemented
		completedCells++;
		if(completedCells >=13) {
			document.getElementById("gameOverBox").style.visibility = "visible";
			//Also need to insert final score into gameOverBoxScore
			document.getElementById("gameOverBoxScore").textContent = (parseInt(document.getElementById("lowerTotal").textContent) + parseInt(document.getElementsByClassName("upperTotal").item(0).textContent));
		} //else completedCells++; Moving above check to avoid possible undetected move completion/game over condition
	// }
}

//Rolls dice. On each roll changes each die to a new random value in [1-6], unless held by player
//The ability to "hold" dice, i.e. have their (user-clicked dice) values persist on a new roll, will need
//to be implemented. When dice are held, their appearance should change to reflect their new state,
//the "hold" state needs to be togglable. When the play button is clicked and the "round" is over,
//all held dice need to return to normal states and should be rolled again/have their values resets.
function rollDice() {
	var rollBtn = document.getElementById("rollBtn");
	//If player has rolls left
	if(rollsAvailable>0) {
		var dice = ["die1", "die2", "die3", "die4", "die5"];
		//Change each die to a random value in [1-6]
		for(var i=0; i<dice.length; i++) {
			//If die is not held, give it a new value
			if(!document.getElementById(dice[i]).className.match(/\bhold\b/g)) {
				document.getElementById(dice[i]).textContent = (Math.floor(Math.random()*(6-1+1))+1);
				//Included twice to ensure dice are rolled randomly and so values do not "stick"
				document.getElementById(dice[i]).textContent = (Math.floor(Math.random()*(6-1+1))+1);
			}
		}
		//Decrease available rolls
		rollsAvailable -= 1;
		//Change Roll button to show rolls available
		rollBtn.textContent = "Roll ("+rollsAvailable+" remaining)";
		//If no rolls are available, change Roll button to indicate this
		if(rollsAvailable === 0) rollBtn.style.backgroundColor = "gray";
	}
}

//Computes the sum of all dice values
function getDiceSum() {
	var sum = 0;
	for(var i=1; i<6; i++) sum += parseInt(document.getElementById("die"+i).textContent);
	return sum;
}

function getUpperSectionValues(el) {
	//Check if dice have been rolled, if not, do not continue; == is used instead of === to allow type conversion
	if(document.getElementById("die1").textContent == 0) {
		alert("Please roll the dice first.");
		return;
	}
	//If clicked cell is already populated, do not modify its value
	if(el.className.match(/\bdisabled\b/)) {
		alert("Clicked disabled cell"); //Possibly remove
		return;
	} else if(previouslySelectedOption.length != 0) {
		//Clear the previously selected cell, and remove active styling
		previouslySelectedOption[0].textContent = " ";
		previouslySelectedOption[0].style.backgroundColor = "white";
	}
	var factor = 0, sum = 0;
	switch(el.getAttribute("id")) {
		case "ones":
			factor = 1;
			break;
		case "twos":
			factor = 2;
			break;
		case "threes":
			factor = 3;
			break;
		case "fours":
			factor = 4;
			break;
		case "fives":
			factor = 5;
			break;
		case "sixes":
			factor = 6;
			break;
		default:
			console.log("Error");
			break;
	}
	for(var i=1; i<6; i++) {
		if(parseInt(document.getElementById("die"+i).textContent) === factor) sum += factor;
	}
	//Style the currently selected element to indicate that it is temporarily populated
	el.style.backgroundColor = "yellow";
	el.textContent = sum;
	//Update currently selected cell reference
	previouslySelectedOption = [el];
	//Indicate that a move can be played
	document.getElementById("playBtn").style.backgroundColor = "blue";
}

//Assigns event listeners to .upperSectionCells
var upperCells = document.getElementsByClassName("upperSectionCell");
for(var i=0; i<upperCells.length; i++) upperCells.item(i).addEventListener("click", function() {getUpperSectionValues(this);}, false);

//Need to check if a move has been played before allowing playBtn, need to check if previouslySelectedOption is empty on resets~,
//Need to prevent webkit text highlight/interstitial action highlight via CSS
//Need to ignore blank cells on calculation
//Animate dice pre-roll etc.

function getLowerSectionValues(el) {
	//Check if dice have been rolled
	if(document.getElementById("die1").textContent == 0) {
		alert("Please roll the dice first.");
		return;
	}
	//If clicked cell is already populated, do not modify its value
	if(el.className.match(/\bdisabled\b/)) {
		alert("Clicked disabled cell"); //Possibly remove
		return;
	//Clear the previously selected cell, and remove active styling
	} else if(previouslySelectedOption.length != 0) {
		previouslySelectedOption[0].textContent = " ";
		previouslySelectedOption[0].style.backgroundColor = "white";
	}

	//diceValues holds dice values as strings and is used to check lower section conditions using RE
	var diceValues = [];
	for (var i=1; i<=5; i++) diceValues[i] = document.getElementById("die"+i).textContent;
	//Since lowerSectionCell conditions are being tested via RE, we need to sort the array of dice values to allow valid matches,
	//and then join the sorted array elements into one string to test against RE
	diceValues.sort();
	diceValues = diceValues.join("");
	//Determine the clicked cell condition and test whether the dice allow the move, if so update cell with score, otherwise insert 0 
	switch(el.getAttribute("id")) {
		case "threeOfKind":
			if(/(.)\1{2}/.test(diceValues)) {
				el.textContent = getDiceSum();
			} else el.textContent = 0;
			if(parseInt(el.textContent) != getDiceSum()) el.textContent = 0;
			break;
		case "fourOfKind":
			if(/(.)\1{3}/.test(diceValues)) {
				el.textContent = getDiceSum();
			} else el.textContent = 0;
			if(parseInt(el.textContent) != getDiceSum()) el.textContent = 0;
			break;
		case "fullHouse":
			if(/(.)\1{2}(.)\2|(.)\3(.)\4{2}/.test(diceValues)) el.textContent = 25;
			else el.textContent = 0;
			//if(parseInt(el.textContent) != getDiceSum()) el.textContent = 0;
			break;
		case "smallStraight":
			//diceValues.replace() removes duplicates so cases like "12334" get matched as small straight correctly
			if(/1234|2345|3456/.test(diceValues.replace(/(.)\1/, "$1"))) el.textContent = 35;
			else el.textContent = 0;
			break;
		case "largeStraight":
			if(/12345|23456/.test(diceValues.replace(/(.)\1/, "$1"))) el.textContent = 40;
			else el.textContent = 0;			
			break;
		case "fiveOfKind":
			if(/(.)\1{4}/.test(diceValues)) el.textContent = 50;
			else el.textContent = 0;
			// if(parseInt(el.textContent) != 0) el.textContent = 50; 
			break;
		//Change fiveOfKindBonus cell so that as long as a player has received it once, it caanot be disabled;
		// this is so a player can score the bonus multiple times (3 max)
		/*case "fiveOfKindBonus":
			Check if player has received another five of a kind
			if(getDiceCounts()[Object.keys(getDiceCounts())[0]] != 5) break;

			Check if player received 5 of kind and has played:
			if(document.getElementById("fiveOfKind").textContent === "" || parseInt(document.getElementById("fiveOfKind").textContent) === 0) {
				el.textContent = 0;
			} else {
				el.textContent = (el.textContent == "") ? "100" : parseInt(el.textContent) + 100;
				//if(document.getElementById("fiveOfKindBonus") === "")  el.textContent = 0;
				//el.textContent = parseInt(document.getElementById("fiveOfKindBonus").textContent) + 100;
				//if(document.getElementById("fiveOfKindBonus").textContent == undefined) {
				//	el.textContent = 100;
				//} else el.textContent = (parseInt(el.textContent)+100);
			}
			break;*/
		case "chance":
			el.textContent = getDiceSum();
			break;
		//If no other case has matched there has been an unknown error
		default:
			console.log("Error");
			break;
	}
	//Style the currently selected element to indicate that it is temporarily populated
	el.style.backgroundColor = "yellow";
	//Update currently selected cell reference
	previouslySelectedOption = [el];
	//Indicate that a move can be played
	document.getElementById("playBtn").style.backgroundColor = "blue";
}

//Assigns event listeners to .lowerSectionCells
var lowerCells = document.getElementsByClassName("lowerSectionCell");
for(var i=0; i<lowerCells.length; i++) lowerCells.item(i).addEventListener("click", function() {getLowerSectionValues(this);}, false);

//To allow "holding" of dice (a die's value persists between rolls), each die needs
//to detect if it's clicked and indicate to the user that it's being held
//This state should be togglble, and all holds should be cleared when a value is "played".
function toggleHold(el) {
	//Check if dice have not yet been rolled by testing for equality to 0
	if(el.textContent == 0 || el.className.match(/\bhold\b/g)) el.className = "die";
	else el.className += " hold";
}
var dice = document.getElementsByClassName("die");
for(var i=0; i<dice.length; i++) dice.item(i).addEventListener("click", function() {toggleHold(this);}, false);

//Could replace with onclick
//To ensure compatibility with <=IE8, create a second script that replaces addEventListener... with attachEvent, or onclick
document.getElementById("showInstructions").addEventListener("click", toggleInstructions, false);
document.getElementById("rollBtn").addEventListener("click", rollDice, false);
document.getElementById("playBtn").addEventListener("click", computeTotals, false);
document.getElementById("resetBtn").addEventListener("click", reset, false);
document.getElementById("gameOverBoxResetBtn").addEventListener("click", reset, false);