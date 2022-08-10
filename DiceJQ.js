// Migrating to jQuery for more concise code and easier browser compatibility

//Need color theme, UI design improvements, gameOverBox transparent bg fallback
//possible renaming of confusing identifiers, optimize for smaller devices: on smaller devices increase width
//of hiddenColumn table, etc.

//Need to prevent webkit text highlight/interstitial action highlight via CSS
//Animate dice pre-roll etc.

//Possibly replace local cell arrays with one single global array and in functions and loops reference the needed section of the array
//such as let cells = ["ones", "twos", "threes", "fours", "fives", "sixes",
//			"threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance"];
//and in upper section requests start from cells[0] and for lower cells start from cells[6]

$(document).ready(function() {
    let rollsAvailable = 3;
    let previouslySelectedOption = [];
    let fiveOfKindFlag = false;
    let fiveOfKindConfirmFlag = false;

    /*completedCells is incremented each time the player updates a cell. It is reset when reset() is called.
    This allows the end of the game to determined; At the end of each computeTotals(), where scores are
    computed and cells are updated, completedCells is checked for equality to (currently 13,
    as multipleFiveOfKind functionality has not yet been implemented). If the condition matches, the current
    game is deemed complete and the game over/final score modal dialog (gameOverBox) is shown.*/
    let completedCells = 0;

    //Resets the values of each cell. Used when starting a new game.
    function reset() {
        if (confirm("Are you sure you want to start a new game?")) {
            rollsAvailable = 3;
            previouslySelectedOption = [];
            completedCells = 0;
            fiveOfKindFlag = false;
            fiveOfKindConfirmFlag = false;
            let cells = ["ones", "twos", "threes", "fours", "fives", "sixes", "upSub", "upBonus", "threeOfKind", "fourOfKind", "fullHouse",
                "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance", "lowerTotal", "grandTotal"];
            for (let i = 0; i < cells.length; i++) {
                $("#"+(cells[i])).html(" ");
                if ($("#" + cells[i]).hasClass("nonValue")) continue;
                else $("#" + cells[i]).css("background-color", "white");
                //Remove disabled class from populated cells
                $("#" + cells[i]).removeClass("disabled");
            }
            $(".upperTotal").text(" ");
            //Resets dice, rollBtn, and playBtn
            resetDice();
            //Hides gameOverBox, and gameOverBoxScore
            $("#gameOverBox").hide();
            $("#gameOverBoxScore").text(0);
        }
    }

    //Resets "rollBtn" and "playBtn", as well as dice.
    function resetDice() {
        rollsAvailable = 3;
        $("#rollBtn").css('background-color', 'blue');
        $("#rollBtn").text("Roll (" + rollsAvailable + " remaining)");
        $("#playBtn").css('background-color', 'gray');
        $(".die").text(0);
        $(".die").removeClass('hold');
    }

    // For testing
    function genFiveOfKind() {
        for (let i = 1; i < 6; i++) $("#die"+i).text(5);
    }

    //Toggles #instructionsBox and instructionsColumn cells
    function toggleInstructions() {
        $("#instructionsBox").toggle();
        $(".instructionsColumn").toggleClass("hiddenInstruction");
    }

    //Computes the total score from the upper section; in addition, checks if player receives the bonus
    function computeUpperTotal() {
        let upperCells = ["ones", "twos", "threes", "fours", "fives", "sixes"];
        let sum = 0;
        for (let i = 0; i < upperCells.length; i++) {
            //Checks for and skips empty cells, otherwise computes sum of cell values
            if ($("#"+upperCells[i]).text() == " " || $("#"+upperCells[i]).text() === null) continue;
            else sum += parseInt($("#"+upperCells[i]).text());
        }
        $("#upSub").text(sum);
        //Give upper bonus if sum>=63
        if (sum >= 63) {
            $("#upBonus").text(35);
            sum += 35;
        } else $("#upBonus").text(0);
        $(".upperTotal").text(sum);
    }

    //Computes the total score from the lower section
    function computeLowerTotal() {
        let lowerCells = ["threeOfKind", "fourOfKind", "fullHouse", "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance"];
        let sum = 0;
        for (let i = 0; i < lowerCells.length; i++) {
            if ($("#"+lowerCells[i]).text() == " " || $("#"+lowerCells[i]).text() === null) continue;
            else sum += parseInt($("#"+lowerCells[i]).text());
        }
        $("#lowerTotal").text(sum);
    }

    function computeTotals() {
        //If dice are not rolled or if an option has not been selected, do not allow confirmation of move
        if ($("#die1").text() == 0) {
            alert("Please roll the dice first.");
            return;
        } else if (previouslySelectedOption.length === 0) {
            alert("Please select a cell to play.");
            return;
        }
        //Tests for fiveOfKindBonus condition
        if (fiveOfKindFlag && fiveOfKindConfirmFlag) {
            let diceValues = [];
            for (let i = 1; i <= 5; i++) diceValues[i] = $("#die" + i).text();
            diceValues.sort();
            diceValues = diceValues.join("");
            if (/(.)\1{4}/.test(diceValues)) $("#fiveOfKindBonus").text(($("#fiveOfKindBonus").text() == " ") ? 100 : parseInt($("#fiveOfKindBonus").text()) + 100);
        }
        computeUpperTotal();
        computeLowerTotal();
        //Compute total score and output to "grandTotal" cell
        $("#grandTotal").text(parseInt($("#lowerTotal").text()) + parseInt($(".upperTotal").first().text()));
        resetDice();
        previouslySelectedOption[0].addClass("disabled");
        previouslySelectedOption[0].css("background-color", "white");
        previouslySelectedOption = [];
        completedCells++;
        //Checks if player has completed all possible cells, and if so, shows the game over dialog (gameOverBox)
        if (completedCells >= 13) {
            $("#gameOverBox").show();
            //Also need to insert final score into gameOverBoxScore
            $("#gameOverBoxScore").text(parseInt($("#lowerTotal").text()) + parseInt($(".upperTotal").first().text()));
        }
        fiveOfKindConfirmFlag = true;
    }

    //Rolls dice. On each roll changes each die to a new random value in [1-6], unless held by player
    //The ability to "hold" dice, i.e. have their (user-clicked dice) values persist on a new roll, will need
    //to be implemented. When dice are held, their appearance should change to reflect their new state,
    //the "hold" state needs to be togglable. When the play button is clicked and the "round" is over,
    //all held dice need to return to normal states and should be rolled again/have their values resets.
    function rollDice() {
        if (rollsAvailable > 0) {
            //Change each die to a random value in [1-6]
            //If die is not held, give it a new value
            for (let i = 1; i < 6; i++) if (!$("#die" + i).hasClass("hold")) $("#die" + i).text(Math.floor(Math.random() * (6 - 1 + 1)) + 1);
            rollsAvailable--;
            //Change Roll button to show rolls available
            $("#rollBtn").text("Roll (" + rollsAvailable + " remaining)");
            //If no rolls are available, change Roll button to indicate this
            if (rollsAvailable === 0) $("#rollBtn").css("background-color", "gray");
        }
    }

    //Computes the sum of all dice values
    function getDiceSum() {
        let sum = 0;
        for (let i = 1; i < 6; i++) sum += parseInt($("#die" + i).text());
        return sum;
    }

    function getUpperSectionValues() {
        //Check if dice have been rolled, if not, do not continue; == is used instead of === to allow type conversion
        if ($("#die1").text() == 0) {
            alert("Please roll the dice first.");
            return;
        }
        //If clicked cell is already populated, do not modify its value
        if ($(this).hasClass("disabled")) {
            return;
        } else if (previouslySelectedOption.length != 0) {
            //Clear the previously selected cell, and remove active styling
            previouslySelectedOption[0].text(" ");
            previouslySelectedOption[0].css("background-color", "white");
        }
        let factor = 0, sum = 0;
        switch ($(this).attr("id")) {
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
        for (let i = 1; i < 6; i++) if (parseInt($("#die" + i).text()) == factor) sum += factor;
        //Style the currently selected element to indicate that it is temporarily populated
        $(this).css("background-color", "yellow");
        $(this).text(sum);
        //Update currently selected cell reference
        previouslySelectedOption = [$(this)];
        //Indicate that a move can be played
        $("#playBtn").css("background-color", "blue");
    }

    function getLowerSectionValues() {
        if ($("#die1").text() == 0) {
            alert("Please roll the dice first.");
            return;
        }
        //If clicked cell is already populated, do not modify its value
        if ($(this).hasClass("disabled")) {
            alert("Clicked disabled cell"); //Possibly remove
            return;
            //Clear the previously selected cell, and remove active styling
        } else if (previouslySelectedOption.length != 0) {
            previouslySelectedOption[0].text(" ");
            previouslySelectedOption[0].css("background-color", "white");
        }

        //diceValues holds dice values as strings and is used to check lower section conditions using RE
        let diceValues = [];
        for (let i = 1; i <= 5; i++) diceValues[i] = $("#die" + i).text();
        //Since lowerSectionCell conditions are being tested via RE, we need to sort the array of dice values to allow valid matches,
        //and then join the sorted array elements into one string to test against RE
        diceValues.sort();
        diceValues = diceValues.join("");

        //Determine the clicked cell condition and test whether the dice allow the move, if so update cell with score, otherwise insert 0
        switch ($(this).attr("id")) {
            case "threeOfKind":
                if (/(.)\1{2}/.test(diceValues)) $(this).text(getDiceSum());
                else $(this).text(0);
                if (parseInt($(this).text()) != getDiceSum()) $(this).text(0);
                break;
            case "fourOfKind":
                if (/(.)\1{3}/.test(diceValues)) $(this).text(getDiceSum());
                else $(this).text(0);
                if (parseInt($(this).text()) != getDiceSum()) $(this).text(0);
                break;
            case "fullHouse":
                if (/(.)\1{2}(.)\2|(.)\3(.)\4{2}/.test(diceValues)) $(this).text(25);
                else $(this).text(0);
                break;
            case "smallStraight":
                if (/1234|2345|3456/.test(diceValues.replace(/(.)\1/, "$1"))) $(this).text(35);
                else $(this).text(0);
                break;
            case "largeStraight":
                if (/12345|23456/.test(diceValues.replace(/(.)\1/, "$1"))) $(this).text(40);
                else $(this).text(0);
                break;
            case "fiveOfKind":
                if (/(.)\1{4}/.test(diceValues)) {
                    fiveOfKindFlag = true;
                    $(this).text(50);
                } else $(this).text(0);
                break;
            case "chance":
                $(this).text(getDiceSum());
                break;
            default:
                console.log("Error");
                break;
        }
        //Style the currently selected element to indicate that it is temporarily populated
        $(this).css("background-color", "yellow");
        //Update currently selected cell reference
        previouslySelectedOption = [$(this)];
        //Indicate that a move can be played
        $("#playBtn").css("background-color", "blue");
    }

    //To allow "holding" of dice (a die's value persists between rolls), each die needs
    //to detect if it's clicked and indicate to the user that it's being held
    //This state should support toggling, and all holds should be cleared when a value is "played".
    function toggleHold() {
        //Check if dice have not yet been rolled by testing for equality to 0
        if ($(this).text() == 0) return false;
        $(this).toggleClass('hold');
    }

    $(".die").on("click", toggleHold);
    $(".upperSectionCell").on("click", getUpperSectionValues);
    $(".lowerSectionCell").on("click", getLowerSectionValues);
    $("#showInstructions").on("click", toggleInstructions);
    $("#rollBtn").on("click", rollDice);
    $("#playBtn").on("click", computeTotals);
    $("#resetBtn").on("click", reset);
    $("#gameOverBoxResetBtn").on("click", reset);
    $("#genFiveOfKind").click(genFiveOfKind);
});
