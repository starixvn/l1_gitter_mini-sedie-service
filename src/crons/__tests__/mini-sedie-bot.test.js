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
    },
    minbet: 1,
    bot_maxbet: 1000,
};

/** @type {mongoose.Model}*/
const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
const publisher = new BaseEventPublisher(definition.name, gameData);

const chance = new Chance();

describe("MiniSeDieBot tests", () => {
    describe("when initialize", () => {
        it("all bet amount of choices should be zero", () => {
            // arrange

            // act
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

            // assert
            expect(bot.allBets).toEqual(constants.resetTotalBets);
        });
    });

    describe("reset", () => {
        it("should call super.reset", async () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            spyOn(BaseBot.prototype, "reset");

            // act
            await bot.reset();

            // assert
            expect(BaseBot.prototype.reset).toHaveBeenCalled();
        });
    });

    describe("run", () => {
        it("should call super.run", async () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            spyOn(BaseBot.prototype, "run");

            // act
            await bot.run();

            // assert
            expect(BaseBot.prototype.run).toHaveBeenCalled();
        });
    });

    describe("resetAllBotData", () => {
        it("should call super.resetAllBotData", () => {
            // arrange
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            spyOn(BaseBot.prototype, "resetAllBotData");

            // act
            bot.resetAllBotData();

            // assert
            expect(BaseBot.prototype.resetAllBotData).toHaveBeenCalled();
        });
    });

    describe("getAllBetAmount", () => {
        it("should return sum of bot bet amount", () => {
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
    });

    describe("isSmallTicket test", () => {
        describe("when amount less than minBet * smallTicketValueRatio", () => {
            it("should return true ", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
                const randomAmount = chance.integer({ min: bot.getMinBet(), max: bot.getMinBet() * bot.smallTicketValueRatio - 1 });

                // act
                const result = bot.isSmallTicket(randomAmount);

                // assert
                expect(result).toBeTrue();
            });
        });

        describe("when amount greater than minBet * smallTicketValueRatio", () => {
            it("should return false", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
                const randomAmount = chance.integer({
                    min: bot.getMinBet() * bot.smallTicketValueRatio,
                    max: gameData.gameConfigs.bot_maxbet,
                });

                // act
                const result = bot.isSmallTicket(randomAmount);

                // assert
                expect(result).toBeFalse();
            });
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

        describe("when  amount nearby", () => {
            it("should return correct chip", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

                // act
                const chip = bot.convertAmountToChip(70);

                // assert
                expect(chip).toBe(50);
            });
        });

        describe("when amount less than minBet", () => {
            it("should return minBet", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

                // act
                const chip = bot.convertAmountToChip(0.5);

                // assert
                expect(chip).toBe(bot.getMinBet());
            });
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
        describe("when not reach smallTicketRatio", () => {
            it("should return the max value of small ticket", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
                const betChoice = chance.pickone(bot.mainOpts);

                // act
                const maxBet = bot.getMaxBet(null, betChoice);

                // assert
                expect(maxBet).toEqual(bot.getMinBet() * bot.smallTicketValueRatio);
            });
        });

        describe("when  already passed smallTicketRatio", () => {
            it("betChoice is mainOpts should return the lowest-valued between bot_maxbet and choice_maxbet", () => {
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
        });

        describe("when  already passed smallTicketRatio", () => {
            it("betChoice is subOpts should return totalBetAmount * subOptRatio", () => {
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
        });

        describe("when already passed smallTicketRatio", () => {
            it("betChoice is rareOpts should return minBet * 10", () => {
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
    });

    describe("getBetChoice test", () => {
        describe("when main choices have less than 90% bet amount", () => {
            it("should return main choices", () => {
                // arrange
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);

                // act
                const choice = bot.getBetChoice({ choices: [] });

                // assert
                expect(bot.mainOpts).toContain(choice);
            });
        });
    });

    describe("placeBet test", () => {
        it("should not place bet in locking time", async () => {
            // arrange
            gameData.remainingTime = chance.integer({ min: 0, max: definition.durations.lockingBet });
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const botPlayer = { id: "23" };

            // act
            await bot.placeBet(botPlayer);

            // assert
            expect(bot.smallTickets).toEqual(0);
            expect(bot.getAllBetAmount()).toEqual(0);
        });

        it("should be small ticket firstly", async () => {
            // arrange
            gameData.remainingTime = chance.integer({ min: definition.durations.lockingBet + 1, max: definition.durations.placingBets });
            const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
            const botPlayer = { id: "23" };

            // act
            await bot.placeBet(botPlayer);

            // assert
            expect(bot.smallTickets).toEqual(1);
            expect(bot.getAllBetAmount()).toBeGreaterThan(0);
        });

        describe("when reached ratio", () => {
            it("should NOT be small ticket", async () => {
                // arrange
                gameData.remainingTime = chance.integer({
                    min: definition.durations.lockingBet + 1,
                    max: definition.durations.placingBets,
                });
                const bot = new MiniSeDieBot(definition, gameData, publisher, userInfosRepository);
                bot.smallTickets = 1;
                bot.totalTickets = 1;
                const botPlayer = { id: "23" };

                // act
                await bot.placeBet(botPlayer);

                // assert
                expect(bot.smallTickets).toEqual(1);
            });
        });
    });
});
