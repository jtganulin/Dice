//Possibly need to change getElementsByClassName to querySelectorAll(".className") for IE8 compat.
//Need to decide whether to implement ~<IE9 compatibility, can use vanilla functionality (need class selections, etc.), or use external library
//If equiv. functionality cannot be achieved, possibly suggest user upgrade browser or fall back to compat. version

//Need color theme, compatibility, UI design improvements, gameOverBox transparent bg fallback, fiveOfKindBonus?,
//possible renaming of confusing identifiers, possibly minify by hand, optimize for smaller devices: on smaller devices increase width
//of hiddenColumn table, etc.

//Need to prevent webkit text highlight/interstitial action highlight via CSS
//Animate dice pre-roll etc.

//Need to decide whether to include any script other than logicCompat on production; could reduce reqs by using only it, and ensuring no incompatible behavior is used
//On production optimize, remove comments, etc.

//Possibly replace local cell arrays with one single global array and in functions and loops reference the needed section of the array
//such as var cells = ["ones", "twos", "threes", "fours", "fives", "sixes",
//			"threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance"];
//and in upper section requests start from cells[0] and for lower cells start from cells[6]

var rollsAvailable = 3;
var previouslySelectedOption = [];
var fiveOfKindFlag = false;
var fiveOfKindConfirmFlag = false;

/*completedCells is incremented each time the player updates a cell. It is reset when reset() is called.
This allows the end of the game to determined; At the end of each computeTotals(), where scores are
computed and cells are updated, completedCells is checked for equality to (currently 13,
as multipleFiveOfKind functionality has not yet been implemented). If the condition matches, the current
game is deemed complete and the game over/final score modal dialog (gameOverBox) is shown.*/
var completedCells = 0;

//Resets the values of each cell. Used when starting a new game.
function reset() {
	if(confirm("Are you sure you want to start a new game?")) {
		rollsAvailable = 3;
		previouslySelectedOption = [];
		completedCells = 0;
		fiveOfKindFlag = false;
		fiveOfKindConfirmFlag = false;
		var cells = ["ones", "twos", "threes", "fours", "fives", "sixes", "upSub", "upBonus", "threeOfKind", "fourOfKind", "fullHouse",
		"smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance", "lowerTotal", "grandTotal"];
		for(var i=0; i<cells.length; i++) {
			document.getElementById(cells[i]).innerHTML = " ";
			if(document.getElementById(cells[i]).className.match(/\bnonValue\b/)) continue;
			else document.getElementById(cells[i]).style.backgroundColor = "white"; //if(!document.getElementById(cells[i]).className.match(/\bnonValue\b/))
			//Remove disabled class from populated cells
			if(document.getElementById(cells[i]).className.match(/\bupperSectionCell\b/g)) document.getElementById(cells[i]).className = "cell valueCell upperSectionCell";
			else document.getElementById(cells[i]).className = "cell valueCell lowerSectionCell";

		}
		//Possibly remove variable and just set both of .upperTotal to null in individual statements.
		var upperTotals = document.getElementsByClassName("upperTotal");
		for(i=0; i<upperTotals.length; i++) upperTotals.item(i).innerHTML = " ";
		//Resets dice, rollBtn, and playBtn
		resetDice();
		//Hides gameOverBox, and gameOverBoxScore
		document.getElementById("gameOverBox").style.visibility = "hidden";
		document.getElementById("gameOverBoxScore").innerHTML = 0;
	}
}

//Resets "rollBtn" and "playBtn", as well as dice.
function resetDice() {
	rollsAvailable = 3;
	document.getElementById("rollBtn").style.backgroundColor = "blue";
	document.getElementById("rollBtn").innerHTML = "Roll ("+rollsAvailable+" remaining)";
	document.getElementById("playBtn").style.backgroundColor = "gray";
	//Resets dice values and classes
	for(var i=1; i<=5; i++) {
		document.getElementById("die"+i).innerHTML = 0;
		document.getElementById("die"+i).className = "die";
	}
}

//Test load; remove on production
function testLoad() {
	document.getElementById("threeOfKind").innerHTML = 24;
	document.getElementById("fourOfKind").innerHTML = 28;
	document.getElementById("fullHouse").innerHTML = 28;
	document.getElementById("smallStraight").innerHTML = 28;
	document.getElementById("largeStraight").innerHTML = 28;
	document.getElementById("fiveOfKind").innerHTML = 28;
	document.getElementById("fiveOfKindBonus").innerHTML = 28;
	document.getElementById("chance").innerHTML = 28;
	completedCells += 8;
}
function genFiveOfKind() {
	for(var i=0; i<dice.length; i++) dice[i].innerHTML = 5;
}

//Toggles #instructionsBox and instructionsColumn cells
function toggleInstructions() {
	document.getElementById("instructionsBox").style.display = (document.getElementById("instructionsBox").style.display === "none") ? "block" : "none";
	var cellsToHide = document.getElementsByClassName("instructionsColumn");
	for(var i=0; i<cellsToHide.length; i++) {
		if(cellsToHide.item(i).className.match(/\bhiddenInstruction\b/g)) cellsToHide.item(i).className = "cell instructionsColumn";
		else cellsToHide.item(i).className += " hiddenInstruction";
	}
	// if(document.getElementById("cellTable").className.match(/\bhiddenColumnTable\b/g)) document.getElementById("cellTable").className = "";
	// else document.getElementById("cellTable").className = "hiddenColumnTable";
}

//Computes the total score from the upper section; in addition, checks if player receives the bonus
function computeUpperTotal() {
	var upperCells = ["ones", "twos", "threes", "fours", "fives", "sixes"];
	var sum = 0;
	for(var i=0; i<upperCells.length; i++) {
		//Checks for and skips empty cells, otherwise computes sum of cell values
		if(document.getElementById(upperCells[i]).innerHTML === " " || document.getElementById(upperCells[i]).innerHTML === null) continue;
		else sum += parseInt(document.getElementById(upperCells[i]).innerHTML);
	}
	document.getElementById("upSub").innerHTML = sum;
	//Give upper bonus if sum>=63
	if(sum>=63) {
		document.getElementById("upBonus").innerHTML = 35;
		sum += 35;
	} else document.getElementById("upBonus").innerHTML = 0;
	var upperTotals = document.getElementsByClassName("upperTotal");
	for(i=0; i<upperTotals.length; i++) upperTotals.item(i).innerHTML = sum;
}

//Computes the total score from the lower section
function computeLowerTotal() {
	var lowerCells = ["threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance"];
	var sum = 0;
	for(var i=0; i<lowerCells.length; i++) {
		if(document.getElementById(lowerCells[i]).innerHTML === " " || document.getElementById(lowerCells[i]).innerHTML === null) continue;
		else sum += parseInt(document.getElementById(lowerCells[i]).innerHTML);
	}
	document.getElementById("lowerTotal").innerHTML = sum;
}

//Computes the total score from both sections; this could be adapted to be run whenever a cell is permanently populated.
//During temporary placements, either the computeUpper or ..Lower could be run to give the user an
//idea of their score if they played that specific move.
function computeTotals() {
	//If dice are not rolled or if an option has not been selected, do not allow confirmation of move
	if(document.getElementById("die1").innerHTML == 0) {
		alert("Please roll the dice first.");
		return;
	} else if(previouslySelectedOption.length === 0) {
		alert("Please select a cell to play.");
		return;
	}
	//Tests for fiveOfKindBonus condition
	if(fiveOfKindFlag && fiveOfKindConfirmFlag) {
		var diceValues = [];
		for (var i=1; i<=5; i++) diceValues[i] = document.getElementById("die"+i).innerHTML;
		diceValues.sort();
		diceValues = diceValues.join("");
		if(/(.)\1{4}/.test(diceValues)) document.getElementById("fiveOfKindBonus").innerHTML = (document.getElementById("fiveOfKindBonus").innerHTML == " ") ? 100 : parseInt(document.getElementById("fiveOfKindBonus").innerHTML) + 100;
	}
	computeUpperTotal();
	computeLowerTotal();
	//Compute total score and output to "grandTotal" cell
	document.getElementById("grandTotal").innerHTML = (parseInt(document.getElementById("lowerTotal").innerHTML) + parseInt(document.getElementsByClassName("upperTotal").item(0).innerHTML));
	resetDice();
	previouslySelectedOption[0].className += " disabled";
	previouslySelectedOption[0].style.backgroundColor = "white";
	previouslySelectedOption = [];
	completedCells++;
	//Checks if player has completed all possible cells, and if so, shows the game over dialog (gameOverBox)
	if(completedCells >=13) {
		document.getElementById("gameOverBox").style.visibility = "visible";
		//Also need to insert final score into gameOverBoxScore
		document.getElementById("gameOverBoxScore").innerHTML = (parseInt(document.getElementById("lowerTotal").innerHTML) + parseInt(document.getElementsByClassName("upperTotal").item(0).innerHTML));
	}
	fiveOfKindConfirmFlag = true;
}

//Rolls dice. On each roll changes each die to a new random value in [1-6], unless held by player
//The ability to "hold" dice, i.e. have their (user-clicked dice) values persist on a new roll, will need
//to be implemented. When dice are held, their appearance should change to reflect their new state,
//the "hold" state needs to be togglable. When the play button is clicked and the "round" is over,
//all held dice need to return to normal states and should be rolled again/have their values resets.
function rollDice() {
	var rollBtn = document.getElementById("rollBtn");
	if(rollsAvailable>0) {
		//Change each die to a random value in [1-6]
		//If die is not held, give it a new value
		for(var i=1; i<6; i++) if(!document.getElementById("die"+i).className.match(/\bhold\b/g)) document.getElementById("die"+i).innerHTML = (Math.floor(Math.random()*(6-1+1))+1);
		rollsAvailable--;
		//Change Roll button to show rolls available
		rollBtn.innerHTML = "Roll ("+rollsAvailable+" remaining)";
		//If no rolls are available, change Roll button to indicate this
		if(rollsAvailable === 0) rollBtn.style.backgroundColor = "gray";
	}
}

//Computes the sum of all dice values
function getDiceSum() {
	var sum = 0;
	for(var i=1; i<6; i++) sum += parseInt(document.getElementById("die"+i).innerHTML);
	return sum;
}

function getUpperSectionValues(el) {
	//Check if dice have been rolled, if not, do not continue; == is used instead of === to allow type conversion
	if(document.getElementById("die1").innerHTML == 0) {
		alert("Please roll the dice first.");
		return;
	}
	//If clicked cell is already populated, do not modify its value
	if(el.className.match(/\bdisabled\b/)) {
		alert("Clicked disabled cell"); //Possibly remove
		return;
	} else if(previouslySelectedOption.length != 0) {
		//Clear the previously selected cell, and remove active styling
		previouslySelectedOption[0].innerHTML = " ";
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
	for(var i=1; i<6; i++) if(parseInt(document.getElementById("die"+i).innerHTML) === factor) sum += factor;
	//Style the currently selected element to indicate that it is temporarily populated
	el.style.backgroundColor = "yellow";
	el.innerHTML = sum;
	//Update currently selected cell reference
	previouslySelectedOption = [el];
	//Indicate that a move can be played
	document.getElementById("playBtn").style.backgroundColor = "blue";
}

//Assigns event listeners to .upperSectionCells
var upperCells = document.getElementsByClassName("upperSectionCell");
for(var i=0; i<upperCells.length; i++) upperCells.item(i).onclick = function() {getUpperSectionValues(this);};//addEventListener("click", function() {getUpperSectionValues(this);}, false);

function getLowerSectionValues(el) {
	if(document.getElementById("die1").innerHTML == 0) {
		alert("Please roll the dice first.");
		return;
	}
	//If clicked cell is already populated, do not modify its value
	if(el.className.match(/\bdisabled\b/)) {
		alert("Clicked disabled cell"); //Possibly remove
		return;
	//Clear the previously selected cell, and remove active styling
	} else if(previouslySelectedOption.length != 0) {
		previouslySelectedOption[0].innerHTML = " ";
		previouslySelectedOption[0].style.backgroundColor = "white";
	}

	//diceValues holds dice values as strings and is used to check lower section conditions using RE
	var diceValues = [];
	for (var i=1; i<=5; i++) diceValues[i] = document.getElementById("die"+i).innerHTML;
	//Since lowerSectionCell conditions are being tested via RE, we need to sort the array of dice values to allow valid matches,
	//and then join the sorted array elements into one string to test against RE
	diceValues.sort();
	diceValues = diceValues.join("");

	//Determine the clicked cell condition and test whether the dice allow the move, if so update cell with score, otherwise insert 0
	switch(el.getAttribute("id")) {
		case "threeOfKind":
			if(/(.)\1{2}/.test(diceValues)) el.innerHTML = getDiceSum();
			else el.innerHTML = 0;
			if(parseInt(el.innerHTML) != getDiceSum()) el.innerHTML = 0;
			break;
		case "fourOfKind":
			if(/(.)\1{3}/.test(diceValues)) el.innerHTML = getDiceSum();
			else el.innerHTML = 0;
			if(parseInt(el.innerHTML) != getDiceSum()) el.innerHTML = 0;
			break;
		case "fullHouse":
			if(/(.)\1{2}(.)\2|(.)\3(.)\4{2}/.test(diceValues)) el.innerHTML = 25;
			else el.innerHTML = 0;
			break;
		case "smallStraight":
			if(/1234|2345|3456/.test(diceValues.replace(/(.)\1/, "$1"))) el.innerHTML = 35;
			else el.innerHTML = 0;
			break;
		case "largeStraight":
			if(/12345|23456/.test(diceValues.replace(/(.)\1/, "$1"))) el.innerHTML = 40;
			else el.innerHTML = 0;
			break;
		case "fiveOfKind":
			if(/(.)\1{4}/.test(diceValues)) {
				fiveOfKindFlag = true;
				el.innerHTML = 50;
			} else el.innerHTML = 0;
			break;
		case "chance":
			el.innerHTML = getDiceSum();
			break;
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
for(var i=0; i<lowerCells.length; i++) lowerCells.item(i).onclick = function() {getLowerSectionValues(this);};//addEventListener("click", function() {getLowerSectionValues(this);}, false);

//To allow "holding" of dice (a die's value persists between rolls), each die needs
//to detect if it's clicked and indicate to the user that it's being held
//This state should be togglble, and all holds should be cleared when a value is "played".
function toggleHold(el) {
	//Check if dice have not yet been rolled by testing for equality to 0
	if(el.innerHTML == 0 || el.className.match(/\bhold\b/g)) el.className = "die";
	else el.className += " hold";
}
var dice = document.getElementsByClassName("die");
for(var i=0; i<dice.length; i++) dice.item(i).onclick = function() {toggleHold(this);};

document.getElementById("showInstructions").onclick = toggleInstructions;
document.getElementById("rollBtn").onclick = rollDice;
document.getElementById("playBtn").onclick = computeTotals;
document.getElementById("resetBtn").onclick = reset;
document.getElementById("gameOverBoxResetBtn").onclick = reset;
