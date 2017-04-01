// Game Logic for Pool Game
var AssignedBallType;
(function (AssignedBallType) {
    AssignedBallType[AssignedBallType["Any"] = 0] = "Any";
    AssignedBallType[AssignedBallType["Stripes"] = 1] = "Stripes";
    AssignedBallType[AssignedBallType["Solids"] = 2] = "Solids";
    AssignedBallType[AssignedBallType["Eight"] = 3] = "Eight";
})(AssignedBallType || (AssignedBallType = {}));
var BallType;
(function (BallType) {
    BallType[BallType["Cue"] = 0] = "Cue";
    BallType[BallType["Stripes"] = 1] = "Stripes";
    BallType[BallType["Solids"] = 2] = "Solids";
    BallType[BallType["Eight"] = 3] = "Eight";
})(BallType || (BallType = {}));
// interface IMove {
//   endMatchScores: number[];
//   turnIndexAfterMove: number;
//   currentState: IState;
// }
// interface IMove {
//   // When the match ends: turnIndex is -1 and endMatchScores is an array of scores.
//   // When the match is ongoing: turnIndex is a valid index and endMatchScores to null.
//   endMatchScores: number[]; // either null or an array of length <numberOfPlayers>.
//   turnIndex: number;
//   // <state> is the state after making the move.
//   // IState type must be defined by the game.
//   // <state> can be any plain javscript object (POJO),
//   // i.e., anything that can be serialized to json
//   // (e.g., you can't have DOM elements, classes, or functions in IState).
//   // If your game has hidden state (e.g., in a game of poker, you can only see the cards in your hand),
//   // then you should hide the relevant info in the UI.
//   state: IState;
// }
var GameLogic;
(function (GameLogic) {
    function getInitialState() {
        //To change the size the board, simply change the coefficient, then all the size will change accordingly.
        var coefficient = 0.8;
        var blackX = 264 * coefficient;
        var blackY = 264 * coefficient;
        var BoardHeight = 960 * coefficient;
        var BoardWidth = 530 * coefficient;
        var BallRadius = 12;
        var CueBall = {
            Position: { X: blackX * coefficient, Y: blackY + 400 * coefficient },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Cue,
            Number: 0
        };
        //Create solid balls
        var solidBalls = [];
        var Ball1 = {
            Position: { X: blackX - 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 1
        };
        solidBalls.push(Ball1);
        var Ball2 = {
            Position: { X: blackX + 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 2
        };
        solidBalls.push(Ball2);
        var Ball3 = {
            Position: { X: blackX - 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 3
        };
        solidBalls.push(Ball3);
        var Ball4 = {
            Position: { X: blackX + BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 4
        };
        solidBalls.push(Ball4);
        var Ball5 = {
            Position: { X: blackX + 2 * BallRadius, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 5
        };
        solidBalls.push(Ball5);
        var Ball6 = {
            Position: { X: blackX - BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 6
        };
        solidBalls.push(Ball6);
        var Ball7 = {
            Position: { X: blackX, Y: blackY + 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 7
        };
        solidBalls.push(Ball7);
        var EightBall = {
            Position: { X: blackX, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Eight,
            Number: 8
        };
        var StripeBalls = [];
        var Ball9 = {
            Position: { X: blackX - 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 9
        };
        StripeBalls.push(Ball9);
        var Ball10 = {
            Position: { X: blackX, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 10
        };
        StripeBalls.push(Ball10);
        var Ball11 = {
            Position: { X: blackX + 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 11
        };
        StripeBalls.push(Ball11);
        var Ball12 = {
            Position: { X: blackX - BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 12
        };
        StripeBalls.push(Ball12);
        var Ball13 = {
            Position: { X: blackX + 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 13
        };
        StripeBalls.push(Ball13);
        var Ball14 = {
            Position: { X: blackX - 2 * BallRadius, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 14
        };
        StripeBalls.push(Ball14);
        var Ball15 = {
            Position: { X: blackX + BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 15
        };
        StripeBalls.push(Ball15);
        var PocketRadius = 1.5 * BallRadius;
        var Pockets = [];
        var Pocket1 = {
            Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.05 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket1);
        //Change 0.08 to 0.07 to put it closer to edge.
        var Pocket2 = {
            Position: { X: BoardWidth * 0.06, Y: BoardHeight * 0.5 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket2);
        var Pocket3 = {
            Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.95 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket3);
        var Pocket4 = {
            Position: { X: BoardWidth * 0.92, Y: BoardHeight * 0.05 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket4);
        //Change 0.92 to 0.93 to put it closer to edge.
        var Pocket5 = {
            Position: { X: BoardWidth * 0.94, Y: BoardHeight * 0.5 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket5);
        var Pocket6 = {
            Position: { X: BoardWidth * 0.92, Y: BoardHeight * 0.95 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket6);
        var PoolBoard = {
            Height: BoardHeight,
            Width: BoardWidth,
            StartLine: CueBall.Position.Y,
            Pockets: Pockets,
        };
        var CanMoveCueBall = true;
        var FirstMove = true;
        var Player1Color = AssignedBallType.Any;
        var Player2Color = AssignedBallType.Any;
        var DeltaBalls = null;
        return {
            SolidBalls: solidBalls,
            StripedBalls: StripeBalls,
            EightBall: EightBall,
            CueBall: CueBall,
            CanMoveCueBall: CanMoveCueBall,
            PoolBoard: PoolBoard,
            FirstMove: FirstMove,
            Player1Color: Player1Color,
            Player2Color: Player2Color,
            DeltaBalls: null
        };
    }
    GameLogic.getInitialState = getInitialState;
    /**
     * This function takes the "currentState" and uses it to create a new State that is passed back to
     * the physics engine as an "IMove" object
     */
    function isBallContained(ballNum, balls) {
        var i = 0;
        for (var _i = 0, balls_1 = balls; _i < balls_1.length; _i++) {
            var ball = balls_1[_i];
            if (ball.Number == ballNum) {
                return i;
            }
            i++;
        }
        return -1;
    }
    function createMove(currentState, currentTurnIndex) {
        var nextMove = {
            endMatchScores: null,
            turnIndex: currentTurnIndex,
            state: angular.copy(currentState) // changed later
        }; // this will be returned as the next move
        nextMove.state.FirstMove = false;
        nextMove.state.CanMoveCueBall = false; // discontinuing the use of CanMoveCueBall property if it was in use
        /** FIRST SHOT AFTER MOVE ~ after the break shot
         * The following logic is ONLY for the move right after the "break" move
         * 0) Check if the BLACK ball is potted => call the state from getInitialState and keep the turn and return
         *      ELSE
         *          nextMove.state will copy ALL contents from the currentState
         *          FirstMove=false AND:
         * 1) Check if the cue ball is potted => return "CanMoveCueBall" and change the turn
         * 2) Check if no balls are touched => return "CanMoveCueBall" and change the turn
         * 3) Check if no balls are potted => change the turn
         * 4) Check if balls are potted => keep the turn
         */
        var pocketedBalls = currentState.DeltaBalls.PocketedBalls;
        var touchedFirst = currentState.DeltaBalls.TouchedBall;
        if (currentState.FirstMove) {
            // 0)
            if (isBallContained(8, pocketedBalls) != -1) {
                nextMove.state = getInitialState();
                nextMove.state.CanMoveCueBall = true; // TODO: add a flag to tell the game.ts that it is a fresh start and the cue-ball movement must be limited again
                nextMove.turnIndex = currentTurnIndex; // giving the move back the the player who "broke the balls"
                return nextMove;
            }
            // 1) && 2)
            if ((isBallContained(0, pocketedBalls) != -1) || (touchedFirst == null)) {
                nextMove.state.CanMoveCueBall = true;
                nextMove.turnIndex = 1 - currentTurnIndex;
                return nextMove;
            }
            else if (pocketedBalls.length == 0) {
                nextMove.turnIndex = 1 - currentTurnIndex;
                return nextMove;
            }
            else if (pocketedBalls.length > 0) {
                nextMove.turnIndex = currentTurnIndex;
                return nextMove;
            }
            else {
                throw new TypeError("Unexpected condition during Break Shot");
            }
        }
        else {
            //~~ storing the player's color and his assigned balls
            function getMyUsableColor(color) {
                if (color == AssignedBallType.Any)
                    return null;
                else if (color == AssignedBallType.Solids)
                    return BallType.Solids;
                else if (color == AssignedBallType.Stripes)
                    return BallType.Stripes;
                else if (color == AssignedBallType.Eight)
                    return BallType.Eight;
                return null;
            }
            //~~ Reverse of the above function
            function getMyAssignableColor(col) {
                if (col == BallType.Solids)
                    return AssignedBallType.Solids;
                else if (col == BallType.Stripes)
                    return AssignedBallType.Stripes;
                else if (col == BallType.Eight)
                    return AssignedBallType.Eight;
                return null;
            }
            //~~ checking if a particular colored ball is pocketed
            function isColorBallPocketed(usableColor, balls) {
                for (var _i = 0, balls_2 = balls; _i < balls_2.length; _i++) {
                    var ball = balls_2[_i];
                    if (ball.BallType == myUsableColor)
                        return true;
                }
                return false;
            }
            var myColor; // the player's color of type AssignedBallType
            var cueBallPotted = false; // whether or not the cueBall was potted in this turn
            if (isBallContained(0, pocketedBalls) != -1)
                cueBallPotted = true;
            if (currentTurnIndex == 0) {
                myColor = currentState.Player1Color;
            }
            else {
                myColor = currentState.Player2Color;
            }
            var myUsableColor = getMyUsableColor(myColor); // the player's color of type BallType
            var myBalls = [], yourBalls = [], myRemainingBalls = [];
            if (myColor != AssignedBallType.Any) {
                if (myColor == AssignedBallType.Solids) {
                    myBalls = currentState.SolidBalls;
                    yourBalls = currentState.StripedBalls;
                }
                else {
                    myBalls = currentState.StripedBalls;
                    yourBalls = currentState.SolidBalls;
                }
                for (var _i = 0, myBalls_1 = myBalls; _i < myBalls_1.length; _i++) {
                    var ball = myBalls_1[_i];
                    if (!ball.Pocketed)
                        myRemainingBalls.push(ball);
                }
            }
            // //  6)
            // if(myRemainingBalls.length==0){
            //     if(currentTurnIndex==0)
            //         nextMove.state.Player1Color=AssignedBallType.Eight;
            //     else
            //         nextMove.state.Player2Color=AssignedBallType.Eight;
            // }
            //  1)
            var blackIndex = isBallContained(8, pocketedBalls);
            if (blackIndex != -1) {
                if (!cueBallPotted && myColor == AssignedBallType.Eight) {
                    if (currentTurnIndex == 0) {
                        nextMove.endMatchScores = [0, 1];
                        nextMove.turnIndex = -1;
                    }
                    else {
                        nextMove.endMatchScores = [1, 0];
                        nextMove.turnIndex = -1;
                    }
                }
                else {
                    if (currentTurnIndex == 0) {
                        nextMove.endMatchScores = [1, 0];
                        nextMove.turnIndex = -1;
                    }
                    else {
                        nextMove.endMatchScores = [0, 1];
                        nextMove.turnIndex = -1;
                    }
                }
            }
            else {
                //  2), 3)  // NO or ILLEGAL ball touched first
                if (touchedFirst == null || (myColor != AssignedBallType.Any && touchedFirst.BallType != myUsableColor)) {
                    nextMove.state.CanMoveCueBall = true;
                    nextMove.turnIndex = 1 - currentTurnIndex;
                }
                else if (pocketedBalls.length == 0) {
                    nextMove.turnIndex = 1 - currentTurnIndex;
                }
                else if (pocketedBalls.length > 0) {
                    // a)
                    if (cueBallPotted) {
                        nextMove.state.CanMoveCueBall = true;
                        nextMove.turnIndex = 1 - currentTurnIndex;
                    }
                    else if (myColor == AssignedBallType.Any) {
                        nextMove.turnIndex = currentTurnIndex; // current player keeps the turn
                        //~~ Assigning the player his color
                        if (currentTurnIndex == 0)
                            nextMove.state.Player1Color = getMyAssignableColor(pocketedBalls[0].BallType);
                        else
                            nextMove.state.Player1Color = getMyAssignableColor(pocketedBalls[0].BallType);
                    }
                    else if (isColorBallPocketed(myUsableColor, pocketedBalls)) {
                        nextMove.turnIndex = currentTurnIndex; // keep the turn
                    }
                    else if (!isColorBallPocketed(myUsableColor, pocketedBalls)) {
                        nextMove.state.CanMoveCueBall = true;
                        nextMove.turnIndex = 1 - currentTurnIndex;
                    }
                    else {
                        throw new TypeError("Unexpected condition during next turn assignment");
                    }
                }
            }
            //  6)
            if (myRemainingBalls.length == 0) {
                if (currentTurnIndex == 0)
                    nextMove.state.Player1Color = AssignedBallType.Eight;
                else
                    nextMove.state.Player2Color = AssignedBallType.Eight;
            }
        }
        return nextMove;
    }
    GameLogic.createMove = createMove;
})(GameLogic || (GameLogic = {}));
//# sourceMappingURL=gameLogic.js.map