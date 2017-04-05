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
    function initBall(Number) {
        var coefficient = 0.8;
        var blackX = 264 * coefficient;
        var blackY = 264 * coefficient;
        var BallRadius = 12;
        var ball;
        switch (Number) {
            case 0:
                ball = {
                    Position: { X: blackX * coefficient, Y: blackY + 400 * coefficient },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Cue,
                    Number: 0
                };
                break;
            case 1:
                ball = {
                    Position: { X: blackX - 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 1
                };
                break;
            case 2:
                ball = {
                    Position: { X: blackX + 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 2
                };
                break;
            case 3:
                ball = {
                    Position: { X: blackX - 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 3
                };
                break;
            case 4:
                ball = {
                    Position: { X: blackX + BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 4
                };
                break;
            case 5:
                ball = {
                    Position: { X: blackX + 2 * BallRadius, Y: blackY },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 5
                };
                break;
            case 6:
                ball = {
                    Position: { X: blackX - BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 6
                };
                break;
            case 7:
                ball = {
                    Position: { X: blackX, Y: blackY + 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Solids,
                    Number: 7
                };
                break;
            case 8:
                ball = {
                    Position: { X: blackX, Y: blackY },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Eight,
                    Number: 8
                };
                break;
            case 9:
                ball = {
                    Position: { X: blackX - 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 9
                };
                break;
            case 10:
                ball = {
                    Position: { X: blackX, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 10
                };
                break;
            case 11:
                ball = {
                    Position: { X: blackX + 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 11
                };
                break;
            case 12:
                ball = {
                    Position: { X: blackX - BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 12
                };
                break;
            case 13:
                ball = {
                    Position: { X: blackX + 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 13
                };
                break;
            case 14:
                ball = {
                    Position: { X: blackX - 2 * BallRadius, Y: blackY },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 14
                };
                break;
            case 15:
                ball = {
                    Position: { X: blackX + BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
                    Pocketed: false,
                    Radius: BallRadius,
                    BallType: BallType.Stripes,
                    Number: 15
                };
                break;
            default: ;
        }
        return ball;
    }
    function getInitialState() {
        //To change the size the board, simply change the coefficient, then all the size will change accordingly.
        var coefficient = 0.8;
        var BoardHeight = 960 * coefficient;
        var BoardWidth = 530 * coefficient;
        var BallRadius = 12;
        // cue ball
        var cueBall = initBall(0);
        // Create solid balls
        var solidBalls = [];
        for (var i = 1; i <= 7; i++) {
            solidBalls.push(initBall(i));
        }
        // eight ball
        var eightBall = initBall(8);
        // Create striped balls
        var stripedBalls = [];
        for (var i = 9; i <= 15; i++) {
            stripedBalls.push(initBall(i));
        }
        var PocketRadius = 1.4 * BallRadius;
        var Pockets = [];
        var Pocket1 = {
            Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.05 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket1);
        //Change 0.08 to 0.06 to put it closer to edge.
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
        //Change 0.92 to 0.94 to put it closer to edge.
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
            StartLine: cueBall.Position.Y,
            Pockets: Pockets,
        };
        var CanMoveCueBall = true;
        var FirstMove = true;
        var Player1Color = AssignedBallType.Any;
        var Player2Color = AssignedBallType.Any;
        var DeltaBalls = {
            PocketedBalls: [],
            TouchedBall: null,
        };
        return {
            SolidBalls: solidBalls,
            StripedBalls: stripedBalls,
            EightBall: eightBall,
            CueBall: cueBall,
            CanMoveCueBall: CanMoveCueBall,
            PoolBoard: PoolBoard,
            FirstMove: FirstMove,
            Player1Color: Player1Color,
            Player2Color: Player2Color,
            DeltaBalls: null
        };
    }
    GameLogic.getInitialState = getInitialState;
    function theOpponentsTurnIndex(currentTurnIndex) {
        return 1 - currentTurnIndex;
    }
    function getBallIndex(ballNum, balls) {
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
    function isBallContained(ballNumber, balls) {
        var contained = false;
        if (getBallIndex(ballNumber, balls) != -1) {
            contained = true;
        }
        return contained;
    }
    function toAssignedBallType(color) {
        var abt = null;
        switch (color) {
            case BallType.Eight:
                abt = AssignedBallType.Eight;
                break;
            case BallType.Solids:
                abt = AssignedBallType.Solids;
                break;
            case BallType.Stripes:
                abt = AssignedBallType.Stripes;
                break;
            default: ;
        }
        return abt;
    }
    function switchAssignedBallType(color) {
        var abt = AssignedBallType.Any;
        switch (color) {
            case AssignedBallType.Solids:
                abt = AssignedBallType.Stripes;
                break;
            case AssignedBallType.Stripes:
                abt = AssignedBallType.Solids;
                break;
            default: ;
        }
        return abt;
    }
    function breakShot(nextMove, pocketedBalls, firstTouchedBall, currentTurnIndex) {
        if (isBallContained(8, pocketedBalls)) {
            nextMove.turnIndex = currentTurnIndex;
            nextMove.state = getInitialState();
            nextMove.state.CanMoveCueBall = true;
        }
        if (isBallContained(0, pocketedBalls) || firstTouchedBall == null) {
            nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
            nextMove.state.CanMoveCueBall = true;
        }
        else if (pocketedBalls.length == 0) {
            nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
        }
        else if (pocketedBalls.length > 0) {
            nextMove.turnIndex = currentTurnIndex;
        }
        else {
            throw new TypeError("Unexpected condition during Break Shot");
        }
    }
    function toBallType(color) {
        var bt = null;
        switch (color) {
            case AssignedBallType.Eight:
                bt = BallType.Eight;
                break;
            case AssignedBallType.Solids:
                bt = BallType.Solids;
                break;
            case AssignedBallType.Stripes:
                bt = BallType.Stripes;
                break;
            default: ;
        }
        return bt;
    }
    function regularShot(nextMove, currentState, currentTurnIndex, pocketedBalls, firstTouchedBall) {
        var currentPlayerColor = currentTurnIndex
            ? currentState.Player2Color
            : currentState.Player1Color;
        if (pocketedBalls.length == 0) {
            nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
            if (firstTouchedBall == null // no ball touched
                || (currentPlayerColor != AssignedBallType.Any // illegal ball touched first
                    && firstTouchedBall.BallType != toBallType(currentPlayerColor))) {
                nextMove.state.CanMoveCueBall = true;
            }
        }
        else {
            if (isBallContained(0, pocketedBalls)) {
                if (isBallContained(8, pocketedBalls)) {
                    nextMove.turnIndex = -1;
                    if (currentTurnIndex == 0) {
                        nextMove.endMatchScores = [0, 1];
                    }
                    else {
                        nextMove.endMatchScores = [1, 0];
                    }
                }
                else {
                    if (currentPlayerColor == AssignedBallType.Any && pocketedBalls.length > 1) {
                        var firstPocketedColoredBallType = void 0;
                        var isSolidNotStriped = void 0;
                        if (pocketedBalls[0].BallType == BallType.Cue) {
                            firstPocketedColoredBallType = pocketedBalls[1].BallType;
                        }
                        else {
                            firstPocketedColoredBallType = pocketedBalls[0].BallType;
                        }
                        if (firstPocketedColoredBallType == BallType.Solids) {
                            isSolidNotStriped = true;
                        }
                        else {
                            isSolidNotStriped = false;
                        }
                        if (isSolidNotStriped && currentTurnIndex == 0
                            || (!isSolidNotStriped && currentTurnIndex == 1)) {
                            nextMove.state.Player1Color = AssignedBallType.Solids;
                            nextMove.state.Player2Color = AssignedBallType.Stripes;
                        }
                        else {
                            nextMove.state.Player1Color = AssignedBallType.Stripes;
                            nextMove.state.Player2Color = AssignedBallType.Solids;
                        }
                    }
                    nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
                    nextMove.state.CanMoveCueBall = true;
                }
            }
            else {
                // if the cue ball knocked out of the table
                if (currentState.CueBall.Position.X < 0
                    || currentState.CueBall.Position.X > currentState.PoolBoard.Width
                    || currentState.CueBall.Position.Y < 0
                    || currentState.CueBall.Position.Y > currentState.PoolBoard.Height) {
                    nextMove.state.CanMoveCueBall = true;
                    nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
                }
                if (isBallContained(8, pocketedBalls)) {
                    nextMove.turnIndex = -1;
                    if (currentTurnIndex == 0) {
                        if (currentPlayerColor == AssignedBallType.Eight) {
                            nextMove.endMatchScores = [1, 0];
                        }
                        else {
                            nextMove.endMatchScores = [0, 1];
                        }
                    }
                    else {
                        if (currentPlayerColor == AssignedBallType.Eight) {
                            nextMove.endMatchScores = [0, 1];
                        }
                        else {
                            nextMove.endMatchScores = [1, 0];
                        }
                    }
                }
                else {
                    if (currentPlayerColor == AssignedBallType.Any) {
                        nextMove.turnIndex = currentTurnIndex;
                        switch (currentTurnIndex) {
                            case 0:
                                nextMove.state.Player1Color =
                                    toAssignedBallType(pocketedBalls[0].BallType);
                                nextMove.state.Player2Color =
                                    switchAssignedBallType(toAssignedBallType(pocketedBalls[0].BallType));
                                break;
                            case 1:
                                nextMove.state.Player1Color =
                                    switchAssignedBallType(toAssignedBallType(pocketedBalls[0].BallType));
                                nextMove.state.Player2Color =
                                    toAssignedBallType(pocketedBalls[0].BallType);
                                break;
                            default: ;
                        }
                    }
                    else if (currentPlayerColor != AssignedBallType.Eight) {
                        var pocketedSolidsCount = 0;
                        var pocketedStripesCount = 0;
                        for (var _i = 0, _a = currentState.SolidBalls; _i < _a.length; _i++) {
                            var ball = _a[_i];
                            if (ball.Pocketed) {
                                pocketedSolidsCount++;
                            }
                        }
                        for (var _b = 0, _c = currentState.StripedBalls; _b < _c.length; _b++) {
                            var ball = _c[_b];
                            if (ball.Pocketed) {
                                pocketedStripesCount++;
                            }
                        }
                        if (pocketedSolidsCount == 7) {
                            if (currentState.Player1Color == AssignedBallType.Solids) {
                                nextMove.state.Player1Color = AssignedBallType.Eight;
                            }
                            else if (currentState.Player2Color == AssignedBallType.Solids) {
                                nextMove.state.Player2Color = AssignedBallType.Eight;
                            }
                        }
                        if (pocketedStripesCount == 7) {
                            if (currentState.Player1Color == AssignedBallType.Stripes) {
                                nextMove.state.Player1Color = AssignedBallType.Eight;
                            }
                            else if (currentState.Player2Color == AssignedBallType.Stripes) {
                                nextMove.state.Player2Color = AssignedBallType.Eight;
                            }
                        }
                        if (toBallType(currentPlayerColor) != firstTouchedBall.BallType) {
                            nextMove.state.CanMoveCueBall = true;
                            nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
                        }
                        else {
                            nextMove.turnIndex = currentTurnIndex; // no foul
                        }
                    }
                    else {
                        nextMove.state.CanMoveCueBall = true;
                        nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
                    }
                }
            }
        }
    }
    function createMove(currentState, currentTurnIndex) {
        var nextMove = {
            endMatchScores: null,
            turnIndex: currentTurnIndex,
            state: angular.copy(currentState) // changed later
        };
        nextMove.state.FirstMove = false;
        nextMove.state.CanMoveCueBall = false;
        var pocketedBalls = currentState.DeltaBalls.PocketedBalls;
        var firstTouchedBall = currentState.DeltaBalls.TouchedBall;
        if (currentState.FirstMove) {
            breakShot(nextMove, pocketedBalls, firstTouchedBall, currentTurnIndex);
        }
        else {
            regularShot(nextMove, currentState, currentTurnIndex, pocketedBalls, firstTouchedBall);
        }
        return nextMove;
    }
    GameLogic.createMove = createMove;
})(GameLogic || (GameLogic = {}));
//# sourceMappingURL=gameLogic.js.map