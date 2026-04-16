# PoCW-WEB Frontend

Next.js frontend for PoCW verification flow. This app talks to the oracle API and uses wallet network chainId to choose the correct deployed contract addresses from environment variables.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local env from the template:

```bash
cp sample.env .env.local
```

3. Update local values in `.env.local`.

4. Start dev server:

```bash
npm run dev
```

Default UI URL: `http://localhost:3001`

## Environment Variables

### Required frontend vars

- `NEXT_PUBLIC_ORACLE_URL`
- `NEXT_PUBLIC_CONTROLLER_ADDRESS_31337` and `NEXT_PUBLIC_SBT_ADDRESS_31337` for local hardhat
- `NEXT_PUBLIC_CONTROLLER_ADDRESS_84532` and `NEXT_PUBLIC_SBT_ADDRESS_84532` for Base Sepolia testnet

### Why NEXT_PUBLIC_ is required

This frontend reads env values in browser-executed code (`process.env.NEXT_PUBLIC_*`). In Next.js, only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser bundle.

Never place secrets in frontend env files.

## Which env file for Local vs Testnet/Mainnet

- Local development (`npm run dev`): use `.env.local`
- Testnet or mainnet deployment builds (`npm run build` then `npm start`): use `.env.production`

Because these values are compiled into the frontend at build time, always rebuild after env changes.

## Detailed Deployment Env Modes

<details>
  <summary>Local development mode (.env.local)</summary>

Use when running local node and local oracle service.

Recommended values:
- `NEXT_PUBLIC_ORACLE_URL=http://localhost:3000`
- `NEXT_PUBLIC_CONTROLLER_ADDRESS_31337=<local PoCW_Controller address>`
- `NEXT_PUBLIC_SBT_ADDRESS_31337=<local PoCW_SBT address>`

Flow:
1. Start local chain and deploy contracts.
2. Start oracle service locally.
3. Start frontend with `npm run dev`.
4. Connect wallet to chain `31337`.

Notes:
- Local addresses can change after redeploy.
- Update `.env.local` whenever local contracts are redeployed.

</details>

<details>
  <summary>Testnet staging mode (.env.production with Base Sepolia)</summary>

Use when deploying staging/preview to VPS against Base Sepolia.

Recommended values:
- `NEXT_PUBLIC_ORACLE_URL=https://oracle.yourdomain.com`
- `NEXT_PUBLIC_CONTROLLER_ADDRESS_84532=<Base Sepolia Controller>`
- `NEXT_PUBLIC_SBT_ADDRESS_84532=<Base Sepolia SBT>`

Flow:
1. Deploy contracts to Base Sepolia in contracts repo.
2. Deploy oracle API on VPS with testnet config.
3. Set frontend `.env.production` with testnet addresses.
4. Build frontend (`npm run build`) and run (`npm start`).
5. Connect wallet to Base Sepolia (`84532`).

Notes:
- Use HTTPS domain for oracle to avoid browser mixed-content/CORS issues.
- Frontend and oracle can be on different subdomains.

</details>

<details>
  <summary>Mainnet production mode (.env.production with Base mainnet)</summary>

Use when deploying production against Base mainnet.

Recommended values:
- `NEXT_PUBLIC_ORACLE_URL=https://oracle.yourdomain.com`
- `NEXT_PUBLIC_CONTROLLER_ADDRESS_8453=<Base Mainnet Controller>`
- `NEXT_PUBLIC_SBT_ADDRESS_8453=<Base Mainnet SBT>`

Important:
- The current frontend chain map in `src/lib/contracts.ts` includes `31337` and `84532`.
- Add chain `8453` there before expecting mainnet addresses to resolve.

Flow:
1. Deploy audited contracts to Base mainnet.
2. Configure production oracle with production wallet and strict security.
3. Set `.env.production` to mainnet values.
4. Build and restart frontend.
5. Connect wallet to Base mainnet (`8453`).

Notes:
- Treat mainnet as immutable release process.
- Require explicit release checklist and rollback plan.

</details>

## Runtime Address Selection

Frontend picks contract addresses based on connected wallet chainId:

- chain `31337` -> reads `NEXT_PUBLIC_*_31337`
- chain `84532` -> reads `NEXT_PUBLIC_*_84532`
- unknown chain -> uses zero address fallback and UI warns deployment is missing

If users switch networks in wallet, app switches target addresses automatically.

## Troubleshooting

- "Contract not deployed on this chain": missing env pair for connected chainId.
- Oracle API connection failed: wrong `NEXT_PUBLIC_ORACLE_URL`, oracle down, or CORS mismatch.
- Changed env but app still old: rebuild frontend after env update.

## Security Notes

- Do not put private keys or API secrets in frontend env.
- Keep secrets in oracle-service env only.
- Use HTTPS for public oracle endpoint in testnet/mainnet.
