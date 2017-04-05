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

  function initBall(Number: number): Ball {
    let coefficient = 0.8;
    let blackX = 264 * coefficient;
    let blackY = 264 * coefficient;
    const BallRadius = 12;

    let ball: Ball;
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

  export function getInitialState(): IState {
    //To change the size the board, simply change the coefficient, then all the size will change accordingly.
    let coefficient = 0.8;
    let BoardHeight = 960 * coefficient;
    let BoardWidth = 530 * coefficient;
    const BallRadius = 12;

    // cue ball
    let cueBall: Ball = initBall(0);

    // Create solid balls
    let solidBalls: Ball[] = [];
    for (let i = 1; i <= 7; i++) {
      solidBalls.push(initBall(i));
    }

    // eight ball
    let eightBall: Ball = initBall(8);

    // Create striped balls
    let stripedBalls: Ball[] = [];
    for (let i = 9; i <= 15; i++) {
      stripedBalls.push(initBall(i));
    }

    let PocketRadius = 1.4 * BallRadius;

    let Pockets: Pocket[] = [];

    let Pocket1: Pocket = {
      Position: { X: BoardWidth * 0.08, Y: BoardHeight * 0.05 },
      Radius: PocketRadius
    }
    Pockets.push(Pocket1);
    //Change 0.08 to 0.06 to put it closer to edge.
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
    //Change 0.92 to 0.94 to put it closer to edge.
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
      StartLine: cueBall.Position.Y,
      Pockets: Pockets,
    }

    let CanMoveCueBall = true;
    let FirstMove = true;
    let Player1Color = AssignedBallType.Any;
    let Player2Color = AssignedBallType.Any;
    let DeltaBalls: ReturnState = {
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
    }
  }

  function theOpponentsTurnIndex(currentTurnIndex: number): number {
    return 1 - currentTurnIndex;
  }

  function getBallIndex(ballNum: number, balls: Ball[]): number {
    let i = 0;
    for (let ball of balls) {
      if (ball.Number == ballNum) {
        return i;
      }
      i++;
    }
    return -1;
  }

  function isBallContained(ballNumber: number, balls: Ball[]): boolean {
    let contained: boolean = false;
    if (getBallIndex(ballNumber, balls) != -1) {
      contained = true;
    }
    return contained;
  }

  function toAssignedBallType(color: BallType): AssignedBallType {
    let abt: AssignedBallType = null;
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

  function switchAssignedBallType(color: AssignedBallType): AssignedBallType {
    let abt: AssignedBallType = AssignedBallType.Any;
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

  function breakShot(nextMove: IMove, pocketedBalls: Ball[], firstTouchedBall: Ball, currentTurnIndex: number): void {
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

  function toBallType(color: AssignedBallType): BallType {
    let bt: BallType = null;
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

  function regularShot(nextMove: IMove, currentState: IState, currentTurnIndex: number,
    pocketedBalls: Ball[], firstTouchedBall: Ball): void {
    let currentPlayerColor = currentTurnIndex
      ? currentState.Player2Color
      : currentState.Player1Color;
    if (pocketedBalls.length == 0) { // none pocketed
      nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
      if (firstTouchedBall == null  // no ball touched
        || (currentPlayerColor != AssignedBallType.Any // illegal ball touched first
          && firstTouchedBall.BallType != toBallType(currentPlayerColor))) {
        nextMove.state.CanMoveCueBall = true;
      }
    }
    else { // some balls pocketed
      if (isBallContained(0, pocketedBalls)) { // the cue ball pocketed
        if (isBallContained(8, pocketedBalls)) { // if the 8 ball pocketed
          nextMove.turnIndex = -1;
          if (currentTurnIndex == 0) {
            nextMove.endMatchScores = [0, 1];
          }
          else {
            nextMove.endMatchScores = [1, 0];
          }
        }
        else { // if the 8 ball not pocketed
          if (currentPlayerColor == AssignedBallType.Any && pocketedBalls.length > 1) {
            let firstPocketedColoredBallType: BallType;
            let isSolidNotStriped: boolean;
            if (pocketedBalls[0].BallType == BallType.Cue) { // the second ball is colored ball
              firstPocketedColoredBallType = pocketedBalls[1].BallType;
            }
            else { // the first ball is colored ball
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
            } else {
              nextMove.state.Player1Color = AssignedBallType.Stripes;
              nextMove.state.Player2Color = AssignedBallType.Solids;
            }
          }

          nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
          nextMove.state.CanMoveCueBall = true;
        }
      }
      else { // the cue ball not pocketed
        // if the cue ball knocked out of the table
        if (currentState.CueBall.Position.X < 0
          || currentState.CueBall.Position.X > currentState.PoolBoard.Width
          || currentState.CueBall.Position.Y < 0
          || currentState.CueBall.Position.Y > currentState.PoolBoard.Height) {
          nextMove.state.CanMoveCueBall = true;
          nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
        }
        if (isBallContained(8, pocketedBalls)) { // Eight ball pocketed
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
        else { // Eight ball not pocketed
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
          else if (currentPlayerColor != AssignedBallType.Eight) { // not Any not Eight
            let pocketedSolidsCount: number = 0;
            let pocketedStripesCount: number = 0;
            for (let ball of currentState.SolidBalls) {
              if (ball.Pocketed) {
                pocketedSolidsCount++;
              }
            }
            for (let ball of currentState.StripedBalls) {
              if (ball.Pocketed) {
                pocketedStripesCount++;
              }
            }
            if (pocketedSolidsCount == 7) {
              if (currentState.Player1Color == AssignedBallType.Solids) { // player 1
                nextMove.state.Player1Color = AssignedBallType.Eight;
              } else if (currentState.Player2Color == AssignedBallType.Solids) { // player 2
                nextMove.state.Player2Color = AssignedBallType.Eight;
              }
            }
            if (pocketedStripesCount == 7) {
              if (currentState.Player1Color == AssignedBallType.Stripes) { // player 1
                nextMove.state.Player1Color = AssignedBallType.Eight;
              } else if (currentState.Player2Color == AssignedBallType.Stripes) { // player 2
                nextMove.state.Player2Color = AssignedBallType.Eight;
              }
            }
            if (toBallType(currentPlayerColor) != firstTouchedBall.BallType) {
              nextMove.state.CanMoveCueBall = true;
              nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
            } else {
              nextMove.turnIndex = currentTurnIndex;// no foul
            }
          }
          else { // currentPlayerColor is Eight.
            nextMove.state.CanMoveCueBall = true;
            nextMove.turnIndex = theOpponentsTurnIndex(currentTurnIndex);
          }
        }
      }
    }
  }

  export function createMove(currentState: IState, currentTurnIndex: number): IMove {
    let nextMove: IMove = {
      endMatchScores: null, // changed later
      turnIndex: currentTurnIndex, // changed later
      state: angular.copy(currentState)   // changed later
    };
    nextMove.state.FirstMove = false;
    nextMove.state.CanMoveCueBall = false;

    let pocketedBalls: Ball[] = currentState.DeltaBalls.PocketedBalls;
    let firstTouchedBall: Ball = currentState.DeltaBalls.TouchedBall;

    if (currentState.FirstMove) {
      breakShot(nextMove, pocketedBalls, firstTouchedBall, currentTurnIndex);
    }
    else {
      regularShot(nextMove, currentState, currentTurnIndex, pocketedBalls, firstTouchedBall);
    }

    return nextMove;
  }
}
