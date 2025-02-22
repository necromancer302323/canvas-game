import { GameLoop } from "./gameLoop";
import { DOWN, Input, LEFT, RIGHT, UP } from "./Input";
import { resources } from "./resource";
import { Sprite } from "./sprite";
import "./style.css";
import { Vector2 } from "./vector2";

const canvas = document.querySelector("#game-canvas");

const ctx = canvas.getContext("2d");

const socket = new WebSocket("ws://localhost:8080");
const playersList = [];
const skySprite = new Sprite({
  resource: resources.images.sky,
  frameSize: new Vector2(320, 180),
});
const groundSprite = new Sprite({
  resource: resources.images.ground,
  frameSize: new Vector2(320, 180),
});
const shadow = new Sprite({
  resource: resources.images.shadow,
  frameSize: new Vector2(32, 32),
});

let hero = null;

const heroPos = new Vector2(16 * 6, 16 * 5);
const input = new Input();

socket.onopen = function () {
  const joinRoomData = {
    event: "join",
    data: {
      roomId: "room1",
    },
  };
  console.log("connected to websocket");
  socket.send(JSON.stringify(joinRoomData));
};
socket.onmessage = function (message) {
  const data = JSON.parse(message.data);
  console.log(data)
  if (data.event === "acknowledged") {
    addCurrentUserPlayer(data.data.userId, data.data.userPosition);
    if (data.playerList != []) {
      data.playerList.forEach((users) => {
        if (users.id != data.data.userId) {
          playersList.push({
            userId: users.id,
            player: new Sprite({
              resource: resources.images.hero,
              frameSize: new Vector2(32, 32),
              hFrames: 3,
              vFrames: 8,
              frame: 1,
            }),
            userPosition: data.userPosition,
          });
        }
      });
    }
  }
  if (data.event == "position-update") {
    function findingWhichPlayerMoved(user) {
      return user.userId == data.data.userId;
    }
    const movedPlayer = playersList.findIndex(findingWhichPlayerMoved);
    playersList[movedPlayer].userPosition=data.data.userPosition;
  }
  if (data.event == "User added") {
    playersList.push({
      userId: data.userId,
      player: new Sprite({
        resource: resources.images.hero,
        frameSize: new Vector2(32, 32),
        hFrames: 3,
        vFrames: 8,
        frame: 1,
      }),
      userPosition: data.userPosition,
    });
  }
  if (data.event === "userLeft") {
    const playersLeft = playersList.findIndex(findingPLayerLeft);
    function findingPLayerLeft(user) {
      return user.userId == data.userId;
    }
    if (playersLeft == -1) {
      playersList.pop();
    } else {
      playersList.splice(playersLeft, 1);
    }
  }

  function update() {
    const positionData = {
      event: "position",
      data: {
        x: heroPos.x,
        y: heroPos.y,
      },
    };
    if (input.direction === DOWN) {
      heroPos.y += 1;
      socket.send(JSON.stringify(positionData));
    }
    if (input.direction === UP) {
      heroPos.y -= 1;
      socket.send(JSON.stringify(positionData));
    }
    if (input.direction === LEFT) {
      heroPos.x -= 1;
      socket.send(JSON.stringify(positionData));
    }
    if (input.direction === RIGHT) {
      heroPos.x += 1;
      socket.send(JSON.stringify(positionData));
    }
  }
  function draw() {
    skySprite.drawImage(ctx, 0, 0);
    groundSprite.drawImage(ctx, 0, 0);
    const heroOffset = new Vector2(-8, -21);
    const heroPosX = heroPos.x + heroOffset.x;
    const heroPosY = heroPos.y + heroOffset.y;
    if (hero != null) {
      hero.character.drawImage(ctx, heroPosX, heroPosY);
    }
    if (playersList != [] && playersList[1] != undefined && data.userPosition!=undefined) {
      playersList.forEach((user) => {
        console.log(user)
        if (user.player != hero.character) {
          const x=user.userPosition.y+heroOffset.y
          const y=user.userPosition.y+heroOffset.y
          user.player.drawImage(ctx,x,y);
        }
      });
    }
    shadow.drawImage(ctx, heroPosX, heroPosY);
  }
  function addCurrentUserPlayer(userId, userPosition) {
    hero = {
      character: new Sprite({
        resource: resources.images.hero,
        frameSize: new Vector2(32, 32),
        hFrames: 3,
        vFrames: 8,
        frame: 1,
      }),
      userId: userId,
    };
    playersList.push({ userId, player: hero.character, userPosition });
  }

  const gameLoop = new GameLoop(update, draw);
  gameLoop.start();
};
socket.onclose = function () {
  playersList.filter((user) => {
    user.userId != data.userId;
  });
};
