const { expect } = require('@1inch/solidity-utils');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deployRangeAmountCalculator } = require('./helpers/fixtures');
const { ether } = require('./helpers/utils');

describe('RangeAmountCalculator', async () => {
    describe('Fill by maker asset', async () => {
        const priceStart = ether('3000');
        const priceEnd = ether('4000');
        const totalLiquidity = ether('10');

        it('Revert with incorrect prices', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('10');
            const remainingMakerAmount = totalLiquidity;
            await expect(rangeAmountCalculator.getRangeTakerAmount(priceEnd, priceStart, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.be.revertedWithCustomError(rangeAmountCalculator, 'IncorrectRange');
            await expect(rangeAmountCalculator.getRangeTakerAmount(priceStart, priceStart, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.be.revertedWithCustomError(rangeAmountCalculator, 'IncorrectRange');
        });

        it('Fill limit-order completely', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('10');
            const remainingMakerAmount = totalLiquidity;
            expect(await rangeAmountCalculator.getRangeTakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.equal(ether('35000')); // 3500 * 10
        });

        it('Fill limit-order by half', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('5');
            const remainingMakerAmount = totalLiquidity;
            expect(await rangeAmountCalculator.getRangeTakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.equal(ether('16250')); // 3250 * 5
        });

        it('Fill limit-order 10 times', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            let remainingMakerAmount = totalLiquidity;

            const fillOrderFor = async (fillAmount) => {
                const amount = await rangeAmountCalculator.getRangeTakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount);
                remainingMakerAmount = remainingMakerAmount.sub(fillAmount);
                return amount;
            };

            for (let i = 0; i < 10; i++) {
                expect(await fillOrderFor(ether('1'))).to.equal(ether('3050').add(ether('100').mul(i)));
            }
        });
    });

    describe('Fill by taker asset', async () => {
        const priceStart = ether('3000');
        const priceEnd = ether('4000');
        const totalLiquidity = ether('10');

        it('Revert with incorrect prices', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('10');
            const remainingMakerAmount = totalLiquidity;
            await expect(rangeAmountCalculator.getRangeMakerAmount(priceEnd, priceStart, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.be.revertedWithCustomError(rangeAmountCalculator, 'IncorrectRange');
            await expect(rangeAmountCalculator.getRangeMakerAmount(priceStart, priceStart, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.be.revertedWithCustomError(rangeAmountCalculator, 'IncorrectRange');
        });

        it('Fill limit-order completely', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('35000');
            const remainingMakerAmount = totalLiquidity;
            expect(await rangeAmountCalculator.getRangeMakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.equal(ether('10')); // 35000 / 3500 = 10
        });

        it('Fill limit-order by half', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            const fillAmount = ether('16250');
            const remainingMakerAmount = totalLiquidity;
            expect(await rangeAmountCalculator.getRangeMakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount))
                .to.equal(ether('5')); // 16250 / 3250 = 5
        });

        it('Fill limit-order by several steps', async () => {
            const { rangeAmountCalculator } = await loadFixture(deployRangeAmountCalculator);
            let remainingMakerAmount = totalLiquidity;

            const fillOrderFor = async (fillAmount) => {
                const amount = await rangeAmountCalculator.getRangeMakerAmount(priceStart, priceEnd, totalLiquidity, fillAmount, remainingMakerAmount);
                remainingMakerAmount = remainingMakerAmount.sub(amount);
                return amount;
            };

            for (let i = 0; i < 10; i++) {
                expect(await fillOrderFor(ether('3050').add(ether('100').mul(i)))).to.equal(ether('1'));
            }
        });
    });
});
