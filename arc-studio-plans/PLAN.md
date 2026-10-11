# PayLink SDK — PoC Plan

## Value Proposition

SDK que permite a cualquier desarrollador agregar cobros por WhatsApp a su app en menos de 30 minutos. El comerciante genera un link de pago, lo envía por WhatsApp, y el cliente paga en USDC (con wallet o con tarjeta) desde el navegador del celular, sin instalar nada. Liquidación instantánea en stablecoins, fees predecibles en USDC, sin chargebacks.

---

## Entidades del PoC

| Entidad | Descripcion | Donde vive |
|---|---|---|
| Developer | Quien integra el SDK | Frontend demo |
| Merchant | Comerciante que genera cobros. Identificado por wallet Circle developer-controlled | Circle Wallets API |
| Payment Request | Monto + memo + wallet destino codificados en URL | URL params (stateless) |
| Payer | Cliente que abre el link y paga | Browser del cliente |
| USDC Transfer | Transferencia onchain payer → merchant | Arc Testnet |

## Entidades adicionales del MVP

| Entidad | Descripcion |
|---|---|
| Auth session | Developer se autentica con API Key + Entity Secret |
| Merchant account | Perfil persistido: nombre, wallet, configuracion |
| Payment record | Registro: monto, estado, timestamp, txHash |
| Webhook | Notificacion push al developer cuando llega un pago |
| SDK package | Libreria publicable (@tuorg/payme-sdk) |
| Dashboard | UI para que el merchant vea sus cobros |

---

## Arquitectura Base

```
Developer (integra SDK)
    |
    | SDK.createCharge({ amount, memo })
    v
SDK (JS library)
    |-- Circle Developer-Controlled Wallets API → crea/resuelve wallet del merchant
    |-- Genera URL: https://pay.tuapp.com?to=0x...&amount=5&memo=Pedido123
    |
    v
WhatsApp → Cliente abre link en celular
    |
    v
Payment Page (React, sin wallet requerida)
    |-- Opcion A: Conecta wallet (ConnectKit + wagmi) → transfiere USDC
    |-- Opcion B: Onramp (Circle Onramp Kit) → compra USDC con tarjeta → deposita
    |
    v
Arc Testnet — USDC ERC-20 en 0x3600...
    Transfer directo: payer → merchant wallet
```

## Ruta del Dinero

```
Payer (tarjeta o wallet)
    |
    | [A] wallet connect: USDC ya en wallet del payer
    | [B] onramp: tarjeta → Circle procesa → USDC acreditado
    |
    v
Transfer onchain: payer.address → merchant.walletAddress
    (USDC ERC-20, Arc Testnet, fee en USDC ~fracciones de centavo)
    |
    v
Circle Developer-Controlled Wallet del merchant
    |
    v
Developer puede retirar via SDK.withdraw() [MVP]
```

---

## Implementation Plan: PayLink SDK — PoC

### Summary
App de demostración del SDK de cobros por WhatsApp: el merchant genera un link de pago, lo comparte, y el cliente paga en USDC desde el navegador usando su wallet o tarjeta. Arc Testnet con wallets developer-controlled de Circle.

### Architecture
- Blockchain: Arc Testnet. USDC como gas nativo, fees predecibles, sub-segundo de finality
- Contract: ninguno en el PoC. Transfer directo ERC-20 USDC payer → merchant wallet
- Frontend: React + Tailwind. Dos vistas: Merchant panel y Payment page
- Wallet merchant: Circle Developer-Controlled Wallets (creada on-demand)
- Wallet payer: ConnectKit + placeholder de onramp (Onramp Kit en beta privada)

### Files to Create/Modify

1. `src/sdk/index.ts` — Core del SDK: `createCharge()`, `resolveWallet()`, `getStatus()`
2. `src/sdk/types.ts` — Tipos TypeScript: `Charge`, `ChargeStatus`, `SDKConfig`
3. `src/sdk/circle-wallet.ts` — Wrapper Circle Developer-Controlled Wallets: crea/resuelve wallet del merchant
4. `src/components/MerchantPanel.tsx` — Vista merchant: input monto+memo, boton generar link, link copiable y QR
5. `src/components/PaymentPage.tsx` — Vista cliente: muestra monto/memo, opciones de pago, estado de tx
6. `src/components/PayWithWallet.tsx` — Flujo wallet connect: balance USDC, transfer, polling confirmacion
7. `src/App.tsx` — Router: URL con params → PaymentPage; /merchant → MerchantPanel
8. `src/config.ts` — SDKConfig con Arc Testnet chain, USDC address, Circle API Key desde env
9. `.env` — Variables: `VITE_CIRCLE_API_KEY`, `VITE_ENTITY_SECRET`

### Build Sequence

1. Configurar `src/config.ts` y `.env` con Arc Testnet y Circle API key
2. Crear tipos SDK en `src/sdk/types.ts`
3. Implementar `src/sdk/circle-wallet.ts` — crear y resolver wallet del merchant
4. Implementar `src/sdk/index.ts` — `createCharge()` genera URL, `getStatus()` verifica tx
5. Construir `MerchantPanel.tsx` — login con API key, crear charge, mostrar link + QR
6. Construir `PayWithWallet.tsx` — ConnectKit, balance check, USDC transfer
7. Construir `PaymentPage.tsx` — parsea URL params, embebe PayWithWallet
8. Modificar `App.tsx` — routing entre las dos vistas
9. Smoke test: generar link → abrir en payment page → pagar en Arc Testnet

### Done When

- [ ] Merchant ingresa monto y memo, obtiene URL copiable
- [ ] La URL abre la Payment Page con monto y memo pre-populados
- [ ] Cliente conecta wallet, ve balance USDC, confirma el pago
- [ ] La transferencia USDC llega a la wallet developer-controlled del merchant en Arc Testnet
- [ ] Payment Page muestra confirmacion con tx hash y link al explorer
- [ ] El SDK exporta `createCharge()` y `getStatus()` usables con 3-4 lineas de codigo

---

## Notes

- Circle Developer-Controlled Wallet requiere API Key y Entity Secret registrado en console.circle.com
- Onramp Kit (pago con tarjeta) esta en beta privada — se construye placeholder con instrucciones de activacion
- Entity secret NO debe estar en el cliente en produccion — aceptable solo para este PoC demo
