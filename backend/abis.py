# abis.py — 각 컨트랙트의 ABI 정의

PHY_TOKEN_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "mintReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

CONTRIB_NFT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "string", "name": "tokenURI", "type": "string"}
        ],
        "name": "mint",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

CONTRIB_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "docHash", "type": "bytes32"},
            {"internalType": "string", "name": "docNumber", "type": "string"}
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "uint8", "name": "grade", "type": "uint8"},
            {"internalType": "string", "name": "nftURI", "type": "string"}
        ],
        "name": "approve",
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
                    {"internalType": "bytes32", "name": "docHash", "type": "bytes32"},
                    {"internalType": "address", "name": "author", "type": "address"},
                    {"internalType": "string", "name": "docNumber", "type": "string"},
                    {"internalType": "bool", "name": "approved", "type": "bool"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
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
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "id", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "author", "type": "address"},
            {"indexed": False, "internalType": "bytes32", "name": "docHash", "type": "bytes32"}
        ],
        "name": "ContribRegistered",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "id", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "author", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "tokenReward", "type": "uint256"}
        ],
        "name": "ContribApproved",
        "type": "event"
    }
]
