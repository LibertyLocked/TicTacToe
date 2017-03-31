interface SupportedLanguages {
  en: string, iw: string,
  pt: string, zh: string,
  el: string, fr: string,
  hi: string, es: string,
};

// the game stage
enum GameStage {
    PlacingCue = 1, // player is placing the cue ball
    Aiming, // player is ready to hit the cue ball
    CueHit, // player has hit the cue ball
    Finalized, // game state is sent over network
}

interface BallModel {
    Ball: Ball,
    Body: Matter.Body,
}

module GameplayConsts {
    export const CollisionCategoryCue = 0x0001;
    export const CollisionCategoryNormalBalls = 0x0002;
    export const CollisionMaskAllBalls = 0x0003;
    export const CollisionMaskMouse = 0x0000;
    export const BallRestitution = 0.9;
    export const BallFriction = 0.01;
    export const BorderThickness = 16;
    // export const BorderClearance = 10;
    export const BallTextureSize = 128; // ball textures are 128x128
    export const ClickDistanceLimit = 150;
    export const ClickForceMax = 0.04;
};

module game {
  export let $rootScope: angular.IScope = null;
  export let $timeout: angular.ITimeoutService = null;

  // Global variables are cleared when getting updateUI.
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console, e.g.,
  // game.currentUpdateUI
  export let currentUpdateUI: IUpdateUI = null;
  export let state: IState = null;
  export let yourPlayerInfo: IPlayerInfo = null;

  var translate = gamingPlatform.translate;
  var resizeGameAreaService = gamingPlatform.resizeGameAreaService;
  var gameService = gamingPlatform.gameService;
  var log = gamingPlatform.log;

  // using shortcuts
  var Engine = Matter.Engine,
    Render = Matter.Render,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Bodies = Matter.Bodies;

  // resources
  var _stickImg: HTMLImageElement; // cue stick png image

  // The saved game state
  var _gameState: IState;
  // Globals
  var _engine: Matter.Engine;
  var _world: Matter.World;
  var _render: Matter.Render;
  var _mouse: Matter.Mouse;

  var _topLeftCorner: Matter.Vector; // used for bounds
  var _bottomRightCorner: Matter.Vector;
  var _mouseDistance = 0; // mouse distance from cue ball
  var _gameStage: GameStage;
  var _firstTouchBall: Ball | null = null;
  var _pocketedBalls: Ball[] = [];
  // view models
  var cueBallModel: BallModel;
  var eightBallModel: BallModel;
  var solidBallModels: BallModel[] = [];
  var stripedBallModels: BallModel[] = [];

  function resetGlobals() {
    _mouseDistance = 0;
    _firstTouchBall = null;
    _pocketedBalls = [];
    solidBallModels = [];
    stripedBallModels = [];
    if (_engine) Engine.clear(_engine);
    if (_world) World.clear(_world, false);
    if (_render) Render.stop(_render);
  }

  function shootClick(cueBall: Matter.Body) {
    let forcePosition: Matter.Vector = {
      x: cueBall.position.x + 1.0 * Math.cos(cueBall.angle),
      y: cueBall.position.y + 1.0 * Math.sin(cueBall.angle)
    };
    let force: number = _mouseDistance / GameplayConsts.ClickDistanceLimit * GameplayConsts.ClickForceMax;

    console.log("force pos: ", forcePosition);
    console.log("force mag: ", force);
    console.log("render len: ", _mouseDistance);

    Matter.Body.applyForce(cueBall, forcePosition, {
      x: force * Math.cos(cueBall.angle),
      y: force * Math.sin(cueBall.angle)
    });
    _engine.enableSleeping = true;
  }

  function isWorldSleeping(world: Matter.World): boolean {
    let bodies = Matter.Composite.allBodies(world);
    let sleeping = bodies.filter((body) => body.isSleeping);
    let isWorldSleeping = bodies.length === sleeping.length;
    return isWorldSleeping;
  }

  function handleBallBallCollision(bodyA: Matter.Body, bodyB: Matter.Body) {
    if (!_firstTouchBall) {
      let ballNumberA = Number(bodyA.label.split(' ')[1]);
      let ballNumberB = Number(bodyB.label.split(' ')[1]);
      if (ballNumberA != 0 && ballNumberB == 0) {
        // B is cue
        _firstTouchBall = getBallModelFromBody(bodyA).Ball;
      } else if (ballNumberA == 0 && ballNumberB != 0) {
        // A is cue
        _firstTouchBall = getBallModelFromBody(bodyB).Ball;
      }
    }
  }

  function handlePocketBallCollision(pocketBody: Matter.Body, ballBody: Matter.Body) {
    // destroy the ball body
    World.remove(_world, ballBody);
    // get the ball number
    let ballNumber = Number(ballBody.label.split(' ')[1]);
    // create the ball model and add to pocketed balls
    let theBall = getBallModelFromBody(ballBody).Ball;
    theBall.Pocketed = true;
    _pocketedBalls.push(theBall);
  }

  // helper method to get distance between 2 vectors
  function distanceBetweenVectors(vec1: Matter.Vector, vec2: Matter.Vector): number {
    let xsq = Math.pow(vec1.x - vec2.x, 2);
    let ysq = Math.pow(vec1.y - vec2.y, 2);
    return Math.sqrt(xsq + ysq);
  }

  // creates cue ball view-model from Ball. does not add to world
  function createCueBallModel(cueBall: Ball): BallModel {
    let newCueModel = {
      Ball: cueBall, Body: Bodies.circle(cueBall.Position.X, cueBall.Position.Y, cueBall.Radius, <any>{
        isStatic: false,
        collisionFilter: { category: GameplayConsts.CollisionCategoryCue, mask: GameplayConsts.CollisionMaskAllBalls },
        restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
        render: { fillStyle: 'white', strokeStyle: 'black' },
        label: 'Ball 0'
      })
    };
    return newCueModel;
  }

  // constructs a rectangle body as border, from pocket1 to pocket2
  function createBorderBody(pocket1: Pocket, pocket2: Pocket, vertical: boolean): Matter.Body {
    let x, y, width, height: number;
    if (vertical) {
      x = pocket1.Position.X;
      y = (pocket1.Position.Y + pocket2.Position.Y) / 2.0;
      width = GameplayConsts.BorderThickness;
      height = pocket2.Position.Y - pocket1.Position.Y - (pocket1.Radius - pocket2.Radius) / 2;
    } else {
      x = (pocket1.Position.X + pocket2.Position.X) / 2.0;
      y = pocket1.Position.Y;
      width = pocket2.Position.X - pocket1.Position.X - (pocket1.Radius - pocket2.Radius) / 2;
      height = GameplayConsts.BorderThickness;
    }
    return Bodies.rectangle(
      x, y, width, height,
      <any>{
        isStatic: true,
        render: { fillStyle: '#825201', strokeStyle: 'black' },
        label: 'Border'
      });
  }

  // gets the view-model associated with the body
  function getBallModelFromBody(ballBody: Matter.Body): BallModel {
    let ballNumber = Number(ballBody.label.split(' ')[1]);
    if (ballNumber == 0) {
      return cueBallModel;
    } else if (ballNumber == 8) {
      return eightBallModel;
    } else if (ballNumber > 8) {
      return stripedBallModels[ballNumber - 9];
    } else {
      return solidBallModels[ballNumber - 1];
    }
  }

  function syncBallModelPositions() {
    cueBallModel.Ball.Position = { X: cueBallModel.Body.position.x, Y: cueBallModel.Body.position.y };
    eightBallModel.Ball.Position = { X: eightBallModel.Body.position.x, Y: eightBallModel.Body.position.y };
    for (let ballModel of solidBallModels) {
      ballModel.Ball.Position = { X: ballModel.Body.position.x, Y: ballModel.Body.position.y };
    }
    for (let ballModel of stripedBallModels) {
      ballModel.Ball.Position = { X: ballModel.Body.position.x, Y: ballModel.Body.position.y };
    }
  }

  // clamps the position within board bounds
  function clampWithinBounds(pos: Matter.Vector): Matter.Vector {
    let x = Math.min(_bottomRightCorner.x - GameplayConsts.BorderThickness, Math.max(pos.x, _topLeftCorner.x + GameplayConsts.BorderThickness));
    let y = Math.min(_bottomRightCorner.y - GameplayConsts.BorderThickness, Math.max(pos.y, _topLeftCorner.y + GameplayConsts.BorderThickness));
    return { x: x, y: y };
  }

  // moves the cue ball and recreates the cue ball body and model
  function moveCueBall(pos: Matter.Vector, useStartLine: boolean) {
    World.remove(_world, cueBallModel.Body);
    let y: number;
    if (useStartLine) {
      y = _gameState.PoolBoard.StartLine;
    } else {
      y = pos.y;
    }
    // clamp within bounds
    let clampedPos = clampWithinBounds({ x: pos.x, y: y });
    _gameState.CueBall.Position = { X: clampedPos.x, Y: clampedPos.y };
    cueBallModel = createCueBallModel(_gameState.CueBall);
    World.add(_world, cueBallModel.Body);
    _gameState.CueBall.Pocketed = false;
  }

  function finalize() {
    // send the move over network here
    console.log("player's turn is done");
    // sync the model positions
    syncBallModelPositions();
    // create return state
    let theReturnState: ReturnState = {
      PocketedBalls: _pocketedBalls,
      TouchedBall: _firstTouchBall,
    }
    // create IState
    let solidBalls: Ball[] = [];
    let stripedBalls: Ball[] = [];
    for (let ballModel of solidBallModels) {
      solidBalls.push(ballModel.Ball);
    }
    for (let ballModel of stripedBallModels) {
      stripedBalls.push(ballModel.Ball);
    }
    let finalState: IState = {
      SolidBalls: solidBalls,
      StripedBalls: stripedBalls,
      EightBall: eightBallModel.Ball,
      CueBall: cueBallModel.Ball,
      CanMoveCueBall: _gameState.CanMoveCueBall, // set by gamelogic
      PoolBoard: _gameState.PoolBoard,
      FirstMove: _gameState.FirstMove, // set by gamelogic
      Player1Color: _gameState.Player1Color, // set by gamelogic
      Player2Color: _gameState.Player2Color, // set by gamelogic
      DeltaBalls: theReturnState,
    }
    console.log(finalState);
    let newMove = GameLogic.createMove(finalState, currentUpdateUI.turnIndex);
    console.log(newMove);
    // send the move over network
    gameService.makeMove(newMove, null);
  }

  function drawGuideLine(context: CanvasRenderingContext2D) {
    let cueBody = cueBallModel.Body;
    let startPoint = { x: cueBody.position.x, y: cueBody.position.y };
    let endPoint = {
      x: cueBody.position.x + _mouseDistance * Math.cos(cueBody.angle),
      y: cueBody.position.y + _mouseDistance * Math.sin(cueBody.angle)
    }
    context.save();
    context.globalAlpha = 0.5;
    context.beginPath();
    context.setLineDash([3]);
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.strokeStyle = 'red';
    context.lineWidth = 5.5;
    context.stroke();
    context.closePath();
    context.restore();
  }

  function drawCueStick(context: CanvasRenderingContext2D) {
    let cueBody = cueBallModel.Body;
    context.save();
    context.translate(cueBody.position.x, cueBody.position.y);
    context.rotate(cueBody.angle);
    context.drawImage(_stickImg, -_stickImg.width - _mouseDistance, -_stickImg.height / 2);
    context.restore();
  }

  function drawGameHUD(context: CanvasRenderingContext2D) {
    context.save();
    let fontSize = 16;
    context.font = "16px Arial";
    context.fillStyle = "white";
    let textLeft = "";
    switch (_gameStage) {
      case GameStage.PlacingCue:
        textLeft = "Click to place cue ball";
        break;
      case GameStage.Aiming:
        textLeft = "Drag behind cue ball to aim";
        break;
      case GameStage.CueHit:
        if (_firstTouchBall) textLeft = "First touch: " + _firstTouchBall.Number;
        break;
      case GameStage.Finalized:
        textLeft = "Opponent's turn!";
        break;
    }
    context.textAlign = "left";
    context.fillText(textLeft, 0, fontSize);

    if ((_gameStage == GameStage.PlacingCue || _gameStage == GameStage.Aiming)) {
      // Use player turn index to get the current player
      let designatedGroup = '';
      if (yourPlayerIndex() == 0) designatedGroup = AssignedBallType[_gameState.Player1Color];
      else designatedGroup = AssignedBallType[_gameState.Player2Color];
      let myColorText = "Designated group: " + designatedGroup;
      context.textAlign = "right";
      context.fillText(myColorText, context.canvas.width, fontSize);
    }

    if ((_gameStage == GameStage.Finalized || _gameStage == GameStage.CueHit) && _pocketedBalls.length != 0) {
      let statusText = "Pocketed: ";
      for (let ball of _pocketedBalls) {
        statusText += ball.Number + ",";
      }
      context.textAlign = "right";
      context.fillText(statusText, context.canvas.width, fontSize);
    }
    // show mouse coords on screen bottom
    if (_mouse) {
      let coordText = "(" + _mouse.position.x.toFixed(0) + "," + _mouse.position.y.toFixed(0) + ")";
      context.textAlign = "center";
      context.fillText(coordText, context.canvas.width / 2, context.canvas.height - fontSize);
    }
    context.restore();
  }

  // ========================================
  // multiplayer gaming platform stuff
  // ========================================

  export function init($rootScope_: angular.IScope, $timeout_: angular.ITimeoutService) {
    $rootScope = $rootScope_;
    $timeout = $timeout_;
    registerServiceWorker();
    translate.setTranslations({});
    translate.setLanguage('en');
    let dummyState = GameLogic.getInitialState();
    resizeGameAreaService.setWidthToHeight(dummyState.PoolBoard.Width / dummyState.PoolBoard.Height);
    gameService.setGame({
      updateUI: updateUI,
      getStateForOgImage: null,
    });
  }

  function registerServiceWorker() {
    // I prefer to use appCache over serviceWorker
    // (because iOS doesn't support serviceWorker, so we have to use appCache)
    // I've added this code for a future where all browsers support serviceWorker (so we can deprecate appCache!)
    if (!window.applicationCache && 'serviceWorker' in navigator) {
      let n: any = navigator;
      gamingPlatform.log.log('Calling serviceWorker.register');
      n.serviceWorker.register('service-worker.js').then(function (registration: any) {
        log.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch(function (err: any) {
        log.log('ServiceWorker registration failed: ', err);
      });
    }
  }

  export function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    resetGlobals();
    // get the game state from server
    currentUpdateUI = params;
    _gameState = params.state;
    if (isFirstMove()) {
      _gameState = GameLogic.getInitialState();
    }
    // set game stage
    if (isMyTurn()) {
      // if it's my turn, set state to placing cue or aiming
      if (_gameState.CanMoveCueBall) {
        _gameStage = GameStage.PlacingCue;
      } else {
        _gameStage = GameStage.Aiming;
      }
    } else {
      // it's not my turn. set the game state to finalized
      _gameStage = GameStage.Finalized;
    }

    // load resources
    _stickImg = new Image();
    _stickImg.src = 'imgs/stick.png';

    // clear canvas-container to prevent multple canvases being created
    document.getElementById("canvas-container").innerHTML = "";

    // set up matterjs
    _engine = Engine.create(),
      _world = _engine.world;
    _render = Render.create({
      element: document.getElementById("canvas-container"),
      engine: _engine,
      options: {
        height: _gameState.PoolBoard.Height,
        width: _gameState.PoolBoard.Width,
      }
    });
    _engine.world.gravity.y = 0;
    let renderOptions = <any>_render.options;
    renderOptions.wireframes = false;
    renderOptions.background = 'green';

    // create borders
    let pockets = _gameState.PoolBoard.Pockets;
    World.add(_world, [
      createBorderBody(pockets[0], pockets[3], false), // top
      createBorderBody(pockets[2], pockets[5], false), // bottom
      createBorderBody(pockets[1], pockets[0], true), // left top
      createBorderBody(pockets[1], pockets[2], true), // left bottom
      createBorderBody(pockets[4], pockets[3], true), // right top
      createBorderBody(pockets[4], pockets[5], true), // right bottom
    ]);
    _topLeftCorner = { x: pockets[0].Position.X, y: pockets[0].Position.Y };
    _bottomRightCorner = { x: pockets[5].Position.X, y: pockets[5].Position.Y };

    // create pockets
    for (let pocket of _gameState.PoolBoard.Pockets) {
      World.add(_world,
        Bodies.circle(pocket.Position.X, pocket.Position.Y, pocket.Radius,
          <any>{
            isStatic: true,
            render: { fillStyle: 'black' },
            label: 'Pocket'
          }));
    }

    // create ball bodies and body models
    let textureScale = _gameState.CueBall.Radius * 2 / GameplayConsts.BallTextureSize;
    // cue ball
    cueBallModel = createCueBallModel(_gameState.CueBall);
    if (!_gameState.CueBall.Pocketed && !_gameState.CanMoveCueBall) World.add(_world, cueBallModel.Body);

    // eight ball
    eightBallModel = {
      Ball: _gameState.EightBall,
      Body: Bodies.circle(_gameState.EightBall.Position.X, _gameState.EightBall.Position.Y,
        _gameState.EightBall.Radius, <any>{
          isStatic: false,
          collisionFilter: { category: GameplayConsts.CollisionCategoryCue, mask: GameplayConsts.CollisionMaskAllBalls },
          restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
          render: { sprite: { texture: 'imgs/8.png', xScale: textureScale, yScale: textureScale } },
          label: 'Ball 8'
        })
    };
    if (!_gameState.EightBall.Pocketed) World.add(_world, eightBallModel.Body);

    // solid balls
    for (let ball of _gameState.SolidBalls) {
      let theBallBody = Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, <any>{
        isStatic: false,
        collisionFilter: { category: GameplayConsts.CollisionCategoryNormalBalls, mask: GameplayConsts.CollisionMaskAllBalls },
        restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
        render: { sprite: { texture: 'imgs/' + String(ball.Number) + '.png', xScale: textureScale, yScale: textureScale } },
        label: 'Ball ' + String(ball.Number)
      });
      if (!ball.Pocketed) World.add(_world, theBallBody);
      solidBallModels.push({ Ball: ball, Body: theBallBody });
    }
    // striped balls
    for (let ball of _gameState.StripedBalls) {
      let theBallBody = Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, <any>{
        isStatic: false,
        collisionFilter: { category: GameplayConsts.CollisionCategoryNormalBalls, mask: GameplayConsts.CollisionMaskAllBalls },
        restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
        render: { sprite: { texture: 'imgs/' + String(ball.Number) + '.png', xScale: textureScale, yScale: textureScale } },
        label: 'Ball ' + String(ball.Number)
      });
      if (!ball.Pocketed) World.add(_world, theBallBody);
      stripedBallModels.push({ Ball: ball, Body: theBallBody });
    }

    // add mouse control
    _mouse = Mouse.create(_render.canvas);
    let mouseConstraint = (<any>MouseConstraint).create(_engine, { mouse: _mouse });
    mouseConstraint.collisionFilter.mask = GameplayConsts.CollisionMaskMouse;
    World.add(_world, mouseConstraint);

    // EVENT: shoot cue ball on mouseup
    Matter.Events.on(mouseConstraint, 'mouseup', function (event) {
      let mouseUpPosition = <Matter.Vector>event.mouse.mouseupPosition;
      if (_gameStage == GameStage.Aiming /* && isHumanTurn() */) {
        // only shoot cue ball when the mouse is around the cue ball
        let dist = distanceBetweenVectors(mouseUpPosition, cueBallModel.Body.position);
        if (dist < GameplayConsts.ClickDistanceLimit) {
          _gameStage = GameStage.CueHit;
          shootClick(cueBallModel.Body);
        }
      } else if (_gameStage == GameStage.PlacingCue) {
        // place the cue ball at mouse position
        // recreate the cue ball model (body)
        moveCueBall(mouseUpPosition, _gameState.FirstMove);
        _gameStage = GameStage.Aiming;
      }
    });
    // EVENT: handle pocket and ball collision
    Matter.Events.on(_engine, 'collisionStart', function (event) {
      // only handle collisions after player has hit the cue ball
      if (_gameStage != GameStage.CueHit) return;
      for (let pair of event.pairs) {
        if (pair.bodyA.label == 'Pocket' && pair.bodyB.label.indexOf('Ball') >= 0) {
          handlePocketBallCollision(pair.bodyA, pair.bodyB);
        }
        if (pair.bodyA.label.indexOf('Ball') >= 0 && pair.bodyB.label.indexOf('Ball') >= 0) {
          handleBallBallCollision(pair.bodyA, pair.bodyB);
        }
      }
    });
    // EVENT: update
    Matter.Events.on(_render, 'afterRender', function () {
      // update _renderLength (the distance between mouse and cue body)
      let cuePosition = cueBallModel.Body.position;
      let horizontalDistance = cuePosition.x - _mouse.position.x;
      let verticalDistance = cuePosition.y - _mouse.position.y;
      let angle = Math.atan2(verticalDistance, horizontalDistance);
      _mouse.position = _mouse.position;
      _mouseDistance = distanceBetweenVectors(cuePosition, _mouse.position);

      // set cue ball angle if aiming
      if (_gameStage == GameStage.Aiming) {
        Matter.Body.setAngle(cueBallModel.Body, angle);
      }

      // draw the render line
      if (_gameStage == GameStage.Aiming) {
        if (_mouseDistance < GameplayConsts.ClickDistanceLimit) {
          drawGuideLine(_render.context);
          drawCueStick(_render.context);
        }
      }
      // send return state when all bodies are sleeping
      if (_gameStage == GameStage.CueHit && isWorldSleeping(_world)) {
        _gameStage = GameStage.Finalized;
        finalize();
      }
      // always render game HUD
      drawGameHUD(_render.context);
    });

    // start simulation
    Render.run(_render);
    Engine.run(_engine);
  }

  function maybeSendComputerMove() {
    if (!isComputerTurn()) return;
    let currentMove: IMove = {
      endMatchScores: currentUpdateUI.endMatchScores,
      state: currentUpdateUI.state,
      turnIndex: currentUpdateUI.turnIndex,
    }
    let move = aiService.findComputerMove(currentMove);
    log.info("Computer move: ", move);
    gameService.makeMove(move, null);
  }

  function isFirstMove() {
    return !currentUpdateUI.state;
  }

  function yourPlayerIndex() {
    return currentUpdateUI.yourPlayerIndex;
  }

  function isComputer() {
    let playerInfo = currentUpdateUI.playersInfo[currentUpdateUI.yourPlayerIndex];
    // In community games, playersInfo is [].
    return playerInfo && playerInfo.playerId === '';
  }

  function isComputerTurn() {
    return isMyTurn() && isComputer();
  }

  function isHumanTurn() {
    return isMyTurn() && !isComputer();
  }

  function isMyTurn() {
    return currentUpdateUI.turnIndex >= 0 && // game is ongoing
      currentUpdateUI.yourPlayerIndex === currentUpdateUI.turnIndex; // it's my turn
  }
}

angular.module('myApp', ['gameServices'])
  .run(['$rootScope', '$timeout',
    function ($rootScope: angular.IScope, $timeout: angular.ITimeoutService) {
      $rootScope['game'] = game;
      game.init($rootScope, $timeout);
    }]);
