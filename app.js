const express = require("express");
const app = express();
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005);
  } catch (e) {
    console.log(`Db-error:${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

// API 1

app.get("/players/", async (request, response) => {
  const playersDetailsQuery = `
    SELECT * FROM player_details;`;

  const playersDetails = await db.all(playersDetailsQuery);
  const modifiedPlayerDetails = (playersDetails) => {
    return {
      playerId: playersDetails.player_id,
      playerName: playersDetails.player_name,
    };
  };
  response.send(
    playersDetails.map((eachPlayer) => modifiedPlayerDetails(eachPlayer))
  );
});

// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id=${playerId};`;

  const getPlayer = await db.get(getPlayerQuery);

  const modifiedGetPlayer = () => {
    return {
      playerId: getPlayer.player_id,
      playerName: getPlayer.player_name,
    };
  };
  response.send(modifiedGetPlayer());
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;
  const putPlayerQuery = `
    UPDATE player_details
    SET 
    player_name='${playerName}'
    WHERE player_id= ${playerId};`;

  const putPlayer = await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details
    WHERE match_id=${matchId};`;

  const getMatchDetails = await db.get(getMatchDetailsQuery);
  const modifiedGetMatchDetails = () => {
    return {
      matchId: getMatchDetails.match_id,
      match: getMatchDetails.match,
      year: getMatchDetails.year,
    };
  };
  response.send(modifiedGetMatchDetails());
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
  SELECT match_id,match,year FROM player_match_score
  NATURAL JOIN match_details
  WHERE player_id=${playerId};`;

  const getMatchDetails = await db.all(getMatchesQuery);

  const modifiedMatchDetails = (getMatchDetails) => {
    return {
      matchId: getMatchDetails.match_id,
      match: getMatchDetails.match,
      year: getMatchDetails.year,
    };
  };

  response.send(
    getMatchDetails.map((eachMatch) => modifiedMatchDetails(eachMatch))
  );
});

//API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const playersListQuery = `
    SELECT player_id AS playerId,player_name as playerName FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id=${matchId};`;

  const playersList = await db.all(playersListQuery);
  response.send(playersList);
});

//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const statsQuery = `
    SELECT player_details.player_id AS playerId,player_details.player_name AS playerName, SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,SUM(sixes) AS totalSixes FROM player_match_score 
    INNER JOIN player_details
    ON  player_details.player_id=player_match_score.player_id
    WHERE player_match_score.player_id=${playerId};`;

  const scoreStats = await db.get(statsQuery);
  response.send(scoreStats);
});
