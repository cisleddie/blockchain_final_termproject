// config.js — 컨트랙트 주소 및 ABI

export const CONTRACTS = {
  PHY_TOKEN:          "0x7C5f01254A379F03A2E99659Bcd7b1B6226E5847",
  CONTRIB_NFT:        "0x8A7C42E726d9fF5d02F4450d469E12EC02e08615",
  CONTRIB_REGISTRY:   "0x0fe8a86C55ea2705Ba01a2B463F4a17E4dE09277",
};

export const BACKEND_URL = "http://localhost:8000";

export const PHY_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
];

export const CONTRIB_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "docHash", "type": "bytes32"},
      {"internalType": "string",  "name": "docNumber", "type": "string"}
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "getContrib",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32",  "name": "docHash",   "type": "bytes32"},
          {"internalType": "address",  "name": "author",    "type": "address"},
          {"internalType": "string",   "name": "docNumber", "type": "string"},
          {"internalType": "bool",     "name": "approved",  "type": "bool"},
          {"internalType": "uint256",  "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct ContribRegistry.Contribution",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contribCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,  "internalType": "uint256", "name": "id",      "type": "uint256"},
      {"indexed": true,  "internalType": "address", "name": "author",  "type": "address"},
      {"indexed": false, "internalType": "bytes32", "name": "docHash", "type": "bytes32"}
    ],
    "name": "ContribRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,  "internalType": "uint256", "name": "id",          "type": "uint256"},
      {"indexed": true,  "internalType": "address", "name": "author",      "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "tokenReward", "type": "uint256"}
    ],
    "name": "ContribApproved",
    "type": "event"
  }
];
