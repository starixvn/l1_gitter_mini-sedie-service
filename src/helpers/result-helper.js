import Chance from "chance";

const chance = new Chance();

const settlementRuleEntries = Object.entries({
    odd: (totalReds) => totalReds % 2 === 1,
    even: (totalReds) => totalReds % 2 === 0,
    red3: (totalReds) => totalReds === 3,
    red4: (totalReds) => totalReds === 4,
    white3: (totalReds) => totalReds === 1,
    white4: (totalReds) => totalReds === 0,
});

export const generateResult = () => {
    const red1 = (chance.integer({ min: 0, max: 1 }) * 2) >> 0 !== 0;
    const red2 =
        Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            3 <=
        10;
    const red3 =
        (Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            Math.floor(chance.integer({ min: 0, max: 1 }) * 6) +
            3) %
            2 ===
        0;
    const red4 = (Math.floor(chance.integer({ min: 0, max: 1 }) * 10000) + 1) % 2 !== 0;

    return { red1, red2, red3, red4 };
};

export const getSettlementResult = (roundResult) => {
    const totalReds = Object.values(roundResult).filter((value) => value === true).length;

    return settlementRuleEntries.reduce((result, [choice, rule]) => {
        result[choice] = rule(totalReds);

        return result;
    }, {});
};
