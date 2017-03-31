;
// the game stage
var GameStage;
(function (GameStage) {
    GameStage[GameStage["PlacingCue"] = 1] = "PlacingCue";
    GameStage[GameStage["Aiming"] = 2] = "Aiming";
    GameStage[GameStage["CueHit"] = 3] = "CueHit";
    GameStage[GameStage["Finalized"] = 4] = "Finalized";
})(GameStage || (GameStage = {}));
var GameplayConsts;
(function (GameplayConsts) {
    GameplayConsts.CollisionCategoryCue = 0x0001;
    GameplayConsts.CollisionCategoryNormalBalls = 0x0002;
    GameplayConsts.CollisionMaskAllBalls = 0x0003;
    GameplayConsts.CollisionMaskMouse = 0x0000;
    GameplayConsts.BallRestitution = 0.9;
    GameplayConsts.BallFriction = 0.01;
    GameplayConsts.BorderThickness = 16;
    // export const BorderClearance = 10;
    GameplayConsts.BallTextureSize = 128; // ball textures are 128x128
    GameplayConsts.ClickDistanceLimit = 150;
    GameplayConsts.ClickForceMax = 0.04;
})(GameplayConsts || (GameplayConsts = {}));
;
var game;
(function (game) {
    game.$rootScope = null;
    game.$timeout = null;
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.currentUpdateUI = null;
    game.state = null;
    game.yourPlayerInfo = null;
    var translate = gamingPlatform.translate;
    var resizeGameAreaService = gamingPlatform.resizeGameAreaService;
    var gameService = gamingPlatform.gameService;
    var log = gamingPlatform.log;
    // using shortcuts
    var Engine = Matter.Engine, Render = Matter.Render, MouseConstraint = Matter.MouseConstraint, Mouse = Matter.Mouse, World = Matter.World, Bodies = Matter.Bodies;
    // resources
    var _stickImg; // cue stick png image
    // The saved game state
    var _gameState;
    // Globals
    var _engine;
    var _world;
    var _render;
    var _mouse;
    var _topLeftCorner; // used for bounds
    var _bottomRightCorner;
    var _mouseDistance = 0; // mouse distance from cue ball
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
        var forcePosition = {
            x: cueBall.position.x + 1.0 * Math.cos(cueBall.angle),
            y: cueBall.position.y + 1.0 * Math.sin(cueBall.angle)
        };
        var force = _mouseDistance / GameplayConsts.ClickDistanceLimit * GameplayConsts.ClickForceMax;
        console.log("force pos: ", forcePosition);
        console.log("force mag: ", force);
        console.log("render len: ", _mouseDistance);
        Matter.Body.applyForce(cueBall, forcePosition, {
            x: force * Math.cos(cueBall.angle),
            y: force * Math.sin(cueBall.angle)
        });
        _engine.enableSleeping = true;
    }
    function isWorldSleeping(world) {
        var bodies = Matter.Composite.allBodies(world);
        var sleeping = bodies.filter(function (body) { return body.isSleeping; });
        var isWorldSleeping = bodies.length === sleeping.length;
        return isWorldSleeping;
    }
    function handleBallBallCollision(bodyA, bodyB) {
        if (!_firstTouchBall) {
            var ballNumberA = Number(bodyA.label.split(' ')[1]);
            var ballNumberB = Number(bodyB.label.split(' ')[1]);
            if (ballNumberA != 0 && ballNumberB == 0) {
                // B is cue
                _firstTouchBall = getBallModelFromBody(bodyA).Ball;
            }
            else if (ballNumberA == 0 && ballNumberB != 0) {
                // A is cue
                _firstTouchBall = getBallModelFromBody(bodyB).Ball;
            }
        }
    }
    function handlePocketBallCollision(pocketBody, ballBody) {
        // destroy the ball body
        World.remove(_world, ballBody);
        // get the ball number
        var ballNumber = Number(ballBody.label.split(' ')[1]);
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
    // creates cue ball view-model from Ball. does not add to world
    function createCueBallModel(cueBall) {
        var newCueModel = {
            Ball: cueBall, Body: Bodies.circle(cueBall.Position.X, cueBall.Position.Y, cueBall.Radius, {
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
    function createBorderBody(pocket1, pocket2, vertical) {
        var x, y, width, height;
        if (vertical) {
            x = pocket1.Position.X;
            y = (pocket1.Position.Y + pocket2.Position.Y) / 2.0;
            width = GameplayConsts.BorderThickness;
            height = pocket2.Position.Y - pocket1.Position.Y - (pocket1.Radius - pocket2.Radius) / 2;
        }
        else {
            x = (pocket1.Position.X + pocket2.Position.X) / 2.0;
            y = pocket1.Position.Y;
            width = pocket2.Position.X - pocket1.Position.X - (pocket1.Radius - pocket2.Radius) / 2;
            height = GameplayConsts.BorderThickness;
        }
        return Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            render: { fillStyle: '#825201', strokeStyle: 'black' },
            label: 'Border'
        });
    }
    // gets the view-model associated with the body
    function getBallModelFromBody(ballBody) {
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
    function clampWithinBounds(pos) {
        var x = Math.min(_bottomRightCorner.x - GameplayConsts.BorderThickness, Math.max(pos.x, _topLeftCorner.x + GameplayConsts.BorderThickness));
        var y = Math.min(_bottomRightCorner.y - GameplayConsts.BorderThickness, Math.max(pos.y, _topLeftCorner.y + GameplayConsts.BorderThickness));
        return { x: x, y: y };
    }
    // moves the cue ball and recreates the cue ball body and model
    function moveCueBall(pos, useStartLine) {
        World.remove(_world, cueBallModel.Body);
        var y;
        if (useStartLine) {
            y = _gameState.PoolBoard.StartLine;
        }
        else {
            y = pos.y;
        }
        // clamp within bounds
        var clampedPos = clampWithinBounds({ x: pos.x, y: y });
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
            CanMoveCueBall: _gameState.CanMoveCueBall,
            PoolBoard: _gameState.PoolBoard,
            FirstMove: _gameState.FirstMove,
            Player1Color: _gameState.Player1Color,
            Player2Color: _gameState.Player2Color,
            DeltaBalls: theReturnState,
        };
        console.log(finalState);
        var newMove = GameLogic.createMove(finalState, game.currentUpdateUI.turnIndex);
        console.log(newMove);
        // send the move over network
        gameService.makeMove(newMove, null);
    }
    function drawGuideLine(context, length, width, style, alpha) {
        var cueBody = cueBallModel.Body;
        var startPoint = { x: cueBody.position.x, y: cueBody.position.y };
        var endPoint = {
            x: cueBody.position.x + length * Math.cos(cueBody.angle),
            y: cueBody.position.y + length * Math.sin(cueBody.angle)
        };
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
        context.arc(cueBallModel.Body.position.x, cueBallModel.Body.position.y, GameplayConsts.ClickDistanceLimit, 0, 2 * Math.PI);
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
    function drawGameHUD(context) {
        context.save();
        var fontSize = 16;
        context.font = "16px Arial";
        context.fillStyle = "white";
        // text on the left
        var textLeft = "";
        switch (_gameStage) {
            case GameStage.PlacingCue:
                textLeft = "Click to place cue ball";
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
        context.fillText(textLeft, 0, fontSize);
        // text on the right
        var textRight = "";
        if ((_gameStage == GameStage.PlacingCue || _gameStage == GameStage.Aiming || _gameStage == GameStage.Finalized)) {
            var designatedGroup = '';
            if (yourPlayerIndex() == 0)
                designatedGroup = AssignedBallType[_gameState.Player1Color];
            else
                designatedGroup = AssignedBallType[_gameState.Player2Color];
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
        context.fillText(textRight, context.canvas.width, fontSize);
        // show mouse coords on screen bottom
        if (_mouse) {
            var coordText = "(" + _mouse.position.x.toFixed(0) + "," + _mouse.position.y.toFixed(0) + ")";
            context.textAlign = "center";
            context.fillText(coordText, context.canvas.width / 2, context.canvas.height - fontSize);
        }
        context.restore();
    }
    // ========================================
    // multiplayer gaming platform stuff
    // ========================================
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
        _gameState = params.state;
        if (isFirstMove()) {
            _gameState = GameLogic.getInitialState();
        }
        // set game stage
        if (isMyTurn()) {
            // if it's my turn, set state to placing cue or aiming
            if (_gameState.CanMoveCueBall) {
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
                height: _gameState.PoolBoard.Height,
                width: _gameState.PoolBoard.Width,
            }
        });
        _engine.world.gravity.y = 0;
        var renderOptions = _render.options;
        renderOptions.wireframes = false;
        renderOptions.background = 'green';
        // create borders
        var pockets = _gameState.PoolBoard.Pockets;
        World.add(_world, [
            createBorderBody(pockets[0], pockets[3], false),
            createBorderBody(pockets[2], pockets[5], false),
            createBorderBody(pockets[1], pockets[0], true),
            createBorderBody(pockets[1], pockets[2], true),
            createBorderBody(pockets[4], pockets[3], true),
            createBorderBody(pockets[4], pockets[5], true),
        ]);
        _topLeftCorner = { x: pockets[0].Position.X, y: pockets[0].Position.Y };
        _bottomRightCorner = { x: pockets[5].Position.X, y: pockets[5].Position.Y };
        // create pockets
        for (var _i = 0, _a = _gameState.PoolBoard.Pockets; _i < _a.length; _i++) {
            var pocket = _a[_i];
            World.add(_world, Bodies.circle(pocket.Position.X, pocket.Position.Y, pocket.Radius, {
                isStatic: true,
                render: { fillStyle: 'black' },
                label: 'Pocket'
            }));
        }
        // create ball bodies and body models
        var textureScale = _gameState.CueBall.Radius * 2 / GameplayConsts.BallTextureSize;
        // cue ball
        cueBallModel = createCueBallModel(_gameState.CueBall);
        if (!_gameState.CueBall.Pocketed && !_gameState.CanMoveCueBall)
            World.add(_world, cueBallModel.Body);
        // eight ball
        eightBallModel = {
            Ball: _gameState.EightBall,
            Body: Bodies.circle(_gameState.EightBall.Position.X, _gameState.EightBall.Position.Y, _gameState.EightBall.Radius, {
                isStatic: false,
                collisionFilter: { category: GameplayConsts.CollisionCategoryCue, mask: GameplayConsts.CollisionMaskAllBalls },
                restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
                render: { sprite: { texture: 'imgs/8.png', xScale: textureScale, yScale: textureScale } },
                label: 'Ball 8'
            })
        };
        if (!_gameState.EightBall.Pocketed)
            World.add(_world, eightBallModel.Body);
        // solid balls
        for (var _b = 0, _c = _gameState.SolidBalls; _b < _c.length; _b++) {
            var ball = _c[_b];
            var theBallBody = Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, {
                isStatic: false,
                collisionFilter: { category: GameplayConsts.CollisionCategoryNormalBalls, mask: GameplayConsts.CollisionMaskAllBalls },
                restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
                render: { sprite: { texture: 'imgs/' + String(ball.Number) + '.png', xScale: textureScale, yScale: textureScale } },
                label: 'Ball ' + String(ball.Number)
            });
            if (!ball.Pocketed)
                World.add(_world, theBallBody);
            solidBallModels.push({ Ball: ball, Body: theBallBody });
        }
        // striped balls
        for (var _d = 0, _e = _gameState.StripedBalls; _d < _e.length; _d++) {
            var ball = _e[_d];
            var theBallBody = Bodies.circle(ball.Position.X, ball.Position.Y, ball.Radius, {
                isStatic: false,
                collisionFilter: { category: GameplayConsts.CollisionCategoryNormalBalls, mask: GameplayConsts.CollisionMaskAllBalls },
                restitution: GameplayConsts.BallRestitution, frictionAir: GameplayConsts.BallFriction,
                render: { sprite: { texture: 'imgs/' + String(ball.Number) + '.png', xScale: textureScale, yScale: textureScale } },
                label: 'Ball ' + String(ball.Number)
            });
            if (!ball.Pocketed)
                World.add(_world, theBallBody);
            stripedBallModels.push({ Ball: ball, Body: theBallBody });
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
                var dist = distanceBetweenVectors(mouseUpPosition, cueBallModel.Body.position);
                if (dist < GameplayConsts.ClickDistanceLimit) {
                    _gameStage = GameStage.CueHit;
                    shootClick(cueBallModel.Body);
                }
            }
            else if (_gameStage == GameStage.PlacingCue) {
                // place the cue ball at mouse position
                // recreate the cue ball model (body)
                moveCueBall(mouseUpPosition, _gameState.FirstMove);
                _gameStage = GameStage.Aiming;
            }
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
        Matter.Events.on(_render, 'afterRender', function () {
            // update _renderLength (the distance between mouse and cue body)
            var cuePosition = cueBallModel.Body.position;
            var horizontalDistance = cuePosition.x - _mouse.position.x;
            var verticalDistance = cuePosition.y - _mouse.position.y;
            var angle = Math.atan2(verticalDistance, horizontalDistance);
            _mouse.position = _mouse.position;
            _mouseDistance = distanceBetweenVectors(cuePosition, _mouse.position);
            // set cue ball angle if aiming
            if (_gameStage == GameStage.Aiming) {
                Matter.Body.setAngle(cueBallModel.Body, angle);
            }
            // draw the guidelines, cue stick, guide circle
            if (_gameStage == GameStage.Aiming) {
                if (_mouseDistance < GameplayConsts.ClickDistanceLimit) {
                    drawGuideLine(_render.context, 1000, 4, "white", 0.3); // directional guideline
                    drawGuideLine(_render.context, _mouseDistance, 5, "red", 0.4); // current force guideline
                    drawCueStick(_render.context);
                }
                drawGuideCircle(_render.context);
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
    game.updateUI = updateUI;
    function maybeSendComputerMove() {
        if (!isComputerTurn())
            return;
        var currentMove = {
            endMatchScores: game.currentUpdateUI.endMatchScores,
            state: game.currentUpdateUI.state,
            turnIndex: game.currentUpdateUI.turnIndex,
        };
        var move = aiService.findComputerMove(currentMove);
        log.info("Computer move: ", move);
        gameService.makeMove(move, null);
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