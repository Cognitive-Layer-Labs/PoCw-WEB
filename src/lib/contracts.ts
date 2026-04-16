/**
 * PoCW contract ABIs and chain configuration.
 *
 * Addresses are read from NEXT_PUBLIC_CONTROLLER_ADDRESS_<chainId>
 * and NEXT_PUBLIC_SBT_ADDRESS_<chainId> environment variables.
 */

export const POCW_CONTROLLER_ABI = [
  {
    name: "verifyAndMint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "contentId", type: "uint256" },
      { name: "score", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "tokenUri", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const POCW_SBT_ABI = [
  {
    name: "uri",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const ERROR_SELECTORS = {
  NonceAlreadyUsed: "0xNonceAlreadyUsed",
  SignatureExpired: "0xSignatureExpired",
  InvalidSignature: "0xInvalidSignature",
} as const;

export interface ChainDeploy {
  controllerAddress: `0x${string}`;
  sbtAddress: `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * Known chain deployments. Add entries as contracts are deployed.
 * Uses NEXT_PUBLIC_ env vars which Next.js inlines at build time.
 */
const KNOWN_CHAINS: Record<number, ChainDeploy> = {
  31337: {
    controllerAddress: (process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS_31337 ?? ZERO) as `0x${string}`,
    sbtAddress: (process.env.NEXT_PUBLIC_SBT_ADDRESS_31337 ?? ZERO) as `0x${string}`,
  },
  84532: {
    controllerAddress: (process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS_84532 ?? ZERO) as `0x${string}`,
    sbtAddress: (process.env.NEXT_PUBLIC_SBT_ADDRESS_84532 ?? ZERO) as `0x${string}`,
  },
};

export function getChainConfig(chainId: number): ChainDeploy {
  return KNOWN_CHAINS[chainId] ?? { controllerAddress: ZERO, sbtAddress: ZERO };
}
