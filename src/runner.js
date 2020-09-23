'use strict';

const { gray, green, red } = require('chalk');
const snx = require('synthetix');
const BN = require('bn.js');

const { toBN, toWei, fromWei, hexToAscii } = require('web3-utils');

const {
	Contract,
	utils: { formatEther, parseEther },
	providers: { JsonRpcProvider },
	Wallet,
} = require('ethers');

const optimismLVM = 'http://18.188.217.219:8545';
const network = 'mainnet';
const provider = new JsonRpcProvider(optimismLVM);
const synthetixAddress = '0xc8A4b8c02E9364F908094969FD11aA4ee6A88819';
const proxySusdAddress = '0x69488c0d17E4405B4075618837C75C67C8FD4B60';

const synthAbi = snx.getSource({ network, contract: 'Synth' }).abi;
const synthetixAbi = snx.getSource({ network, contract: 'Synthetix' }).abi;

const faucet = new Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
const synthetixContract = new Contract(synthetixAddress, synthetixAbi, provider);
const synthetixContractWithSigner = synthetixContract.connect(faucet);
const sUSDContract = new Contract(proxySusdAddress, synthAbi, provider);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const doIssueSynths = async (amount) => {
	let susdBalance = await sUSDContract.balanceOf(
		faucet.address, { from: faucet.address }
	);
	console.log(green('Starting sUSD balance:', susdBalance));


	const startTime = Date.now();
	const tx = await synthetixContractWithSigner.issueSynths(amount);
	await provider.waitForTransaction(tx.hash);
	console.log(green('Issue synths completed:', tx.hash));
	console.log('Time to perform exchange:', Date.now() - startTime, 'ms');

	susdBalance = await sUSDContract.balanceOf(
		faucet.address, { from: faucet.address }
	);
	console.log(green('ending sUSD balance:', susdBalance));
}

let lastUpdateTime = Date.now();
async function runner() {
	try {
		await doIssueSynths(1);
		
		lastUpdateTime = Date.now();
	} catch (err) {
		console.error(red('Error detected:', err));
	}
}

module.exports = runner;
