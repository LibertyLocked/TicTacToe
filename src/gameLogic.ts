// Game Logic for Pool Game

interface Point2D {
    X: number;
    Y: number;
}

enum AssignedBallType {
    Any,
    Stripes,
    Solids,
    Eight,
}

enum BallType {
    Cue,
    Stripes,
    Solids,
    Eight,
}

interface Pocket {
    readonly Position: Point2D;
    readonly Radius: number;
}

interface Board {
    readonly Height: number;
    readonly Width: number;
    readonly StartLine: number;
    readonly Pockets: Pocket[];

}

interface Ball {
    Position: Point2D;
    Pocketed: boolean;
    readonly Radius: number;
    readonly BallType: BallType;
    readonly Number: number;
}

interface ReturnState {
    PocketedBalls: Ball[];
    TouchedBall: Ball;
}

/**
 * To contain all information about the player
 */
interface Player {
    Assigned: AssignedBallType;       // which color is he assigned               
}

interface IState {
    SolidBalls: Ball[];
    StripedBalls: Ball[];
    EightBall: Ball;
    CueBall: Ball;
    CanMoveCueBall: boolean;
    PoolBoard: Board;

    FirstMove: boolean;

    Player1Color: AssignedBallType;
    Player2Color: AssignedBallType;

    DeltaBalls: ReturnState;
}

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

module GameLogic {

    export function getInitialState(): IState {
        //To change the size the board, simply change the coefficient, then all the size will change accordingly.
        let coefficient = 0.8;
        let blackX = 264 * coefficient;
        let blackY = 264 * coefficient;
        let BoardHeight = 960 * coefficient;
        let BoardWidth = 530 * coefficient;
        const BallRadius = 12;

        let CueBall: Ball = {
            Position: { X: blackX * coefficient, Y: blackY + 400 * coefficient },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Cue,
            Number: 0
        }
        //Create solid balls
        let solidBalls: Ball[] = [];
        let Ball1: Ball = {
            Position: { X: blackX - 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 1
        }
        solidBalls.push(Ball1);

        let Ball2: Ball = {
            Position: { X: blackX + 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 2
        }
        solidBalls.push(Ball2);

        let Ball3: Ball = {
            Position: { X: blackX - 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 3
        }
        solidBalls.push(Ball3);

        let Ball4: Ball = {
            Position: { X: blackX + BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 4
        }
        solidBalls.push(Ball4);

        let Ball5: Ball = {
            Position: { X: blackX + 2 * BallRadius, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 5
        }
        solidBalls.push(Ball5);

        let Ball6: Ball = {
            Position: { X: blackX - BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 6
        }
        solidBalls.push(Ball6);

        let Ball7: Ball = {
            Position: { X: blackX, Y: blackY + 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Solids,
            Number: 7
        }
        solidBalls.push(Ball7);

        let EightBall: Ball = {
            Position: { X: blackX, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Eight,
            Number: 8
        }

        let StripeBalls: Ball[] = [];

        let Ball9: Ball = {
            Position: { X: blackX - 4 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 9
        }
        StripeBalls.push(Ball9);

        let Ball10: Ball = {
            Position: { X: blackX, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 10
        }
        StripeBalls.push(Ball10);

        let Ball11: Ball = {
            Position: { X: blackX + 2 * BallRadius, Y: blackY - 2 * BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 11
        }
        StripeBalls.push(Ball11);

        let Ball12: Ball = {
            Position: { X: blackX - BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 12
        }
        StripeBalls.push(Ball12);

        let Ball13: Ball = {
            Position: { X: blackX + 3 * BallRadius, Y: blackY - BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 13
        }
        StripeBalls.push(Ball13);

        let Ball14: Ball = {
            Position: { X: blackX - 2 * BallRadius, Y: blackY },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 14
        }
        StripeBalls.push(Ball14);

        let Ball15: Ball = {
            Position: { X: blackX + BallRadius, Y: blackY + BallRadius * Math.sqrt(3) },
            Pocketed: false,
            Radius: BallRadius,
            BallType: BallType.Stripes,
            Number: 15
        }
        StripeBalls.push(Ball15);

        let PocketRadius = 1.5 * BallRadius;

        let Pockets: Pocket[] = [];

        let Pocket1: Pocket = {
            Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.05 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket1);
        //Change 0.08 to 0.07 to put it closer to edge.
        let Pocket2: Pocket = {
            Position: { X: BoardWidth * 0.06, Y: BoardHeight * 0.5 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket2);

        let Pocket3: Pocket = {
            Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.95 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket3);

        let Pocket4: Pocket = {
            Position: { X: BoardWidth * 0.92, Y: BoardHeight * 0.05 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket4);
        //Change 0.92 to 0.93 to put it closer to edge.
        let Pocket5: Pocket = {
            Position: { X: BoardWidth * 0.94, Y: BoardHeight * 0.5 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket5);

        let Pocket6: Pocket = {
            Position: { X: BoardWidth * 0.92, Y: BoardHeight * 0.95 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket6);

        let PoolBoard: Board = {
            Height: BoardHeight,
            Width: BoardWidth,
            StartLine: CueBall.Position.Y,
            Pockets: Pockets,
        }

        let CanMoveCueBall = true;
        let FirstMove = true;
        let Player1Color = AssignedBallType.Any;
        let Player2Color = AssignedBallType.Any;
        let DeltaBalls = null;

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
        }
    }

    /**
     * This function takes the "currentState" and uses it to create a new State that is passed back to 
     * the physics engine as an "IMove" object
     */

    function isBallContained(ballNum: number, balls: Ball[]): number {
        let i = 0;
        for (let ball of balls) {
            if (ball.Number == ballNum) {
                return i;
            }
            i++;
        }
        return -1;
    }

    export function createMove(currentState: IState, currentTurnIndex: number): IMove {

        let nextMove: IMove = {
            endMatchScores: null, // changed later
            turnIndex: currentTurnIndex, // changed later
            state: angular.copy(currentState)   // changed later
        };    // this will be returned as the next move
        nextMove.state.FirstMove = false;
        nextMove.state.CanMoveCueBall = false;    // discontinuing the use of CanMoveCueBall property if it was in use
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
        let pocketedBalls = currentState.DeltaBalls.PocketedBalls;
        let touchedFirst = currentState.DeltaBalls.TouchedBall;
        if (currentState.FirstMove) {                            // state right after the BREAK shot
            // 0)
            if (isBallContained(8, pocketedBalls) != -1) {
                nextMove.state = getInitialState();
                nextMove.state.CanMoveCueBall = true;   // TODO: add a flag to tell the game.ts that it is a fresh start and the cue-ball movement must be limited again
                nextMove.turnIndex = currentTurnIndex;  // giving the move back the the player who "broke the balls"
                return nextMove;
            }
            // 1) && 2)
            if ((isBallContained(0, pocketedBalls) != -1) || (touchedFirst == null)) {
                nextMove.state.CanMoveCueBall = true;
                nextMove.turnIndex = 1 - currentTurnIndex;
                return nextMove;
            }
            // 3)
            else if (pocketedBalls.length == 0) {
                nextMove.turnIndex = 1 - currentTurnIndex;
                return nextMove;
            }
            // 4)
            else if (pocketedBalls.length > 0) {
                nextMove.turnIndex = currentTurnIndex;
                return nextMove;
            }
            // Unexpected condition
            else {
                throw new TypeError("Unexpected condition during Break Shot");
            }
        }

        /** REGULAR SHOT
         * The following logic is ONLY for the move after the "break" move
         * 1) If BLACK ball is potted:       // WIN or LOSS situation
         *      a) if the assigned ball is BLACK and the CUE Ball is NOT potted, current player wins
         *      b) in ANY other condition the current player loses
         *      the following logic (a-f) was replaced by the above (a-b) logic
         *      a) if cue ball is also pocketed => this player loses
         *      b) if player has other assigned balls left or is not assigned ANY color => this player loses
         *      c) if there are any 'assigned color' balls pocketed after the BLACK in the pocketed queue => this player loses
         *      d) if touchedFirst != assignedcolor OR !=BLACK => this player loses
         *      e) if there are any balls potted after the BLACK => this player loses
         *      f) this player Wins
         * 
         * 2) If no ball touched => return "CanMoveCueBall" and change the turn
         * 3) If illegal ball touched (take care of ANY) => return "CanMoveCueBall" and change the turn
         * 4) If no ball potted => change the turn
         * 5) If Balls are potted:
         *      a) if cue ball potted => return "CanMoveCueBall" and change the turn
         *      b) if 'color not assigned' => assign the first ball potted, player keeps the turn
         *      c) if ONLY illegal balls potted => ONLY change the turn ELSE keep the turn *     
         * 6) If the player has pottedd all the his assigned balls, assign him the BallType 8 ; don't "RETURN"" though
         */
        else {
            //~~ storing the player's color and his assigned balls
            function getMyUsableColor(color: AssignedBallType): BallType {
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
            function getMyAssignableColor(col: BallType): AssignedBallType {
                if (col == BallType.Solids)
                    return AssignedBallType.Solids;
                else if (col == BallType.Stripes)
                    return AssignedBallType.Stripes;
                else if (col == BallType.Eight)
                    return AssignedBallType.Eight;
                return null;
            }
            //~~ checking if a particular colored ball is pocketed
            function isColorBallPocketed(usableColor: BallType, balls: Ball[]): boolean {
                for (let ball of balls) {
                    if (ball.BallType == myUsableColor)
                        return true;
                }
                return false;
            }
            var myColor: AssignedBallType;   // the player's color of type AssignedBallType
            var cueBallPotted: boolean = false;    // whether or not the cueBall was potted in this turn
            if (isBallContained(0, pocketedBalls) != -1)    // Storing whether the cue ball is potted or not in a boolean variable/flag
                cueBallPotted = true;
            if (currentTurnIndex == 0) {
                myColor = currentState.Player1Color;
            } else {
                myColor = currentState.Player2Color;
            }
            var myUsableColor = getMyUsableColor(myColor);// the player's color of type BallType
            var myBalls: Ball[] = [], yourBalls: Ball[] = [], myRemainingBalls: Ball[] = [];
            if (myColor != AssignedBallType.Any) {            // the concept of my_color and your_color has no meaning when the colors have not been assigned
                if (myColor == AssignedBallType.Solids) {
                    myBalls = currentState.SolidBalls;
                    yourBalls = currentState.StripedBalls;
                }
                else {
                    myBalls = currentState.StripedBalls;
                    yourBalls = currentState.SolidBalls;
                }
                for (let ball of myBalls) {
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
            if (blackIndex != -1) {   // black ball is potted --
                if (!cueBallPotted && myColor == AssignedBallType.Eight) {    // current player wins
                    if (currentTurnIndex == 0) {
                        nextMove.endMatchScores = [0, 1];
                        nextMove.turnIndex = -1;
                    }
                    else {
                        nextMove.endMatchScores = [1, 0];
                        nextMove.turnIndex = -1;
                    }
                }
                else {   // current player loses
                    if (currentTurnIndex == 0) {
                        nextMove.endMatchScores = [1, 0];
                        nextMove.turnIndex = -1;
                    }
                    else {
                        nextMove.endMatchScores = [0, 1];
                        nextMove.turnIndex = -1;
                    }
                }
                // // a)
                // if(isBallContained(0,pocketedBalls)!=-1){
                //     if(currentTurnIndex==0)
                //         nextMove.endMatchScores=[0,1];
                //     else
                //         nextMove.endMatchScores=[1,0];
                //     return nextMove;
                // }
                // // b)
                // else if(myColor == AssignedBallType.Any || myRemainingBalls.length!=0){
                //     if(currentTurnIndex==0)
                //         nextMove.endMatchScores=[0,1];
                //     else
                //         nextMove.endMatchScores=[1,0];
                //     return nextMove;
                // }
                // // c), e)
                // else if(blackIndex != pocketedBalls.length-1){
                //     if(currentTurnIndex==0)
                //         nextMove.endMatchScores=[0,1];
                //     else
                //         nextMove.endMatchScores=[1,0];
                //     return nextMove;
                // }
                // // d)
                // else if(!(touchedFirst.BallType==myUsableColor || touchedFirst.BallType==BallType.Eight)){
                //     if(currentTurnIndex==0)
                //         nextMove.endMatchScores=[0,1];
                //     else
                //         nextMove.endMatchScores=[1,0];
                //     return nextMove;
                // }
                // // f)
                // else if(pocketedBalls.length==1){
                //     if(currentTurnIndex==0)
                //         nextMove.endMatchScores=[1,0];
                //     else
                //         nextMove.endMatchScores=[0,1];
                //     return nextMove;
                // }
                // default unhandled condition wherer the current player loses
                // else{
                //     throw new TypeError("Unexpected condition during Winner determination");
                // }
            }
            else {       // BLACK BALL not pocketed yet
                //  2), 3)  // NO or ILLEGAL ball touched first
                if (touchedFirst == null || (myColor != AssignedBallType.Any && touchedFirst.BallType != myUsableColor)) {
                    nextMove.state.CanMoveCueBall = true;
                    nextMove.turnIndex = 1 - currentTurnIndex;
                    // return nextMove;
                }
                // 4) // Legal ball touched but none pocketed; simply change the turn..
                else if (pocketedBalls.length == 0) {
                    nextMove.turnIndex = 1 - currentTurnIndex;
                    // return nextMove;
                }
                // 5)
                else if (pocketedBalls.length > 0) {
                    // a)
                    if (cueBallPotted) {
                        nextMove.state.CanMoveCueBall = true;
                        nextMove.turnIndex = 1 - currentTurnIndex;
                        // return nextMove;
                    }
                    // b)
                    else if (myColor == AssignedBallType.Any) {
                        nextMove.turnIndex = currentTurnIndex;  // current player keeps the turn
                        //~~ Assigning the player his color
                        if (currentTurnIndex == 0)
                            nextMove.state.Player1Color = getMyAssignableColor(pocketedBalls[0].BallType);
                        else
                            nextMove.state.Player1Color = getMyAssignableColor(pocketedBalls[0].BallType);
                        // return nextMove;
                    }
                    // c)
                    else if (isColorBallPocketed(myUsableColor, pocketedBalls)) {
                        nextMove.turnIndex = currentTurnIndex;             // keep the turn
                        // return nextMove;
                    }
                    else if (!isColorBallPocketed(myUsableColor, pocketedBalls)) {
                        nextMove.state.CanMoveCueBall = true;
                        nextMove.turnIndex = 1 - currentTurnIndex;
                        // return nextMove;
                    }
                    // default unhandled condition
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
}