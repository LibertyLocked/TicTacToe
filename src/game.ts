interface SupportedLanguages {
  en: string, iw: string,
  pt: string, zh: string,
  el: string, fr: string,
  hi: string, es: string,
};

interface IProposalData {

}

module GameplayConsts {
  export const CollisionCategoryCue = 0x0001;
  export const CollisionCategoryColoredBalls = 0x0002;
  export const CollisionMaskAllBalls = 0x0003;
  export const CollisionMaskMouse = 0x0000;
  export const BallMass = 0.2;
  export const BallRestitution = 0.92;
  export const BallFrictionAir = 0.012;
  export const BallFriction = 0.01;
  export const BorderThicknessOut = 50;
  export const BallTextureSize = 128; // ball textures are 128x128
  export const ClickDistanceLimit = 150;
  export const ClickForceMax = 0.02;
};

module game {
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

  interface RaycastResult {
    Point: Matter.Vector,
    Body: Matter.Body,
  }

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

  var _boardMinX: number; // used for bounds
  var _boardMaxX: number;
  var _boardMinY: number;
  var _boardMaxY: number
  var _mouseDistance = 0; // mouse distance from cue ball
  var _gameStage: GameStage;
  var _firstTouchBall: Ball = null;
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
    let force: number = _mouseDistance / GameplayConsts.ClickDistanceLimit * GameplayConsts.ClickForceMax;

    console.log("force mag: ", force);
    console.log("mouse distance: ", _mouseDistance);

    Matter.Body.applyForce(cueBall, cueBall.position, {
      x: force * Math.cos(cueBall.angle),
      y: force * Math.sin(cueBall.angle)
    });
    _engine.enableSleeping = true;
  }

  function isWorldSleeping(world: Matter.World): boolean {
    let bodies = Matter.Composite.allBodies(world);
    let sleeping = bodies.filter((body) => body.isSleeping);
    return bodies.length === sleeping.length;
  }

  function handleBallBallCollision(bodyA: Matter.Body, bodyB: Matter.Body) {
    if (!_firstTouchBall) {
      let ballA = getBallModelFromBody(bodyA).Ball;
      let ballB = getBallModelFromBody(bodyB).Ball;
      if (ballA.BallType != BallType.Cue && ballB.BallType == BallType.Cue) {
        // B is cue
        _firstTouchBall = ballA;
      } else if (ballA.BallType == BallType.Cue && ballB.BallType != BallType.Cue) {
        // A is cue
        _firstTouchBall = ballB;
      }
    }
  }

  function handlePocketBallCollision(pocketBody: Matter.Body, ballBody: Matter.Body) {
    // destroy the ball body
    World.remove(_world, ballBody);
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

  // creates cue ball view-model from Ball
  function createCueBallModel(cueBall: Ball): BallModel {
    let newCueModel: BallModel = {
      Ball: cueBall, Body: Bodies.circle(cueBall.Position.X, cueBall.Position.Y, cueBall.Radius, <any>{
        isStatic: false,
        collisionFilter: { category: GameplayConsts.CollisionCategoryCue, mask: GameplayConsts.CollisionMaskAllBalls },
        restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFrictionAir, friction: GameplayConsts.BallFriction,
        render: { fillStyle: 'white', strokeStyle: 'black' },
        label: 'Ball 0',
        mass: GameplayConsts.BallMass,
      })
    };
    return newCueModel;
  }

  function createBallModel(ball: Ball, collisionCategory: number, collisionMask: number): BallModel {
    let textureScale = ball.Radius * 2 / GameplayConsts.BallTextureSize;
    let newBallModel: BallModel = {
      Ball: ball, Body: Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, <any>{
        isStatic: false,
        collisionFilter: { category: collisionCategory, mask: collisionMask },
        restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFrictionAir, friction: GameplayConsts.BallFriction,
        render: { sprite: { texture: 'imgs/' + ball.Number + '.png', xScale: textureScale, yScale: textureScale } },
        label: 'Ball ' + ball.Number,
        mass: GameplayConsts.BallMass,
      })
    };
    return newBallModel;
  }

  // constructs a rectangle body as border, from pocket1 to pocket2
  function createBorderBody(topLeftCorner: Matter.Vector, bottomRightCorner: Matter.Vector, leftOrRight: boolean, leftOrTop: boolean): Matter.Body {
    let x: number, y: number, width: number, height: number;
    let thicknessOffset = (GameplayConsts.BorderThicknessOut) / 2;
    if (leftOrRight) {
      y = _render.canvas.height / 2;
      height = _render.canvas.height;
      width = GameplayConsts.BorderThicknessOut;
      x = leftOrTop ? topLeftCorner.x - thicknessOffset : bottomRightCorner.x + thicknessOffset;
    } else {
      y = leftOrTop ? topLeftCorner.y - thicknessOffset : bottomRightCorner.y + thicknessOffset;
      x = _render.canvas.width / 2;
      height = GameplayConsts.BorderThicknessOut;
      width = _render.canvas.width;
    }
    let body = Bodies.rectangle(
      x, y, width, height,
      <any>{
        isStatic: true,
        render: { fillStyle: '#825201', strokeStyle: 'black' },
        label: 'Border'
      });
    return body;
  }

  // gets the view-model associated with the body
  function getBallModelFromBody(ballBody: Matter.Body): BallModel {
    if (ballBody.label.indexOf('Ball') < 0) return null; // not a ball
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
  function clampWithinBounds(pos: Matter.Vector, radius: number): Matter.Vector {
    let x = Math.min(_boardMaxX - radius,
      Math.max(pos.x, _boardMinX + radius));
    let y = Math.min(_boardMaxY - radius,
      Math.max(pos.y, _boardMinY + radius));
    return { x: x, y: y };
  }

  // moves the cue ball and recreates the cue ball body and model
  function moveCueBall(pos: Matter.Vector, useStartLine: boolean): boolean {
    // do not allow placing inside another body
    let bodies = Matter.Query.point(Matter.Composite.allBodies(_world), pos);
    if (bodies.length > 0) return false;

    World.remove(_world, cueBallModel.Body);
    let y: number;
    if (useStartLine) {
      y = _gameState.PoolBoard.StartLine;
    } else {
      y = pos.y;
    }
    // clamp within bounds
    let clampedPos = clampWithinBounds({ x: pos.x, y: y }, cueBallModel.Ball.Radius);
    _gameState.CueBall.Position = { X: clampedPos.x, Y: clampedPos.y };
    cueBallModel = createCueBallModel(_gameState.CueBall);
    World.add(_world, cueBallModel.Body);
    _gameState.CueBall.Pocketed = false;
    return true;
  }

  function isMouseWithinShootRange(): boolean {
    return _mouseDistance <= GameplayConsts.ClickDistanceLimit &&
      _mouseDistance >= cueBallModel.Ball.Radius;
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

  function getRaycastPoint(bodies: Matter.Body[], start: Matter.Vector, r: Matter.Vector, dist: number): RaycastResult {
    var normRay = Matter.Vector.normalise(r);
    var ray = normRay;
    var point = Matter.Vector.add(ray, start);
    for (var i = 0; i < dist; i++) {
      ray = Matter.Vector.mult(normRay, i);
      ray = Matter.Vector.add(start, ray);
      var bod = Matter.Query.point(bodies, ray)[0];
      if (bod) {
        return { Point: ray, Body: bod };
      }
    }
    return null;
  }

  function drawGuideLine(context: CanvasRenderingContext2D, length: number, width: number,
    style: string, alpha: number, raycast: boolean) {
    let cueBody = cueBallModel.Body;
    let startPoint = cueBody.position;
    let endPoint: Matter.Vector = {
      x: cueBody.position.x + length * Math.cos(cueBody.angle),
      y: cueBody.position.y + length * Math.sin(cueBody.angle)
    }
    if (raycast) {
      let direction = { x: Math.cos(cueBody.angle) * cueBallModel.Ball.Radius, y: Math.sin(cueBody.angle) * cueBallModel.Ball.Radius };
      let raycastStart = { x: startPoint.x + direction.x, y: startPoint.y + direction.y };
      let collisions = <Matter.IPair[]>Matter.Query.ray(_world.bodies, raycastStart, endPoint, cueBallModel.Ball.Radius * 2);
      let minDist: number = length;
      let minDistModel: BallModel = null;
      for (let collision of collisions) {
        let body = collision.bodyA;
        let ballModel = getBallModelFromBody(body);
        if (!ballModel) continue; // only collide with balls
        let dist = distanceBetweenVectors(body.position, cueBallModel.Body.position);
        if (dist <= minDist) {
          minDist = dist;
          minDistModel = ballModel;
        }
      }
      if (minDistModel) {
        endPoint = {
          x: cueBody.position.x + minDist * Math.cos(cueBody.angle),
          y: cueBody.position.y + minDist * Math.sin(cueBody.angle)
        }
        // highlight the ball it's going to hit
        context.save();
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.globalAlpha = 0.5;
        context.beginPath();
        context.arc(minDistModel.Body.position.x, minDistModel.Body.position.y, cueBallModel.Ball.Radius, 0, 2 * Math.PI);
        context.stroke();
        context.font = '16px serif';
        context.globalAlpha = 0.8;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(BallType[minDistModel.Ball.BallType] + " " + minDistModel.Ball.Number,
          minDistModel.Body.position.x, minDistModel.Body.position.y - minDistModel.Ball.Radius);
        context.restore();
      }
      // let res = getRaycastPoint(_world.bodies, raycastStart, direction, length);
      // if (res) {
      //   endPoint = { x: res.Point.x - direction.x, y: res.Point.y - direction.y };
      //   // draw the mock cue ball
      //   context.save();
      //   context.strokeStyle = "white";
      //   context.lineWidth = 2;
      //   context.globalAlpha = 0.3;
      //   context.beginPath();
      //   context.arc(endPoint.x, endPoint.y, cueBallModel.Ball.Radius, 0, 2 * Math.PI);
      //   context.stroke();
      //   context.restore();
      // }
    }
    context.save();
    context.globalAlpha = alpha;
    context.beginPath();
    context.setLineDash([4]);
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.strokeStyle = style;
    context.lineWidth = width;
    context.stroke();
    context.restore();
  }

  function drawGuideCircle(context: CanvasRenderingContext2D) {
    context.save();
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.globalAlpha = 0.3;
    context.setLineDash([Math.PI * 5, Math.PI * 10]);
    context.beginPath();
    let angleOffset = new Date().getTime() * 0.0004 % (2 * Math.PI);
    context.arc(cueBallModel.Body.position.x, cueBallModel.Body.position.y,
      GameplayConsts.ClickDistanceLimit,
      angleOffset, 2 * Math.PI + angleOffset);
    context.stroke();
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

  function drawHightlightBalls(context: CanvasRenderingContext2D) {
    let playerColor = currentUpdateUI.yourPlayerIndex === 0 ? _gameState.Player1Color : _gameState.Player2Color;
    let ballModelsToHighlight: BallModel[] = [];
    if (playerColor == AssignedBallType.Solids) {
      ballModelsToHighlight = solidBallModels;
    } else if (playerColor == AssignedBallType.Stripes) {
      ballModelsToHighlight = stripedBallModels;
    } else if (playerColor == AssignedBallType.Eight) {
      ballModelsToHighlight.push(eightBallModel);
    }
    if (!ballModelsToHighlight) return;
    context.save();
    context.strokeStyle = "gold";
    context.lineWidth = 3;
    context.globalAlpha = 0.5 * (Math.sin(new Date().getTime() * 0.005) + 1) / 2;
    for (let model of ballModelsToHighlight) {
      if (model.Ball.Pocketed) continue;
      context.beginPath();
      context.arc(model.Body.position.x, model.Body.position.y, cueBallModel.Ball.Radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
    context.restore();
  }

  function drawGameHUD(context: CanvasRenderingContext2D) {
    context.save();
    let fontSize = 16;
    context.font = fontSize + "px Arial";
    context.textBaseline = "top";
    // text on the left
    let textLeft = "";
    switch (_gameStage) {
      case GameStage.PlacingCue:
        textLeft = "Click to place cue ball";
        context.font = fontSize * (1 + 0.1 * (Math.sin(new Date().getTime() * 0.005) + 1)) + "px Arial";
        break;
      case GameStage.Aiming:
        textLeft = "Drag behind cue ball to aim";
        break;
      case GameStage.CueHit:
        if (_firstTouchBall) textLeft = "First touch: " + _firstTouchBall.Number;
        break;
      case GameStage.Finalized:
        if (!isGameOver()) textLeft = "Opponent's turn!";
        else textLeft = currentUpdateUI.endMatchScores[yourPlayerIndex()] == 0 ? "You lose!" : "You win!";
        break;
    }
    context.fillStyle = "yellow";
    context.textAlign = "left";
    context.fillText(textLeft, 0, 0);

    // text on the right
    context.font = fontSize + "px Arial";
    let textRight = "";
    if ((_gameStage == GameStage.PlacingCue || _gameStage == GameStage.Aiming || _gameStage == GameStage.Finalized)) {
      let designatedGroup = '';
      if (yourPlayerIndex() == 0) designatedGroup = AssignedBallType[_gameState.Player1Color];
      else designatedGroup = AssignedBallType[_gameState.Player2Color];
      textRight = "Designated group: " + designatedGroup;
    }
    if (_gameStage == GameStage.CueHit && _pocketedBalls.length != 0) {
      textRight = "Pocketed: ";
      for (let ball of _pocketedBalls) {
        textRight += ball.Number + ",";
      }
    }
    context.fillStyle = "white";
    context.textAlign = "right";
    context.fillText(textRight, context.canvas.width, 0);

    // show mouse coords on screen bottom
    if (_mouse) {
      context.font = fontSize + "px Arial";
      let coordText = "(" + _mouse.position.x.toFixed(0) + "," + _mouse.position.y.toFixed(0) + ")";
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText(coordText, context.canvas.width / 2, context.canvas.height);
    }
    context.restore();
  }

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
    _boardMinY = pockets[0].Position.Y;
    _boardMaxY = pockets[2].Position.Y;
    _boardMinX = pockets[1].Position.X;
    _boardMaxX = pockets[4].Position.X;
    let topLeftCorner: Matter.Vector = {x: pockets[0].Position.X, y: pockets[0].Position.Y};
    let bottomRightCorner: Matter.Vector = {x: pockets[5].Position.X, y: pockets[5].Position.Y};
    World.add(_world, [
      createBorderBody(topLeftCorner, bottomRightCorner, false, true), // top
      createBorderBody(topLeftCorner, bottomRightCorner, true, true), // left
      createBorderBody(topLeftCorner, bottomRightCorner, false, false), // bottom
      createBorderBody(topLeftCorner, bottomRightCorner, true, false), // right
    ]);

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
    eightBallModel = createBallModel(_gameState.EightBall, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
    if (!_gameState.EightBall.Pocketed) World.add(_world, eightBallModel.Body);

    // solid balls
    for (let ball of _gameState.SolidBalls) {
      let ballModel = createBallModel(ball, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
      if (!ball.Pocketed) World.add(_world, ballModel.Body);
      solidBallModels.push(ballModel);
    }
    // striped balls
    for (let ball of _gameState.StripedBalls) {
      let ballModel = createBallModel(ball, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
      if (!ball.Pocketed) World.add(_world, ballModel.Body);
      stripedBallModels.push(ballModel);
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
        if (isMouseWithinShootRange()) {
          _gameStage = GameStage.CueHit;
          shootClick(cueBallModel.Body);
        }
      } else if (_gameStage == GameStage.PlacingCue) {
        // place the cue ball at mouse position
        // recreate the cue ball model (body)
        if (moveCueBall(mouseUpPosition, _gameState.FirstMove)) {
          _gameStage = GameStage.Aiming;
        }
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
    Matter.Events.on(_render, 'afterRender', function (event) {
      // update _renderLength (the distance between mouse and cue body)
      let cuePosition = cueBallModel.Body.position;
      let horizontalDistance = cuePosition.x - _mouse.position.x;
      let verticalDistance = cuePosition.y - _mouse.position.y;
      let angle = Math.atan2(verticalDistance, horizontalDistance);
      _mouseDistance = distanceBetweenVectors(cuePosition, _mouse.position);

      // set cue ball angle if aiming
      if (_gameStage == GameStage.Aiming) {
        Matter.Body.setAngle(cueBallModel.Body, angle);
      }

      // draw the guidelines, cue stick, guide circle
      if (_gameStage == GameStage.Aiming) {
        if (isMouseWithinShootRange()) {
          drawGuideLine(_render.context, 1000, 4, "white", 0.3, true); // directional guideline
          drawGuideLine(_render.context, _mouseDistance, 5, "red", 0.4, false); // current force guideline
          drawCueStick(_render.context);
        }
        drawGuideCircle(_render.context);
      }
      // always render game HUD
      drawGameHUD(_render.context);
      // always hightlight my assigned balls
      drawHightlightBalls(_render.context);
    });
    // EVENT: after every engine update check if all bodies are sleeping
    Matter.Events.on(_engine, "afterUpdate", function (event) {
      // send return state when all bodies are sleeping
      if (_gameStage == GameStage.CueHit && isWorldSleeping(_world)) {
        _gameStage = GameStage.Finalized;
        finalize();
      }
    });

    // start simulation
    Render.run(_render);
    Engine.run(_engine);
  }

  function maybeSendComputerMove() {
    // TODO: AI move
    // if (!isComputerTurn()) return;
    // let currentMove: IMove = {
    //   endMatchScores: currentUpdateUI.endMatchScores,
    //   state: currentUpdateUI.state,
    //   turnIndex: currentUpdateUI.turnIndex,
    // }
    // let move = aiService.findComputerMove(currentMove);
    // log.info("Computer move: ", move);
    // gameService.makeMove(move, null);
  }

  function isFirstMove(): boolean {
    return !currentUpdateUI.state;
  }

  function yourPlayerIndex() {
    return currentUpdateUI.yourPlayerIndex;
  }

  function isComputer(): boolean {
    let playerInfo = currentUpdateUI.playersInfo[currentUpdateUI.yourPlayerIndex];
    // In community games, playersInfo is [].
    return playerInfo && playerInfo.playerId === '';
  }

  function isComputerTurn(): boolean {
    return isMyTurn() && isComputer();
  }

  function isHumanTurn(): boolean {
    return isMyTurn() && !isComputer();
  }

  function isMyTurn(): boolean {
    return currentUpdateUI.turnIndex >= 0 && // game is ongoing
      currentUpdateUI.yourPlayerIndex === currentUpdateUI.turnIndex; // it's my turn
  }

  function isGameOver(): boolean {
    return currentUpdateUI.turnIndex == -1;
  }
}

angular.module('myApp', ['gameServices'])
  .run(['$rootScope', '$timeout',
    function ($rootScope: angular.IScope, $timeout: angular.ITimeoutService) {
      $rootScope['game'] = game;
      game.init($rootScope, $timeout);
    }]);
