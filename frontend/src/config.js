// config.js — 컨트랙트 주소 및 ABI

export const CONTRACTS = {
  PHY_TOKEN:          "0x62D86Fcb9708EcB85A457e6319563B966e1Bd999",
  CONTRIB_NFT:        "0x35AC36527585512f5d9CF53061d36a6f1c3C9270",
  CONTRIB_REGISTRY:   "0x9aa2f86aa633DBEf7751E01C83C09b43a056A71A",
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
