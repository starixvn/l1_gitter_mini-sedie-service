import awilix from "awilix";
import { Core } from "sc-game-base";

import PlaceBetConsumer from "./consumers/mini-sedie-place-bet-consumer";
import { MiniSeDieBot, MiniSeDieGameCron } from "./crons";
import { MiniSeDieBets, MiniSeDieRounds } from "./models";

const { asClass, asValue } = awilix;

export default class MiniSeDieContainerRegistry extends Core.ContainerRegistry {
    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(MiniSeDieRounds),
            betsRepository: asValue(MiniSeDieBets),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            bot: asClass(MiniSeDieBot).singleton(),
            gameCron: asClass(MiniSeDieGameCron).singleton().proxy(),
        });
    }
}
