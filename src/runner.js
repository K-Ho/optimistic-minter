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

const optimismLVM = 'https://goerli.optimism.io';
const network = 'mainnet';
const provider = new JsonRpcProvider(optimismLVM);
const synthetixAddress = '0x398c0c6B4DD3Bdd673B3fd910D776fFf56708062';
const proxySusdAddress = '0x87c8B069DCbD6a423E7C0fb43826984557982073';

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
