import Chance from "chance";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { Core } from "sc-game-base";
import { BaseBot } from "sc-game-base/src/core/crons";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";

import constants from "../../constants";
import gameSettings from "../../game-settings";
import { generateResult, getSettlementResult } from "../../helpers/result-helper";
import MiniSeDieBot from "../mini-sedie-bot";

const definition = new Core.GameDefinition(gameSettings, generateResult, getSettlementResult);
const gameData = new Core.GameData(gameSettings.durations.wholeRound, constants.resetTotalBets);
gameData.gameConfigs = {
    choices_maxbet: {
        even: 2000,
        odd: 2000,
        red3: 1000,
        white3: 1000,
        red4: 100,
        white4: 100,
        red2: 2000,
    },
    minbet: 1,
    bot_maxbet: 1000,
};

/** @type {mongoose.Model}*/
const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
const publisher = new BaseEventPublisher(definition.name, gameData);

const chance = new Chance();

describe("MiniSeDieBot tests", () => {
    it("all bet amount of choices should be zero after initialize", () => {
        // arrange

        // act
        const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

        // assert
        expect(bot.allBets).toEqual(constants.resetTotalBets);
    });

    it("reset should call super.reset", async () => {
        // arrange
        const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
        spyOn(BaseBot.prototype, "reset");

        // act
        await bot.reset();

        // assert
        expect(BaseBot.prototype.reset).toHaveBeenCalled();
    });

    it("run should call super.run", async () => {
        // arrange
        const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
        spyOn(BaseBot.prototype, "run");

        // act
        await bot.run();

        // assert
        expect(BaseBot.prototype.run).toHaveBeenCalled();
    });

    it("resetAllBotData should call super.resetAllBotData", () => {
        // arrange
        const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
        spyOn(BaseBot.prototype, "resetAllBotData");

        // act
        bot.resetAllBotData();

        // assert
        expect(BaseBot.prototype.resetAllBotData).toHaveBeenCalled();
    });

    it("getAllBetAmount should return sum of bot bet amount", () => {
        // arrange
        const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
        let expected = 0;

        definition.choices.forEach((choice) => {
            const randomAmount = chance.integer();
            bot.allBets[choice] = randomAmount;
            expected += randomAmount;
        });

        // act
        const totalBetAmount = bot.getAllBetAmount();

        // assert
        expect(totalBetAmount).toEqual(expected);
    });

    describe("isSmallTicket test", () => {
        it("should return true if amount less than minBet * smallTicketValueRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const randomAmount = chance.integer({ min: bot.getMinBet(), max: bot.getMinBet() * bot.smallTicketValueRatio - 1 });

            // act
            const result = bot.isSmallTicket(randomAmount);

            // assert
            expect(result).toBeTrue();
        });

        it("should return false if amount greater than minBet * smallTicketValueRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const randomAmount = chance.integer({ min: bot.getMinBet() * bot.smallTicketValueRatio, max: gameData.gameConfigs.bot_maxbet });

            // act
            const result = bot.isSmallTicket(randomAmount);

            // assert
            expect(result).toBeFalse();
        });
    });

    describe("convertAmountToChip test", () => {
        it("should return correct chip", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

            // act
            const chip = bot.convertAmountToChip(50);

            // assert
            expect(chip).toBe(50);
        });

        it("should return correct chip if amount nearby", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

            // act
            const chip = bot.convertAmountToChip(70);

            // assert
            expect(chip).toBe(50);
        });

        it("should return minBet if amount less than minBet", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

            // act
            const chip = bot.convertAmountToChip(0.5);

            // assert
            expect(chip).toBe(bot.getMinBet());
        });
    });

    describe("getTotalBetAmount test", () => {
        it("should return correct amount", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const randomAmount = chance.integer({ min: bot.getMinBet(), max: bot.getMinBet() * bot.smallTicketValueRatio - 1 });
            const choice = chance.pickone(bot.mainOpts);
            const currentBet = constants.resetTotalBets;
            currentBet[choice] = randomAmount;

            // act
            const totalAmount = bot.getTotalBetAmount(currentBet);

            // assert
            expect(totalAmount).toBe(randomAmount);
        });
    });

    describe("getMaxBet test", () => {
        it("should return the max value of small ticket if not reach smallTicketRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const betChoice = chance.pickone(bot.mainOpts);

            // act
            const maxBet = bot.getMaxBet(null, betChoice);

            // assert
            expect(maxBet).toEqual(bot.getMinBet() * bot.smallTicketValueRatio);
        });

        it("betChoice is mainOpts should return the lowest-valued between bot_maxbet and choice_maxbet if already passed smallTicketRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            bot.smallTickets = 1;
            bot.totalTickets = 1;
            const betChoice = chance.pickone(bot.mainOpts);

            // act
            const maxBet = bot.getMaxBet(null, betChoice);

            // assert
            expect(maxBet).toEqual(gameData.gameConfigs.bot_maxbet);
        });

        it("betChoice is subOpts should return totalBetAmount * subOptRatio if already passed smallTicketRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            bot.smallTickets = 1;
            bot.totalTickets = 1;
            const totalBetAmount = 1000;
            const expected = (totalBetAmount * bot.betChoiceRatio.SubOpts) / 100;
            spyOn(bot, "getAllBetAmount").and.returnValue(totalBetAmount);
            const betChoice = chance.pickone(bot.subOpts);

            // act
            const maxBet = bot.getMaxBet(null, betChoice);

            // assert
            expect(maxBet).toEqual(expected);
        });

        it("betChoice is rareOpts should return minBet * 10 if already passed smallTicketRatio", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            bot.smallTickets = 1;
            bot.totalTickets = 1;
            const totalBetAmount = 1000;
            const expected = gameData.gameConfigs.minbet * 10;
            spyOn(bot, "getAllBetAmount").and.returnValue(totalBetAmount);
            const betChoice = chance.pickone(bot.rareOpts);

            // act
            const maxBet = bot.getMaxBet({ betOnChoices: [] }, betChoice);

            // assert
            expect(maxBet).toEqual(expected);
        });
    });

    describe("getBetChoice test", () => {
        it("should return main choices when main choices have less than 90% bet amount", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

            // act
            const choice = bot.getBetChoice({ choices: [] });

            // assert
            expect(bot.mainOpts).toContain(choice);
        });
    });
});
