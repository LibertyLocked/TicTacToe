;
var GameplayConsts;
(function (GameplayConsts) {
    GameplayConsts.CollisionCategoryCue = 0x0001;
    GameplayConsts.CollisionCategoryColoredBalls = 0x0002;
    GameplayConsts.CollisionMaskAllBalls = 0x0003;
    GameplayConsts.CollisionMaskMouse = 0x0000;
    GameplayConsts.BallMass = 0.2;
    GameplayConsts.BallRestitution = 0.92;
    GameplayConsts.BallFrictionAir = 0.012;
    GameplayConsts.BallFriction = 0.01;
    GameplayConsts.BorderThicknessOut = 50;
    GameplayConsts.BallTextureSize = 128; // ball textures are 128x128
    GameplayConsts.ClickDistanceLimit = 150;
    GameplayConsts.ClickForceMax = 0.018;
    GameplayConsts.ClickHoldTime = 1500;
})(GameplayConsts || (GameplayConsts = {}));
;
var game;
(function (game) {
    // the game stage
    var GameStage;
    (function (GameStage) {
        GameStage[GameStage["PlacingCue"] = 1] = "PlacingCue";
        GameStage[GameStage["Aiming"] = 2] = "Aiming";
        GameStage[GameStage["CueHit"] = 3] = "CueHit";
        GameStage[GameStage["Finalized"] = 4] = "Finalized";
    })(GameStage || (GameStage = {}));
    game.$rootScope = null;
    game.$timeout = null;
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.currentUpdateUI = null;
    game.yourPlayerInfo = null;
    var translate = gamingPlatform.translate;
    var resizeGameAreaService = gamingPlatform.resizeGameAreaService;
    var gameService = gamingPlatform.gameService;
    var log = gamingPlatform.log;
    // using shortcuts
    var Engine = Matter.Engine, Render = Matter.Render, MouseConstraint = Matter.MouseConstraint, Mouse = Matter.Mouse, World = Matter.World, Bodies = Matter.Bodies;
    // resources
    var _stickImg; // cue stick png image
    // Globals
    var _engine;
    var _world;
    var _render;
    var _mouse;
    var _mouseDistance = 0; // mouse distance from cue ball
    var _mouseDownTime = 0;
    var _lastUpdate; // last engine update time
    var _gameStage;
    var _firstTouchBall = null;
    var _pocketedBalls = [];
    // view models
    var cueBallModel;
    var eightBallModel;
    var solidBallModels = [];
    var stripedBallModels = [];
    function resetGlobals() {
        _mouseDistance = 0;
        _mouseDownTime = 0;
        _lastUpdate = new Date().getTime();
        _firstTouchBall = null;
        _pocketedBalls = [];
        solidBallModels = [];
        stripedBallModels = [];
        if (_engine)
            Engine.clear(_engine);
        if (_world)
            World.clear(_world, false);
        if (_render)
            Render.stop(_render);
    }
    function shootClick(cueBall) {
        var forceFraction = getForceFraction(_mouseDownTime);
        var force = Math.abs(forceFraction * GameplayConsts.ClickForceMax);
        console.log("force mag: ", force);
        console.log("mouse distance: ", _mouseDistance);
        Matter.Body.applyForce(cueBall, cueBall.position, {
            x: force * Math.cos(cueBall.angle),
            y: force * Math.sin(cueBall.angle)
        });
        _engine.enableSleeping = true;
    }
    function isWorldSleeping(world) {
        var bodies = Matter.Composite.allBodies(world);
        var sleeping = bodies.filter(function (body) { return body.isSleeping; });
        return bodies.length === sleeping.length;
    }
    function getForceFraction(mouseDownTime) {
        return 1 - Math.abs(mouseDownTime % (GameplayConsts.ClickHoldTime * 2) - GameplayConsts.ClickHoldTime)
            / GameplayConsts.ClickHoldTime;
    }
    function handleBallBallCollision(bodyA, bodyB) {
        if (!_firstTouchBall) {
            var ballA = getBallModelFromBody(bodyA).Ball;
            var ballB = getBallModelFromBody(bodyB).Ball;
            if (ballA.BallType != BallType.Cue && ballB.BallType == BallType.Cue) {
                // B is cue
                _firstTouchBall = ballA;
            }
            else if (ballA.BallType == BallType.Cue && ballB.BallType != BallType.Cue) {
                // A is cue
                _firstTouchBall = ballB;
            }
        }
    }
    function handlePocketBallCollision(pocketBody, ballBody) {
        // destroy the ball body
        World.remove(_world, ballBody);
        // create the ball model and add to pocketed balls
        var theBall = getBallModelFromBody(ballBody).Ball;
        theBall.Pocketed = true;
        _pocketedBalls.push(theBall);
    }
    // helper method to get distance between 2 vectors
    function distanceBetweenVectors(vec1, vec2) {
        var xsq = Math.pow(vec1.x - vec2.x, 2);
        var ysq = Math.pow(vec1.y - vec2.y, 2);
        return Math.sqrt(xsq + ysq);
    }
    // creates cue ball view-model from Ball
    function createCueBallModel(cueBall) {
        var newCueModel = {
            Ball: cueBall, Body: Bodies.circle(cueBall.Position.X, cueBall.Position.Y, cueBall.Radius, {
                isStatic: false,
                collisionFilter: { category: GameplayConsts.CollisionCategoryCue, mask: GameplayConsts.CollisionMaskAllBalls },
                restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFrictionAir, friction: GameplayConsts.BallFriction,
                render: { fillStyle: 'white', strokeStyle: 'black' },
                mass: GameplayConsts.BallMass,
                label: 'Ball 0',
            })
        };
        return newCueModel;
    }
    function createBallModel(ball, collisionCategory, collisionMask) {
        var textureScale = ball.Radius * 2 / GameplayConsts.BallTextureSize;
        var newBallModel = {
            Ball: ball, Body: Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, {
                isStatic: false,
                collisionFilter: { category: collisionCategory, mask: collisionMask },
                restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFrictionAir, friction: GameplayConsts.BallFriction,
                render: { sprite: { texture: 'imgs/' + ball.Number + '.png', xScale: textureScale, yScale: textureScale } },
                mass: GameplayConsts.BallMass,
                label: 'Ball ' + ball.Number,
            })
        };
        return newBallModel;
    }
    // constructs a rectangle body as border, from pocket1 to pocket2
    function createBorderBody(topLeftCorner, bottomRightCorner, leftOrRight, leftOrTop) {
        var x, y, width, height;
        var thicknessOffset = (GameplayConsts.BorderThicknessOut) / 2;
        if (leftOrRight) {
            y = _render.canvas.height / 2;
            height = _render.canvas.height;
            width = GameplayConsts.BorderThicknessOut;
            x = leftOrTop ? topLeftCorner.x - thicknessOffset : bottomRightCorner.x + thicknessOffset;
        }
        else {
            y = leftOrTop ? topLeftCorner.y - thicknessOffset : bottomRightCorner.y + thicknessOffset;
            x = _render.canvas.width / 2;
            height = GameplayConsts.BorderThicknessOut;
            width = _render.canvas.width;
        }
        var body = Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            render: { fillStyle: '#825201', strokeStyle: 'black' },
            label: 'Border',
        });
        return body;
    }
    // gets the view-model associated with the body
    function getBallModelFromBody(ballBody) {
        if (ballBody.label.indexOf('Ball') < 0)
            return null; // not a ball
        var ballNumber = Number(ballBody.label.split(' ')[1]);
        if (ballNumber == 0) {
            return cueBallModel;
        }
        else if (ballNumber == 8) {
            return eightBallModel;
        }
        else if (ballNumber > 8) {
            return stripedBallModels[ballNumber - 9];
        }
        else {
            return solidBallModels[ballNumber - 1];
        }
    }
    function syncBallModelPositions() {
        cueBallModel.Ball.Position = { X: cueBallModel.Body.position.x, Y: cueBallModel.Body.position.y };
        eightBallModel.Ball.Position = { X: eightBallModel.Body.position.x, Y: eightBallModel.Body.position.y };
        for (var _i = 0, solidBallModels_1 = solidBallModels; _i < solidBallModels_1.length; _i++) {
            var ballModel = solidBallModels_1[_i];
            ballModel.Ball.Position = { X: ballModel.Body.position.x, Y: ballModel.Body.position.y };
        }
        for (var _a = 0, stripedBallModels_1 = stripedBallModels; _a < stripedBallModels_1.length; _a++) {
            var ballModel = stripedBallModels_1[_a];
            ballModel.Ball.Position = { X: ballModel.Body.position.x, Y: ballModel.Body.position.y };
        }
    }
    // clamps the position within board bounds
    function clampWithinBounds(pos, radius) {
        var x = Math.min(game._gameState.PoolBoard.Pockets[5].Position.X - radius, Math.max(pos.x, game._gameState.PoolBoard.Pockets[0].Position.X + radius));
        var y = Math.min(game._gameState.PoolBoard.Pockets[5].Position.Y - radius, Math.max(pos.y, game._gameState.PoolBoard.Pockets[0].Position.Y + radius));
        return { x: x, y: y };
    }
    function getClosestBallModel(pos, targetBodies) {
        var minDist = Number.POSITIVE_INFINITY;
        var minDistModel = null;
        for (var _i = 0, targetBodies_1 = targetBodies; _i < targetBodies_1.length; _i++) {
            var body = targetBodies_1[_i];
            var ballModel = getBallModelFromBody(body);
            if (!ballModel)
                continue;
            var dist = distanceBetweenVectors(ballModel.Body.position, pos);
            if (dist <= minDist) {
                minDist = dist;
                minDistModel = ballModel;
            }
        }
        return minDistModel;
    }
    // moves the cue ball and recreates the cue ball body and model
    function moveCueBall(pos, useStartLine) {
        // do not allow placing inside another body
        var bodies = Matter.Query.point(Matter.Composite.allBodies(_world), pos);
        if (bodies.length > 0)
            return false;
        // do not allow placing too close to another body
        var closestBallModel = getClosestBallModel(pos, _world.bodies);
        if (closestBallModel && distanceBetweenVectors(closestBallModel.Body.position, pos) <=
            closestBallModel.Ball.Radius + cueBallModel.Ball.Radius)
            return false;
        World.remove(_world, cueBallModel.Body);
        var y;
        if (useStartLine) {
            y = game._gameState.PoolBoard.StartLine;
        }
        else {
            y = pos.y;
        }
        // clamp within bounds
        var clampedPos = clampWithinBounds({ x: pos.x, y: y }, cueBallModel.Ball.Radius);
        game._gameState.CueBall.Position = { X: clampedPos.x, Y: clampedPos.y };
        cueBallModel = createCueBallModel(game._gameState.CueBall);
        World.add(_world, cueBallModel.Body);
        game._gameState.CueBall.Pocketed = false;
        return true;
    }
    function isMouseWithinShootRange() {
        return _mouseDistance <= GameplayConsts.ClickDistanceLimit &&
            _mouseDistance >= cueBallModel.Ball.Radius;
    }
    function finalize() {
        // send the move over network here
        console.log("player's turn is done");
        // sync the model positions
        syncBallModelPositions();
        // create return state
        var theReturnState = {
            PocketedBalls: _pocketedBalls,
            TouchedBall: _firstTouchBall,
        };
        // create IState
        var solidBalls = [];
        var stripedBalls = [];
        for (var _i = 0, solidBallModels_2 = solidBallModels; _i < solidBallModels_2.length; _i++) {
            var ballModel = solidBallModels_2[_i];
            solidBalls.push(ballModel.Ball);
        }
        for (var _a = 0, stripedBallModels_2 = stripedBallModels; _a < stripedBallModels_2.length; _a++) {
            var ballModel = stripedBallModels_2[_a];
            stripedBalls.push(ballModel.Ball);
        }
        var finalState = {
            SolidBalls: solidBalls,
            StripedBalls: stripedBalls,
            EightBall: eightBallModel.Ball,
            CueBall: cueBallModel.Ball,
            CanMoveCueBall: game._gameState.CanMoveCueBall,
            PoolBoard: game._gameState.PoolBoard,
            FirstMove: game._gameState.FirstMove,
            Player1Color: game._gameState.Player1Color,
            Player2Color: game._gameState.Player2Color,
            DeltaBalls: theReturnState,
        };
        console.log(finalState);
        var newMove = GameLogic.createMove(finalState, game.currentUpdateUI.turnIndex);
        console.log(newMove);
        // send the move over network
        gameService.makeMove(newMove, null);
    }
    // function getRaycastPoint(bodies: Matter.Body[], start: Matter.Vector, r: Matter.Vector, dist: number): RaycastResult {
    //   var normRay = Matter.Vector.normalise(r);
    //   var ray = normRay;
    //   var point = Matter.Vector.add(ray, start);
    //   for (var i = 0; i < dist; i++) {
    //     ray = Matter.Vector.mult(normRay, i);
    //     ray = Matter.Vector.add(start, ray);
    //     var bod = Matter.Query.point(bodies, ray)[0];
    //     if (bod) {
    //       return { Point: ray, Body: bod };
    //     }
    //   }
    //   return null;
    // }
    function drawGuideLine(context, length, width, style, alpha) {
        var cueBody = cueBallModel.Body;
        var startPoint = cueBody.position;
        var endPoint = {
            x: cueBody.position.x + length * Math.cos(cueBody.angle),
            y: cueBody.position.y + length * Math.sin(cueBody.angle)
        };
        // raycast
        var direction = { x: Math.cos(cueBody.angle) * cueBallModel.Ball.Radius, y: Math.sin(cueBody.angle) * cueBallModel.Ball.Radius };
        var raycastStart = { x: startPoint.x + direction.x, y: startPoint.y + direction.y };
        var collisions = Matter.Query.ray(_world.bodies, raycastStart, endPoint, cueBallModel.Ball.Radius * 2);
        var collidedBodies = [];
        for (var _i = 0, collisions_1 = collisions; _i < collisions_1.length; _i++) {
            var collision = collisions_1[_i];
            collidedBodies.push(collision.bodyA);
        }
        var minDistModel = getClosestBallModel(raycastStart, collidedBodies);
        if (minDistModel) {
            var dist = distanceBetweenVectors(cueBallModel.Body.position, minDistModel.Body.position);
            endPoint = {
                x: cueBody.position.x + dist * Math.cos(cueBody.angle),
                y: cueBody.position.y + dist * Math.sin(cueBody.angle)
            };
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
            context.fillText(BallType[minDistModel.Ball.BallType] + " " + minDistModel.Ball.Number, minDistModel.Body.position.x, minDistModel.Body.position.y - minDistModel.Ball.Radius);
            context.restore();
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
        // draw the guideline
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
    function drawGuideCircle(context) {
        context.save();
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.globalAlpha = 0.3;
        context.setLineDash([Math.PI * 5, Math.PI * 10]);
        context.beginPath();
        var angleOffset = new Date().getTime() * 0.0004 % (2 * Math.PI);
        context.arc(cueBallModel.Body.position.x, cueBallModel.Body.position.y, GameplayConsts.ClickDistanceLimit, angleOffset, 2 * Math.PI + angleOffset);
        context.stroke();
        context.restore();
    }
    function drawCueStick(context) {
        var cueBody = cueBallModel.Body;
        context.save();
        context.translate(cueBody.position.x, cueBody.position.y);
        context.rotate(cueBody.angle);
        context.drawImage(_stickImg, -_stickImg.width - _mouseDistance, -_stickImg.height / 2);
        context.restore();
    }
    function drawHightlightBalls(context) {
        var playerColor = game.currentUpdateUI.yourPlayerIndex === 0 ? game._gameState.Player1Color : game._gameState.Player2Color;
        var ballModelsToHighlight = [];
        if (playerColor == AssignedBallType.Solids) {
            ballModelsToHighlight = solidBallModels;
        }
        else if (playerColor == AssignedBallType.Stripes) {
            ballModelsToHighlight = stripedBallModels;
        }
        else if (playerColor == AssignedBallType.Eight) {
            ballModelsToHighlight.push(eightBallModel);
        }
        if (!ballModelsToHighlight)
            return;
        context.save();
        context.strokeStyle = "gold";
        context.lineWidth = 3;
        context.globalAlpha = 0.5 * (Math.sin(new Date().getTime() * 0.005) + 1) / 2;
        for (var _i = 0, ballModelsToHighlight_1 = ballModelsToHighlight; _i < ballModelsToHighlight_1.length; _i++) {
            var model = ballModelsToHighlight_1[_i];
            if (model.Ball.Pocketed)
                continue;
            context.beginPath();
            context.arc(model.Body.position.x, model.Body.position.y, cueBallModel.Ball.Radius, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
        }
        context.restore();
    }
    function drawForceCircle(context) {
        context.save();
        context.strokeStyle = "white"; // outline
        context.lineWidth = 12;
        context.globalAlpha = 0.4;
        context.beginPath();
        context.arc(cueBallModel.Body.position.x, cueBallModel.Body.position.y, 2.5 * cueBallModel.Ball.Radius, -Math.PI / 2, 2 * Math.PI * getForceFraction(_mouseDownTime) - Math.PI / 2);
        context.stroke();
        context.strokeStyle = "red";
        context.lineWidth = 8;
        context.globalAlpha = 0.6;
        context.beginPath();
        context.arc(cueBallModel.Body.position.x, cueBallModel.Body.position.y, 2.5 * cueBallModel.Ball.Radius, -Math.PI / 2, 2 * Math.PI * getForceFraction(_mouseDownTime) - Math.PI / 2);
        context.stroke();
        context.restore();
    }
    function drawGameHUD(context) {
        context.save();
        var fontSize = 16;
        context.font = fontSize + "px Arial";
        context.textBaseline = "top";
        // text on the left
        var textLeft = "";
        switch (_gameStage) {
            case GameStage.PlacingCue:
                textLeft = "Click to place cue ball";
                context.font = fontSize * (1 + 0.1 * (Math.sin(new Date().getTime() * 0.005) + 1)) + "px Arial";
                break;
            case GameStage.Aiming:
                textLeft = "Drag behind cue ball to aim";
                break;
            case GameStage.CueHit:
                if (_firstTouchBall)
                    textLeft = "First touch: " + _firstTouchBall.Number;
                break;
            case GameStage.Finalized:
                if (!isGameOver())
                    textLeft = "Opponent's turn!";
                else
                    textLeft = game.currentUpdateUI.endMatchScores[yourPlayerIndex()] == 0 ? "You lose!" : "You win!";
                break;
        }
        context.fillStyle = "yellow";
        context.textAlign = "left";
        context.fillText(textLeft, 0, 0);
        // text on the right
        context.font = fontSize + "px Arial";
        var textRight = "";
        if ((_gameStage == GameStage.PlacingCue || _gameStage == GameStage.Aiming || _gameStage == GameStage.Finalized)) {
            var designatedGroup = '';
            if (yourPlayerIndex() == 0)
                designatedGroup = AssignedBallType[game._gameState.Player1Color];
            else
                designatedGroup = AssignedBallType[game._gameState.Player2Color];
            textRight = "Designated group: " + designatedGroup;
        }
        if (_gameStage == GameStage.CueHit && _pocketedBalls.length != 0) {
            textRight = "Pocketed: ";
            for (var _i = 0, _pocketedBalls_1 = _pocketedBalls; _i < _pocketedBalls_1.length; _i++) {
                var ball = _pocketedBalls_1[_i];
                textRight += ball.Number + ",";
            }
        }
        context.fillStyle = "white";
        context.textAlign = "right";
        context.fillText(textRight, context.canvas.width, 0);
        // show mouse coords on screen bottom
        if (_mouse) {
            context.font = fontSize + "px Arial";
            var coordText = "(" + _mouse.position.x.toFixed(0) + "," + _mouse.position.y.toFixed(0) + ")";
            context.textAlign = "center";
            context.textBaseline = "bottom";
            context.fillText(coordText, context.canvas.width / 2, context.canvas.height);
        }
        context.restore();
    }
    function init($rootScope_, $timeout_) {
        game.$rootScope = $rootScope_;
        game.$timeout = $timeout_;
        registerServiceWorker();
        translate.setTranslations({});
        translate.setLanguage('en');
        var dummyState = GameLogic.getInitialState();
        resizeGameAreaService.setWidthToHeight(dummyState.PoolBoard.Width / dummyState.PoolBoard.Height);
        gameService.setGame({
            updateUI: updateUI,
            getStateForOgImage: null,
        });
    }
    game.init = init;
    function registerServiceWorker() {
        // I prefer to use appCache over serviceWorker
        // (because iOS doesn't support serviceWorker, so we have to use appCache)
        // I've added this code for a future where all browsers support serviceWorker (so we can deprecate appCache!)
        if (!window.applicationCache && 'serviceWorker' in navigator) {
            var n = navigator;
            gamingPlatform.log.log('Calling serviceWorker.register');
            n.serviceWorker.register('service-worker.js').then(function (registration) {
                log.log('ServiceWorker registration successful with scope: ', registration.scope);
            }).catch(function (err) {
                log.log('ServiceWorker registration failed: ', err);
            });
        }
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        resetGlobals();
        // get the game state from server
        game.currentUpdateUI = params;
        game._gameState = params.state;
        if (isFirstMove()) {
            game._gameState = GameLogic.getInitialState();
        }
        // set game stage
        if (isMyTurn()) {
            // if it's my turn, set state to placing cue or aiming
            if (game._gameState.CanMoveCueBall) {
                _gameStage = GameStage.PlacingCue;
            }
            else {
                _gameStage = GameStage.Aiming;
            }
        }
        else {
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
                height: game._gameState.PoolBoard.Height,
                width: game._gameState.PoolBoard.Width,
            }
        });
        _engine.world.gravity.y = 0;
        var renderOptions = _render.options;
        renderOptions.wireframes = false;
        renderOptions.background = 'green';
        // create borders
        var pockets = game._gameState.PoolBoard.Pockets;
        var topLeftCorner = { x: pockets[0].Position.X, y: pockets[0].Position.Y };
        var bottomRightCorner = { x: pockets[5].Position.X, y: pockets[5].Position.Y };
        World.add(_world, [
            createBorderBody(topLeftCorner, bottomRightCorner, false, true),
            createBorderBody(topLeftCorner, bottomRightCorner, true, true),
            createBorderBody(topLeftCorner, bottomRightCorner, false, false),
            createBorderBody(topLeftCorner, bottomRightCorner, true, false),
        ]);
        // create pockets
        for (var _i = 0, _a = game._gameState.PoolBoard.Pockets; _i < _a.length; _i++) {
            var pocket = _a[_i];
            World.add(_world, Bodies.circle(pocket.Position.X, pocket.Position.Y, pocket.Radius, {
                isStatic: true,
                render: { fillStyle: 'black' },
                label: 'Pocket'
            }));
        }
        // create ball bodies and body models
        var textureScale = game._gameState.CueBall.Radius * 2 / GameplayConsts.BallTextureSize;
        // cue ball
        cueBallModel = createCueBallModel(game._gameState.CueBall);
        if (!game._gameState.CueBall.Pocketed && !game._gameState.CanMoveCueBall)
            World.add(_world, cueBallModel.Body);
        // eight ball
        eightBallModel = createBallModel(game._gameState.EightBall, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
        if (!game._gameState.EightBall.Pocketed)
            World.add(_world, eightBallModel.Body);
        // solid balls
        for (var _b = 0, _c = game._gameState.SolidBalls; _b < _c.length; _b++) {
            var ball = _c[_b];
            var ballModel = createBallModel(ball, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
            if (!ball.Pocketed)
                World.add(_world, ballModel.Body);
            solidBallModels.push(ballModel);
        }
        // striped balls
        for (var _d = 0, _e = game._gameState.StripedBalls; _d < _e.length; _d++) {
            var ball = _e[_d];
            var ballModel = createBallModel(ball, GameplayConsts.CollisionCategoryColoredBalls, GameplayConsts.CollisionMaskAllBalls);
            if (!ball.Pocketed)
                World.add(_world, ballModel.Body);
            stripedBallModels.push(ballModel);
        }
        // add mouse control
        _mouse = Mouse.create(_render.canvas);
        var mouseConstraint = MouseConstraint.create(_engine, { mouse: _mouse });
        mouseConstraint.collisionFilter.mask = GameplayConsts.CollisionMaskMouse;
        World.add(_world, mouseConstraint);
        // EVENT: shoot cue ball on mouseup
        Matter.Events.on(mouseConstraint, 'mouseup', function (event) {
            var mouseUpPosition = event.mouse.mouseupPosition;
            if (_gameStage == GameStage.Aiming /* && isHumanTurn() */) {
                // only shoot cue ball when the mouse is around the cue ball
                if (isMouseWithinShootRange()) {
                    _gameStage = GameStage.CueHit;
                    shootClick(cueBallModel.Body);
                }
            }
            else if (_gameStage == GameStage.PlacingCue) {
                // place the cue ball at mouse position
                // recreate the cue ball model (body)
                if (moveCueBall(mouseUpPosition, game._gameState.FirstMove)) {
                    _gameStage = GameStage.Aiming;
                }
            }
            _mouseDownTime = 0;
        });
        // EVENT: handle pocket and ball collision
        Matter.Events.on(_engine, 'collisionStart', function (event) {
            // only handle collisions after player has hit the cue ball
            if (_gameStage != GameStage.CueHit)
                return;
            for (var _i = 0, _a = event.pairs; _i < _a.length; _i++) {
                var pair = _a[_i];
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
            var cuePosition = cueBallModel.Body.position;
            var horizontalDistance = cuePosition.x - _mouse.position.x;
            var verticalDistance = cuePosition.y - _mouse.position.y;
            var angle = Math.atan2(verticalDistance, horizontalDistance);
            _mouseDistance = distanceBetweenVectors(cuePosition, _mouse.position);
            // set cue ball angle if aiming
            if (_gameStage == GameStage.Aiming) {
                Matter.Body.setAngle(cueBallModel.Body, angle);
            }
            // draw the guidelines, cue stick, guide circle
            if (_gameStage == GameStage.Aiming) {
                if (isMouseWithinShootRange()) {
                    drawGuideLine(_render.context, 1000, 4, "white", 0.4); // directional guideline
                    drawCueStick(_render.context);
                    if (_mouse.button >= 0) {
                        drawForceCircle(_render.context);
                    }
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
            // accumulate mouse down time
            var thisUpdate = new Date().getTime();
            if (_mouse.button >= 0) {
                // this value is reset on mouseup
                _mouseDownTime += thisUpdate - _lastUpdate;
            }
            _lastUpdate = thisUpdate;
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
    game.updateUI = updateUI;
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
    function isFirstMove() {
        return !game.currentUpdateUI.state;
    }
    function yourPlayerIndex() {
        return game.currentUpdateUI.yourPlayerIndex;
    }
    function isComputer() {
        var playerInfo = game.currentUpdateUI.playersInfo[game.currentUpdateUI.yourPlayerIndex];
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
        return game.currentUpdateUI.turnIndex >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.turnIndex; // it's my turn
    }
    function isGameOver() {
        return game.currentUpdateUI.turnIndex == -1;
    }
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(['$rootScope', '$timeout',
    function ($rootScope, $timeout) {
        $rootScope['game'] = game;
        game.init($rootScope, $timeout);
    }]);
//# sourceMappingURL=game.js.map