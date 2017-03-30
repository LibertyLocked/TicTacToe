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
var GameLogic;
(function (GameLogic) {
    function getInitialState() {
        var blackX = 264;
        var blackY = 264;
        var BallRadius = 12;
        var CueBall = {
            Position: { X: blackX, Y: blackY + 400 },
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
            Position: { X: 48, Y: 50 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket1);
        var Pocket2 = {
            Position: { X: 40, Y: 481 },
            //Position: {X:48,Y:481},
            Radius: PocketRadius
        };
        Pockets.push(Pocket2);
        var Pocket3 = {
            Position: { X: 48, Y: 912 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket3);
        var Pocket4 = {
            Position: { X: 482, Y: 50 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket4);
        var Pocket5 = {
            Position: { X: 490, Y: 481 },
            //Position: {X:482,Y:481},
            Radius: PocketRadius
        };
        Pockets.push(Pocket5);
        var Pocket6 = {
            Position: { X: 482, Y: 912 },
            Radius: PocketRadius
        };
        Pockets.push(Pocket6);
        var PoolBoard = {
            Height: 960,
            Width: 531,
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
     * This function takes the "stateAfterMove" and uses it to create a new State that is passed back to
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
            turnIndex: (currentTurnIndex + 1) % 2,
            state: angular.copy(currentState)
        };
        nextMove.state.FirstMove = false;
        nextMove.state.CanMoveCueBall = false;
        if (currentState.CueBall.Pocketed) {
            nextMove.state.CanMoveCueBall = true;
        }
        return nextMove;
    }
    GameLogic.createMove = createMove;
})(GameLogic || (GameLogic = {}));
//# sourceMappingURL=gameLogic.js.map