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

module GameLogic {

    export function getInitialState(): IState {
        let blackX = 264;
        let blackY = 264;
        const BallRadius = 12;

        let CueBall: Ball = {
            Position: { X: blackX, Y: blackY + 400 },
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
            Position: { X: 48, Y: 50 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket1);

        let Pocket2: Pocket = {
            Position: { X: 40, Y: 481 },
            //Position: {X:48,Y:481},
            Radius: PocketRadius
        }
        Pockets.push(Pocket2);

        let Pocket3: Pocket = {
            Position: { X: 48, Y: 912 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket3);

        let Pocket4: Pocket = {
            Position: { X: 482, Y: 50 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket4);

        let Pocket5: Pocket = {
            Position: { X: 490, Y: 481 },
            //Position: {X:482,Y:481},
            Radius: PocketRadius
        }
        Pockets.push(Pocket5);

        let Pocket6: Pocket = {
            Position: { X: 482, Y: 912 },
            Radius: PocketRadius
        }
        Pockets.push(Pocket6);

        let PoolBoard: Board = {
            Height: 960,
            Width: 531,
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
     * This function takes the "stateAfterMove" and uses it to create a new State that is passed back to 
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
            endMatchScores: null,
            turnIndex: (currentTurnIndex + 1) % 2,
            state: angular.copy(currentState)
        }
        nextMove.state.FirstMove = false;
        nextMove.state.CanMoveCueBall = false;
        if (currentState.CueBall.Pocketed) {
            nextMove.state.CanMoveCueBall = true;
        }
        return nextMove;
    }
}