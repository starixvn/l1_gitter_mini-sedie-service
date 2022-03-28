import { Core } from "sc-game-base";

import appConfigs from "./app-configs";
import constants from "./constants";
import gameSettings from "./game-settings";
import { generateResult, getSettlementResult, generateRawResultForHash } from "./helpers/result-helper";
import MiniSeDieContainerRegistry from "./mini-sedie-container-registry";

const run = async () => {
    const definition = new Core.GameDefinition(gameSettings, generateResult, getSettlementResult, generateRawResultForHash);
    const gameData = new Core.GameData(gameSettings.durations.wholeRound, constants.resetTotalBets);
    const container = new MiniSeDieContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp("MiniSeDie", appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
