import { generateResult, getSettlementResult, generateRawResultForMd5 } from "../result-helper";

describe("getSettlementResult tests", () => {
    describe("when results have ONE red", () => {
        it("should return odd and white3", () => {
            // arrange
            const roundResult = { red1: true, red2: false, red3: false, red4: false };
            const expected = {
                odd: true,
                even: false,
                red3: false,
                red4: false,
                white3: true,
                white4: false,
            };

            // act
            var result = getSettlementResult(roundResult);

            // assert
            expect(result).toStrictEqual(expected);
        });
    });

    describe("when results have TWO reds", () => {
        it("should return even", () => {
            // arrange
            const roundResult = { red1: true, red2: true, red3: false, red4: false };
            const expected = {
                odd: false,
                even: true,
                red3: false,
                red4: false,
                white3: false,
                white4: false,
            };

            // act
            var result = getSettlementResult(roundResult);

            // assert
            expect(result).toStrictEqual(expected);
        });
    });

    describe("when results have THREE reds", () => {
        it("should return odd and red3", () => {
            // arrange
            const roundResult = { red1: true, red2: true, red3: true, red4: false };
            const expected = {
                odd: true,
                even: false,
                red3: true,
                red4: false,
                white3: false,
                white4: false,
            };

            // act
            var result = getSettlementResult(roundResult);

            // assert
            expect(result).toStrictEqual(expected);
        });
    });

    describe("when results have FOUR reds", () => {
        it("should return even and red4", () => {
            // arrange
            const roundResult = { red1: true, red2: true, red3: true, red4: true };
            const expected = {
                odd: false,
                even: true,
                red3: false,
                red4: true,
                white3: false,
                white4: false,
            };

            // act
            var result = getSettlementResult(roundResult);

            // assert
            expect(result).toStrictEqual(expected);
        });
    });

    describe("when results have NO reds", () => {
        it("should return even and white4", () => {
            // arrange
            const roundResult = { red1: false, red2: false, red3: false, red4: false };
            const expected = {
                odd: false,
                even: true,
                red3: false,
                red4: false,
                white3: false,
                white4: true,
            };

            // act
            var result = getSettlementResult(roundResult);

            // assert
            expect(result).toStrictEqual(expected);
        });
    });
});

describe("generateResult tests", () => {
    it("should return enough results", () => {
        // act
        var result = generateResult();

        // assert
        expect(Object.keys(result).length).toBe(4);
    });
});

describe("generateRawResultForMd5", () => {
    it("convert result to raw result for md5", () => {
        // Arrange
        const roundResult = { red1: true, red2: false, red3: false, red4: true };

        // Act
        const result = generateRawResultForMd5(roundResult);

        // Assert
        expect(result).toBe("{🔴⚪⚪🔴}");
    });
});
