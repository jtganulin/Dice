$(document).ready(function() {
    let rollsAvailable = 3;
    let previouslySelectedOption = [];
    let fiveOfKindFlag = false;
    let completedCells = 0;

    $("#rollBtn").addClass("rollsAvailable");

    // Update a specific die with the SVG representation of its value
    function updateDiceDisplay(dieId, value) {
        const circles = $(`#${dieId}`).find("circle");
        circles.hide();

        switch (value) {
            case 1:
                circles.eq(4).show(); // Center dot
                break;
            case 2:
                circles.eq(0).show(); // Top left
                circles.eq(8).show(); // Bottom right
                break;
            case 3:
                circles.eq(0).show(); // Top left
                circles.eq(4).show(); // Center
                circles.eq(8).show(); // Bottom right
                break;
            case 4:
                circles.eq(0).show(); // Top left
                circles.eq(2).show(); // Top right
                circles.eq(6).show(); // Bottom left
                circles.eq(8).show(); // Bottom right
                break;
            case 5:
                circles.eq(0).show(); // Top left
                circles.eq(2).show(); // Top right
                circles.eq(4).show(); // Center
                circles.eq(6).show(); // Bottom left
                circles.eq(8).show(); // Bottom right
                break;
            case 6:
                circles.eq(0).show(); // Top left
                circles.eq(3).show(); // Middle left
                circles.eq(6).show(); // Bottom left
                circles.eq(2).show(); // Top right
                circles.eq(5).show(); // Middle right
                circles.eq(8).show(); // Bottom right
                break;
        }
    }

    // On new game, reset all cells and dice and close modals
    function reset() {
        if (confirm("Are you sure you want to start a new game?")) {
            rollsAvailable = 3;
            previouslySelectedOption = [];
            fiveOfKindFlag = false;
            completedCells = 0;
            $("#highScoreNameInput").val("");
            $("#gameOverMessage").remove();
            $("#cellTable").addClass("bottomMargin");

            let cells = ["ones", "twos", "threes", "fours", "fives", "sixes", "upSub", "upBonus", "threeOfKind", "fourOfKind", "fullHouse",
                "smallStraight", "largeStraight", "fiveOfKind", "fiveOfKindBonus", "chance", "lowerTotal"];
            for (let i = 0; i < cells.length; i++) {
                $("#" + (cells[i])).text("");
                if ($("#" + cells[i]).hasClass("nonValue")) continue;
                //Remove disabled class from populated cells
                $("#" + cells[i]).removeClass("disabled selected");
            }
            $(".upperTotal").text("");
            $(".grandTotal").text("");
            //Reset dice, rollBtn, and playBtn
            resetDice();
            //Hides gameOverModal
            $("#gameOverModal").hide();
            $("#diceControlsContainer").show();
        }
    }

    //Resets "rollBtn" and "playBtn", as well as dice.
    function resetDice() {
        rollsAvailable = 3;
        $("#rollBtn").addClass("rollsAvailable");
        $("#rollsLabel").text(rollsAvailable);
        $("#playBtn").removeClass("playAvailable");
        for (let i = 1; i <= 5; i++) {
            $(`#die${i} span`).text("0");
            updateDiceDisplay(`die${i}`, 0);
        }
        $(".die").removeClass("hold");
    }

    // Toggles #instructionsBox and instructionsColumn cells
    function toggleInstructions() {
        $("#instructionsBox").toggle();

        // Save the preference in localStorage
        if (window.localStorage) {
            const instructionsHidden = $("#instructionsBox").is(":hidden");
            localStorage.setItem("instructionsHidden", instructionsHidden);
        }
    }

    function toggleHowToScoreColumn() {
        // Update the data attribute on the cellTable, which adjusts the
        // table width to account for the instructions column
        $(".instructionsColumn").toggle();
        if ($("#cellTable").attr("data-instructions-hidden") === "true") {
            $("#cellTable").attr("data-instructions-hidden", "false");
        } else {
            $("#cellTable").attr("data-instructions-hidden", "true");
        }
    }

    // Rolls dice. On each roll changes each die to a new random value in [1-6], unless held by player
    function rollDice() {
        if (rollsAvailable < 1) {
            alert("No rolls remaining. Please play a cell first.");
            return;
        }

        $(".die:not(.hold)").addClass("rolling");

        // Clear the current selected cell
        if (previouslySelectedOption.length != 0) {
            previouslySelectedOption[0].removeClass("selected");
            previouslySelectedOption[0].text("");
            previouslySelectedOption = [];
        }

        $("#playBtn").removeClass("playAvailable");

        // After animation, update dice values
        setTimeout(() => {
            for (let i = 1; i <= 5; i++) {
                if (!$(`#die${i}`).hasClass("hold")) {
                    const newValue = Math.floor(Math.random() * 6) + 1;
                    $(`#die${i} span`).text(newValue);
                    updateDiceDisplay(`die${i}`, newValue);
                }
            }
            $(".die").removeClass("rolling");
            rollsAvailable--;
            $("#rollsLabel").text(rollsAvailable);
            if (rollsAvailable === 0) $("#rollBtn").removeClass("rollsAvailable");
        }, 500);
    }

    //To allow "holding" of dice (a die's value persists between rolls), each die needs
    //to detect if it's clicked and indicate to the user that it's being held
    //This state should support toggling, and all holds should be cleared when a value is "played".
    function toggleHold() {
        if ($(this).find("span").text() == 0) return false;
        $(this).toggleClass("hold");
    }

    //Since lowerSectionCell conditions are being tested via RE, we need to sort the array of dice values to allow valid matches,
    //and then join the sorted array elements into one string to test against RE
    function getSortedDiceValues() {
        let diceValues = [];
        for (let i = 1; i <= 5; i++) {
            diceValues[i] = $(`#die${i} span`).text();
        }
        diceValues.sort();
        diceValues = diceValues.join("");
        return diceValues;
    }

    //Computes the sum of all dice values
    function getDiceSum() {
        let sum = 0;
        try {
            for (let i = 1; i <= 5; i++) {
                sum += parseInt($(`#die${i} span`).text());
            }
            return sum;
        } catch (e) {
            console.log("Error: " + e.message);
        }
    }

    function getUpperSectionValues() {
        if ($("#die1 span").text() == 0) {
            alert("Please roll the dice first.");
            return;
        }
        // "this" refers to the clicked cell in the upper section
        //If clicked cell is already populated, do not modify its value
        if ($(this).hasClass("disabled")) {
            return;
        } else if (previouslySelectedOption.length != 0) {
            //Clear the previously selected cell, and remove active styling
            previouslySelectedOption[0].text("");
            previouslySelectedOption[0].removeClass("disabled selected");
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
        for (let i = 1; i <= 5; i++) {
            if (parseInt($(`#die${i} span`).text()) == factor) sum += factor;
        }
        //Style the currently selected element to indicate that it is temporarily populated
        $(this).addClass("selected");
        $(this).text(sum);
        //Update currently selected cell reference
        previouslySelectedOption = [$(this)];
        //Indicate that a move can be played
        $("#playBtn").addClass("playAvailable");
    }

    function getLowerSectionValues() {
        if ($("#die1 span").text() == 0) {
            alert("Please roll the dice first.");
            return;
        }

        // "this" refers to the clicked cell in the lower section
        //If clicked cell is already populated, do not modify its value
        if ($(this).hasClass("disabled")) {
            alert("Clicked disabled cell"); //Possibly remove
            return;
        } else if (previouslySelectedOption.length != 0) {
            previouslySelectedOption[0].text("");
            previouslySelectedOption[0].removeClass("disabled selected");
        }

        const diceValues = getSortedDiceValues();

        //Determine the clicked cell condition and test whether the dice allow the move, if so update cell with score, otherwise insert 0
        switch ($(this).attr("id")) {
            case "threeOfKind":
                if (/(.)\1{2}/.test(diceValues)) $(this).text(getDiceSum());
                else $(this).text(0);
                break;
            case "fourOfKind":
                if (/(.)\1{3}/.test(diceValues)) $(this).text(getDiceSum());
                else $(this).text(0);
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
                if (/12345|23456/.test(diceValues)) $(this).text(40);
                else $(this).text(0);
                break;
            case "fiveOfKind":
                if (/(.)\1{4}/.test(diceValues)) $(this).text(50);
                else $(this).text(0);
                break;
            case "chance":
                $(this).text(getDiceSum());
                break;
            default:
                console.log("Error");
                break;
        }

        //Style the currently selected element to indicate that it is temporarily populated
        $(this).addClass("selected");
        //Update currently selected cell reference
        previouslySelectedOption = [$(this)];
        //Indicate that a move can be played
        $("#playBtn").addClass("playAvailable");
    }

    //Computes the total score from the upper section; in addition, checks if player receives the bonus
    function computeUpperTotal() {
        let upperCells = ["ones", "twos", "threes", "fours", "fives", "sixes"];
        let sum = 0;
        for (let i = 0; i < upperCells.length; i++) {
            //Checks for and skips empty cells, otherwise computes sum of cell values
            if ($("#" + upperCells[i]).text() == "" || $("#" + upperCells[i]).text() === null) continue;
            else sum += parseInt($("#" + upperCells[i]).text());
        }
        $("#upSub").text(sum);
        //Give upper bonus if sum >= 63
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
            if ($("#" + lowerCells[i]).text() == "") continue;
            else sum += parseInt($("#" + lowerCells[i]).text());
        }
        $("#lowerTotal").text(sum);
    }

    function computeTotals() {
        //If dice are not rolled or if an cell has not been selected, do not allow confirmation of move
        if ($("#die1 span").text() == 0) {
            alert("Please roll the dice first.");
            return;
        } else if (previouslySelectedOption.length === 0) {
            alert("Please select a cell to play.");
            return;
        }

        const diceValues = getSortedDiceValues();

        //Tests for fiveOfKindBonus condition
        if (/(.)\1{4}/.test(diceValues) && fiveOfKindFlag) {
            // If the user reached the max bonus of 300, do not add more
            if ($("#fiveOfKindBonus").text() < 300) {
                // Otherwise add 100 to the fiveOfKindBonus cell
                $("#fiveOfKindBonus").text(
                    ($("#fiveOfKindBonus").text() == "") ? 100 :
                        parseInt($("#fiveOfKindBonus").text()) + 100);
            }
        }

        //Compute total scores for each section and output to "grandTotal" cell
        computeUpperTotal();
        computeLowerTotal();
        const grandTotal = parseInt($("#lowerTotal").text()) + parseInt($(".upperTotal").first().text());
        $(".grandTotal").text(grandTotal);

        // If the user played five of a kind, set the flag to true
        if (previouslySelectedOption[0].attr("id") === "fiveOfKind" &&
            (/(.)\1{4}/.test(diceValues))) {
            fiveOfKindFlag = true;
        }

        previouslySelectedOption[0].addClass("disabled").removeClass("selected");
        previouslySelectedOption = [];

        completedCells++;
        resetDice();

        //Checks if player has completed all possible cells, and if so, shows the game over dialog (gameOverModal)
        // TODO: Adjust for multigame mode
        if (completedCells >= 13) {
            rollsAvailable = 0;
            $("#gameOverModal").css("display", "flex");
            //Disable all cells in the upper and lower sections
            $(".upperSectionCell.valueCell").addClass("disabled");
            $(".lowerSectionCell.valueCell").addClass("disabled");
            // Show game over message for when the player closes the game over/high scores modal without starting a new game
            $("header").after(
                `<div id="gameOverMessage">Congratulations, you scored ${grandTotal} points this game.
                <br/> 
                Play again and beat your high score! 
                <button class="resetBtn">Play Again</button></div>`
            );
            $("#diceControlsContainer").hide();
            $("#cellTable").removeClass("bottomMargin");
        }
    }

    // Update the high scores table in the modal
    function updateHighScores() {
        const highScores = JSON.parse(localStorage.getItem("highScores")) || [];
        const highScoresList = $("#highScoresTable");

        highScoresList.empty();

        if (highScores.length === 0) {
            highScoresList.prepend(
                `<tr><td colspan="4">
                    No high scores available yet! Play a game to add your score!
                </td></tr>`
            );
            return;
        }

        // Create the header row for the high scores table
        highScoresList.append(`
            <tr class="headerRow">
                <th>Rank</th>
                <th>Name</th>
                <th>Date</th>
                <th>Score</th>
                <th>Delete</th>
            </tr>
        `);

        highScores.sort((a, b) => b.score - a.score); // Sort by score descending

        highScores.forEach(score => {
            highScoresList.append(`
                <tr>
                    <td>${highScores.indexOf(score) + 1}</td>
                    <td>${score.name}</td>
                    <td>${score.date}</td>
                    <td>${score.score}</td>
                    <td><button class="deleteHighScoreBtn" data-id="${score.id}">X</button></td>
                </tr>
            `);
        });
    }

    // Delete a specific high score based on its ID
    function deleteHighScore(scoreId) {
        const highScores = JSON.parse(localStorage.getItem("highScores")) || [];
        const updatedHighScores = highScores.filter(score => score.id !== scoreId);
        localStorage.setItem("highScores", JSON.stringify(updatedHighScores));
        updateHighScores();
    }

    $("#page").on("click", ".resetBtn", reset);
    $("#toggleHowToScoreColumnBtn").on("click", toggleHowToScoreColumn);
    $(".die").on("click", toggleHold);
    $(".upperSectionCell").on("click", getUpperSectionValues);
    $(".lowerSectionCell").on("click", getLowerSectionValues);
    $("#rollBtn").on("click", rollDice);
    $("#playBtn").on("click", computeTotals);

    $(".modalCloseBtn").on("click", function() {
        $(this).parent().closest(".modal").hide();
    });

    $("#showHighScoresBtn").on("click", function() {
        // Hide the game over modal and show the high scores modal
        $("#gameOverModal").hide();
        updateHighScores();
        $("#highScoresModal").css("display", "flex");
    });

    $("#highScoreSaveBtn").on("click", function() {
        const name = $("#highScoreNameInput").val().trim();
        if (name.length > 0) {
            const grandTotal = parseInt($(".grandTotal").first().text());
            const highScores = JSON.parse(localStorage.getItem("highScores")) || [];
            // Limit the high scores to 10 entries
            if (highScores.length >= 10) {
                highScores.pop(); // Remove the lowest score
            }
            // Add the new score
            highScores.push({
                id: Date.now(),
                name,
                date: new Date().toLocaleString(),
                score: grandTotal
            });
            localStorage.setItem("highScores", JSON.stringify(highScores));
            $("#gameOverModal").hide();
            updateHighScores();
            $("#highScoresModal").css("display", "flex");
        } else {
            alert("Please enter a name.");
        }
    });

    $("#highScoresTable").on("click", ".deleteHighScoreBtn", function() {
        console.log("Delete button clicked");
        const scoreId = $(this).data("id");
        deleteHighScore(scoreId);
    });

    $("#deleteAllHighScoresBtn").on("click", function() {
        if (confirm("Are you sure you want to delete all high scores?")) {
            localStorage.removeItem("highScores");
            updateHighScores();
        }
    });

    $("#darkModeToggle").on("click", function() {
        $("body").attr("data-theme", $("body").attr("data-theme") === "dark" ? "light" : "dark");
        $("#darkModeToggle").text($("#darkModeToggle").text() === "☀️" ? "🌙" : "☀️");
        if (window.localStorage) {
            const currentTheme = $("body").attr("data-theme");
            localStorage.setItem("theme", currentTheme === "dark" ? "dark" : "light");
        }
    });

    if (window.localStorage) {
        // Check if the user has a saved theme preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            $("body").attr("data-theme", savedTheme);
            $("#darkModeToggle").text(savedTheme === "dark" ? "☀️" : "🌙");
        }

        // If they user hides the instructions, save that preference
        const instructionsHidden = localStorage.getItem("instructionsHidden");
        if (instructionsHidden === "true") {
            $("#instructionsBox").hide();
            // $("#cellTable").attr("data-instructions-hidden", "true");
        }
    }

    // On mobile/height-constrained screens, where the user hasn't hidden the
    // instructions, the dice controls shouldn't be fixed to the bottom of the screen
    // until the player scrolls past the instructions box.
    // Initially set the diceControlsContainer to static positioning
    $("#diceControlsContainer").css("position", "static");

    const observer = new IntersectionObserver((entries) => {
        // When instructionsBox is not intersecting (scrolled past)
        if (!entries[0].isIntersecting) {
            $("#diceControlsContainer").css("position", "fixed");
            $("#diceControlsContainer").css("bottom", "0");
        } else {
            // When instructionsBox is visible, revert to normal flow
            $("#diceControlsContainer").css("position", "static");
            $("#diceControlsContainer").css("bottom", "auto");
        }
    }, { threshold: 0 });

    observer.observe($("#instructionsBox")[0]);

    // Handle instructionsBox toggle
    function handleInstructionsToggle() {
        // Re-observe after toggle
        observer.unobserve($("#instructionsBox")[0]);
        observer.observe($("#instructionsBox")[0]);
        toggleInstructions();
    }

    $(".toggleInstructionsBtn").on("click", handleInstructionsToggle);
});
