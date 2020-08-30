import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import './Snake.css';


//interfaces
interface IGameProps {
  gameDimension: number;
  cellPx: number;
  foodPoints?: number;
  initialSpeed?: number;
  speedFoodQuantity?: number;
  speedDecreaseRate?: number;
  expansionRate?: number;
  saveGameKey?: string;
  minSpeed?: number;
}

interface IGameSpeed {
  speedFoodQuantity: number;
  speedDecreaseRate: number;
  initialSpeed: number;
  minSpeed: number;
}

interface ICoordinate {
  x: number;
  y:number;
}

//Initialize array function
const boardInitialize = (gameDimension: number): Array<object[]> => {
  const rows = [];

  for(let i = 0; i< gameDimension; i++)
  {
    const cells = [];
    for(let j = 0; j<gameDimension; j++)
    {
      cells.push({});
    }

    rows.push(cells);
  }

  return rows;
};

//Initialize player coordinartes
const getInitialPlayer = (gameDimension: number): ICoordinate[] => { 
  const player: ICoordinate[] = [];
  const center: number = Math.floor(gameDimension/2);

  player.push({
    x: center,
    y: center - 1
  })

  player.push({
    x: center,
    y: center
  })

  player.push({
    x: center,
    y: center + 1
  })

  return player;
}

//Randomize food coordinates
const getNextFood = (player: ICoordinate[], gameDimension: number): ICoordinate => {
  let food: ICoordinate = {
    x: 0,
    y: 0
  };

  let invalid: boolean = true;

  do {
    food.x = Math.floor(Math.random() * gameDimension);
    food.y = Math.floor(Math.random() * gameDimension);
    if(!player.some(p => p.x === food.x && p.y === food.y))
    {
      invalid = false;
    }
  } while(invalid)

  return food;
}  

//Check if input is valid
const validateDirection = (d1: string, d2: string): boolean => {
  if(!( (d1 === d2) ||
        (d1 === "UP" && d2 === "DOWN") || 
        (d1 === "DOWN" && d2 === "UP") ||
        (d1 === "LEFT" && d2 === "RIGHT") ||
        (d1 === "RIGHT" && d2 === "LEFT") ))
  {
    return true;
  }

  return false;
}

const Snake: React.FC<IGameProps> = ({gameDimension, 
                                      cellPx, 
                                      expansionRate, 
                                      initialSpeed, 
                                      speedDecreaseRate, 
                                      speedFoodQuantity, 
                                      foodPoints,
                                      minSpeed, 
                                      saveGameKey}) => {

  //Memos - constants for game configuration based on props
  const boardArray = useMemo(() => boardInitialize(gameDimension), [gameDimension]);

  const boardDimension = useMemo((): React.CSSProperties => {
    const widhtHeightStr = `${(gameDimension * cellPx) + 100}px`;
    return {
      width: widhtHeightStr,
      height: widhtHeightStr
    }
  }, [gameDimension, cellPx])

  const rowDimensions = useMemo((): React.CSSProperties => {
    return {
      width: `${(gameDimension * cellPx)}px`,
      height: `${cellPx}px`
    }
  }, [gameDimension, cellPx])

  const cellDimensions = useMemo((): React.CSSProperties => {
    return {
      width: `${cellPx}px`,
      height: `${cellPx}px`
    }
  }, [cellPx])

  const foodExpansion = useMemo((): number => {    
    return expansionRate && expansionRate > 0 ? expansionRate : 1;
  }, [expansionRate])

  const gameSpeedSettings = useMemo(():IGameSpeed => {
    let baseSpeed = initialSpeed && initialSpeed > 100 && initialSpeed < 1000 ? initialSpeed : 250;
    return {
      initialSpeed:  baseSpeed,
      speedDecreaseRate: speedDecreaseRate && speedDecreaseRate >= 0 && speedDecreaseRate <= 10 ? speedDecreaseRate : 1,
      speedFoodQuantity: speedFoodQuantity && speedFoodQuantity > 0 ? speedFoodQuantity : 10,
      minSpeed: minSpeed && minSpeed > 0 && minSpeed < baseSpeed ? minSpeed : 50
    };
  }, [initialSpeed, speedDecreaseRate, speedFoodQuantity, minSpeed])

  const gameFoodPoints = useMemo(() => {
    return foodPoints && foodPoints > 0 ? foodPoints : 1;
  }, [foodPoints])

  //States -- used for display screen data
  const [player, setPlayer] = useState<ICoordinate[]>(getInitialPlayer(gameDimension));
  const [food, setFood] = useState<ICoordinate>(getNextFood(player, gameDimension));
  const [nextDirection, setNextDirection] = useState<string>("UP");
  const [gameRunningState, setGameRunningState] = useState<boolean>(false);
  const [gamePaused, setGamePaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  
  //Refs -- used for internal game processing
  const gameRef = useRef<HTMLDivElement>(null);
  const gameRunning = useRef<boolean>(false);
  const timeoutId = useRef<NodeJS.Timeout>();
  const direction = useRef<string>("UP");
  const snake = useRef<ICoordinate[]>(player);
  const foodRef = useRef<ICoordinate>(food);
  const foodBuffer = useRef<number>(0);
  const scoreBase = useRef<number>(0);
  const gameSpeed = useRef<number>(gameSpeedSettings.initialSpeed);

   //Calbacks - game processing functions
   const getGameCellClass = useCallback((type?: string):string => {
    let cellClass: string = "gameCell";

    switch(type)
    {
      case "FOOD":
        return cellClass += " gameCellFood";
      case "HEAD":
        return cellClass += " gameCellSnakeHead";
      case "BODY":
        return cellClass += " gameCellSnakeBody";
    }

    return cellClass;
  }, []);

  const drawBoard = useCallback(() => {
    return ( boardArray.map((x, i) =>
      <div key={`row_${i}`} className="gameRow" style={rowDimensions}>
        {
          x.map((y, j) => {
            let typeCell: string = "";
            if(player[0].x === j && player[0].y === i)
            {
              typeCell = "HEAD";
            }
            else if(player.some(p => p.x === j && p.y === i))
            {
              typeCell = "BODY"
            }
            else if(food.x === j && food.y === i)
            {
              typeCell = "FOOD"
            }

            return (<div key={`cell_${i},${j}`} className={getGameCellClass(typeCell)} style={cellDimensions}></div>)
          }
        )}
      </div>
    ))}, [player, 
          food, 
          boardArray, 
          getGameCellClass, 
          rowDimensions, 
          cellDimensions])

  const newGame = useCallback(() => {
    snake.current = getInitialPlayer(gameDimension);
    setPlayer(snake.current);
    foodRef.current = getNextFood(snake.current, gameDimension);
    setFood(foodRef.current);
    setGameOver(false);
    setNextDirection("UP");
    direction.current = "UP";
    gameSpeed.current = gameSpeedSettings.initialSpeed;
    setScore(0);
    scoreBase.current = 0;
    foodBuffer.current = 0;
  }, [gameDimension, 
      setPlayer, 
      setFood, 
      setGameOver,
      gameSpeedSettings, 
      setScore])

  const pauseStartGame = useCallback( () => {
    setGamePaused(prev => !prev && gameRunningState);
    setGameRunningState((prev) => !prev);
  }, [gameRunningState, setGamePaused, setGameRunningState]);

  const pauseClickOut = useCallback((event: any) => {
    if(gameRef && gameRef.current && !gameRef.current.contains( event.target ))
    {
      setGamePaused(true);
      setGameRunningState(false);
    }
  }, [setGamePaused, setGameRunningState])

  const updateDirection = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if(event.keyCode === 32)
    {
      pauseStartGame();
    }
    else 
    {
      if(gameRunning.current)
      {
        let directionUpdate = direction.current;
        if(event.keyCode === 38 || event.keyCode === 87)
        {
          directionUpdate = "UP";
        }
        else if(event.keyCode === 40 || event.keyCode === 83)
        {
          directionUpdate = "DOWN";
        }
        else if(event.keyCode === 37 || event.keyCode === 65)
        {
          directionUpdate ="LEFT";
        }
        else if(event.keyCode === 39 || event.keyCode === 68)
        {
          directionUpdate = "RIGHT";
        }

        if(validateDirection(directionUpdate, direction.current))
        {
          if(timeoutId.current)
            clearTimeout(timeoutId.current);
          
          setNextDirection(directionUpdate);
          direction.current = directionUpdate;
          playGame();
        }
      }
    }
    // eslint-disable-next-line
  }, [setNextDirection, gameRunning, pauseStartGame])
    
  const updatePlayer = useCallback( (selectedDirection: string) => {
    let newPlayer = [...snake.current];
    let tempX = newPlayer[0].x;
    let tempY = newPlayer[0].y;
    let eating = newPlayer[0].x === foodRef.current.x && newPlayer[0].y === foodRef.current.y;

    if(eating)
    {
      foodBuffer.current += foodExpansion;
    }

    if(selectedDirection === "UP")
    {
      newPlayer[0].y--;
    }
    else if(selectedDirection === "DOWN")
    {
      newPlayer[0].y++;
    }
    else if(selectedDirection === "LEFT")
    {
      newPlayer[0].x--;
    }
    else if(selectedDirection === "RIGHT")
    {
      newPlayer[0].x++;
    }

    //Check if collision happened
    if(newPlayer[0].x < 0 || 
      newPlayer[0].x >= gameDimension || 
      newPlayer[0].y < 0 || 
      newPlayer[0].y >= gameDimension ||      
      newPlayer.some((p, i) => i === 0 ? false : p.x === newPlayer[0].x && p.y === newPlayer[0].y))
    {
      if(gameOver && timeoutId.current)
      {
        clearTimeout(timeoutId.current);
      }
      gameRunning.current = false;
      setGameRunningState(false);
      setGameOver(true);

      newPlayer[0].x = tempX;
      newPlayer[0].y = tempY;

      snake.current = newPlayer;
      setPlayer(snake.current);
    }

    else
    {
      //Update player snake
      for(let i = 1; i < newPlayer.length; i++)
      {
        let tempX2 = newPlayer[i].x;
        let tempY2 = newPlayer[i].y;

        newPlayer[i].x = tempX;
        newPlayer[i].y = tempY;

        tempX = tempX2;
        tempY = tempY2;
      }

      if(foodBuffer.current > 0)
      {
        foodBuffer.current--;
        snake.current = [...newPlayer, {
          x: tempX,
          y: tempY
        }, ]
        if(eating)
        {
          scoreBase.current++;
          setScore(scoreBase.current * gameFoodPoints);
          foodRef.current = getNextFood(snake.current, gameDimension);
          setFood(foodRef.current);
          if(scoreBase.current > 0 && scoreBase.current % gameSpeedSettings.speedFoodQuantity === 0)
          {
            let newSpeed = gameSpeed.current;
            let decreaseQuantity = gameSpeedSettings.speedDecreaseRate / 20 * newSpeed;

            newSpeed -= decreaseQuantity;

            if(newSpeed >= gameSpeedSettings.minSpeed)
            {
              gameSpeed.current = newSpeed;
            }
            else if(newSpeed < gameSpeedSettings.minSpeed)
            {
              gameSpeed.current = gameSpeedSettings.minSpeed;
            }
          }
        }
      }
      else
      {
        snake.current = newPlayer;
      }

      setPlayer(snake.current);
    }
  }, [setPlayer, 
      setFood, 
      snake, 
      foodRef, 
      gameDimension, 
      gameOver, 
      foodExpansion, 
      scoreBase, 
      setScore, 
      gameFoodPoints, 
      gameSpeed, 
      gameSpeedSettings])

  const playGame = useCallback(() => {
    updatePlayer(direction.current);
    timeoutId.current = setTimeout(() => {
      if(gameRunning.current)
      {
        playGame();
      }
      else
      {
        if(timeoutId.current)
          clearTimeout(timeoutId.current);
      }
    }, gameSpeed.current);
  }, [updatePlayer, timeoutId, gameRunning, direction]);

  //effect - initial configuration, focus and handle game start
  useEffect(() => {
    if(gameRef && gameRef.current)
        gameRef.current.focus();
    document.addEventListener( "mousedown", pauseClickOut );
    return () => {
      document.removeEventListener( "mousedown", pauseClickOut );
    };
  // eslint-disable-next-line
  }, [])

  useEffect(() => {
    gameRunning.current = gameRunningState;
    if(gameRunningState)
    {
      playGame();
    }
    // eslint-disable-next-line
  }, [gameRunningState])

  return (
    <div className="background">
      <div className="gameBoard" style={boardDimension} tabIndex={1} ref = {gameRef} onKeyDown={(event) => updateDirection(event)}>
        {drawBoard()}
        <div className="gameScores">
          Score:
          <br />
          {score}
          <br />
          Speed:
          <br />
          {`x${Math.floor(scoreBase.current / gameSpeedSettings.speedFoodQuantity) + 1}`}
          <br />
          Direction:
          <br />
          {nextDirection}
        </div>
        {(gameOver || gamePaused) && <div className="gameOverBanner">GAME {gamePaused ? "PAUSED" : "OVER"}</div>}
        {!gameOver ? <div className="gameStart" onClick={() => pauseStartGame()}>
          {`${gameRunningState ? "Pause" : gamePaused ? "Continue" : "Start"} Game`}
        </div>
        : <div className="gameStart" onClick={() => newGame()}>
          New Game
        </div>}
      </div>
    </div>
  );
}

export default Snake;
