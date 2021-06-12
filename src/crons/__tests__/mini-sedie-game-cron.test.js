import Chance from "chance";
import { Core } from "sc-game-base";

import MiniSeDieGameCron from "../mini-sedie-game-cron";

describe("composeBettingTimeValidationCriteria tests", () => {
    const gameData = new Core.GameData();
    gameData.remainingTime = 20;
    gameData.gameConfigs = {
        enabled: true,
        minbet: 1,
        maxbet: 1000,
        choices_maxbet: {
            choice01: 200,
        },
    };

    const gameDefinition = new Core.GameDefinition({
        choices: ["choice01"],
        durations: {
            wholeRound: 39,
            placingBets: 30,
            lockingBet: 5,
            shakeThePlateDuration: 2,
        },
    });

    const chance = new Chance();

    it("should return true time is shakeThePlateTime", () => {
        // arrange
        gameData.remainingTime = gameDefinition.durations.placingBets + gameDefinition.durations.shakeThePlateDuration;
        const cron = new MiniSeDieGameCron(gameDefinition, gameData);

        // act
        var result = cron.isStartingTime(gameData.remainingTime, gameDefinition.durations);

        // assert
        expect(result).toBeTrue();
    });

    it("should return false time is NOT shakeThePlateTime", () => {
        // arrange
        gameData.remainingTime = chance.integer({ min: gameDefinition.durations.lockingBet, max: gameDefinition.durations.placingBets });
        const cron = new MiniSeDieGameCron(gameDefinition, gameData);

        // act
        var result = cron.isStartingTime(gameData.remainingTime, gameDefinition.durations);

        // assert
        expect(result).toBeFalse();
    });
});
