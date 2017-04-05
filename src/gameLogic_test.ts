describe("In pool createMove", function () {

  function getBallTypeFromNumber(ballNum: number): BallType {
    if (ballNum === 0) return BallType.Cue;
    else if (ballNum == 8) return BallType.Eight;
    else if (ballNum > 8) return BallType.Stripes;
    else return BallType.Solids;
  }

  function getBallFromNumber(state: IState, ballNum: number): Ball {
    let theBall: Ball;
    let color = getBallTypeFromNumber(ballNum);
    if (color == BallType.Cue) theBall = state.CueBall;
    else if (color == BallType.Solids) theBall = state.SolidBalls[ballNum - 1];
    else if (color == BallType.Stripes) theBall = state.StripedBalls[ballNum - 9];
    else theBall = state.EightBall;
    return theBall;
  }

  // sets the delta state and updates the balls in the state
  function setDeltaState(state: IState, touchedNum: number, ...pottedNum: number[]) {
    let firstTouchedBall = touchedNum ? getBallFromNumber(state, touchedNum) : null;
    let pocketedBalls: Ball[] = [];
    for (let num of pottedNum) {
      let theBall = getBallFromNumber(state, num);
      theBall.Pocketed = true;
      pocketedBalls.push(theBall);
    }
    // set the delta state
    state.DeltaBalls = {
      TouchedBall: firstTouchedBall,
      PocketedBalls: pocketedBalls,
    };
  }

  // sets the balls to be potted, but does not set the delta state
  function setBallsPotted(state: IState, ...pottedNum: number[]) {
    for (let num of pottedNum) {
      let theBall = getBallFromNumber(state, num);
      getBallFromNumber(state, num).Pocketed = true;
    }
  }

  it("on break: no ball hit. foul", function () {
    let state = GameLogic.getInitialState();
    setDeltaState(state, null);
    let nextMove = GameLogic.createMove(state, 0);
    // game should switch turn
    expect(nextMove.turnIndex).toBe(1);
    // it's a scratch - the other player gets to move the ball
    expect(nextMove.state.CanMoveCueBall).toBe(true);
  });

  it("on break: sinking eight causes a re-rack", function () {
    let state: IState = GameLogic.getInitialState();
    setDeltaState(state, 8, 8);
    let nextMove = GameLogic.createMove(state, 0);
    // game should not switch turn
    expect(nextMove.turnIndex).toBe(0);
    // the state should be re-initialized
    expect(angular.equals(nextMove.state, GameLogic.getInitialState())).toBe(true);
  });

  it("potting 8 and cue at the same time, touching 8 first. player should lose", function () {
    let state = GameLogic.getInitialState();
    state.FirstMove = false;
    state.CanMoveCueBall = false;
    state.Player1Color = AssignedBallType.Solids;
    state.Player2Color = AssignedBallType.Stripes;
    setBallsPotted(state, 1, 2, 3, 9, 10);
    setDeltaState(state, 8, 8, 0);
    let nextMove = GameLogic.createMove(state, 0);
    // game should end
    expect(nextMove.turnIndex).toBe(-1);
    expect(angular.equals(nextMove.endMatchScores, [0, 1])).toBe(true);
  });

  it("do not assign player to 8 before all his balls are potted", function () {
    let state = GameLogic.getInitialState();
    state.FirstMove = false;
    state.CanMoveCueBall = false;
    state.Player1Color = AssignedBallType.Eight;
    state.Player2Color = AssignedBallType.Stripes;
    setBallsPotted(state, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12); // left on board: 8 13 14 15
    setDeltaState(state, 13, 13);
    let nextMove = GameLogic.createMove(state, 1);
    // game should not switch turn because player potted a ball
    expect(nextMove.turnIndex).toBe(1);
    // player 1's color should still be 8
    expect(nextMove.state.Player1Color).toBe(AssignedBallType.Eight);
    // player 2's color should not change
    expect(nextMove.state.Player2Color).toBe(AssignedBallType.Stripes);
  });

  it("assign both players to 8 if one move potted 2 balls of different colors and no colored ball is left", function () {
    let state = GameLogic.getInitialState();
    state.FirstMove = false;
    state.CanMoveCueBall = false;
    state.Player1Color = AssignedBallType.Solids;
    state.Player2Color = AssignedBallType.Stripes;
    setBallsPotted(state, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14); // left on board: 7 8 15
    setDeltaState(state, 7, 7, 15);
    let nextMove = GameLogic.createMove(state, 1);
    // game should switch turn because player hit opponent's ball first
    expect(nextMove.turnIndex).toBe(0);
    // player 1's color should still be solids
    expect(nextMove.state.Player1Color).toBe(AssignedBallType.Eight);
    // player 2's color should not change
    expect(nextMove.state.Player2Color).toBe(AssignedBallType.Eight);
  });

  it("potting all 3 remaning balls 7, 8, 9 at the same time should result in player losing", function () {
    let state = GameLogic.getInitialState();
    state.FirstMove = false;
    state.CanMoveCueBall = false;
    state.Player1Color = AssignedBallType.Solids;
    state.Player2Color = AssignedBallType.Stripes;
    setBallsPotted(state, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15); // left on board: 7 8 9
    setDeltaState(state, 7, 8, 9);
    let nextMove = GameLogic.createMove(state, 0);
    // game should end with player 1 losing
    expect(nextMove.turnIndex).toBe(-1);
    expect(angular.equals(nextMove.endMatchScores, [0, 1])).toBe(true);
  });
  
});
