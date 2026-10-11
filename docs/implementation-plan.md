Perfecto. Empiezo leyendo los archivos clave antes de tocar nada. Tengo todo el contexto. Veo exactamente los gaps y qué hay que cambiar. Arranco. **Paso 1 — Limpiar MerchantPanel.tsx.** El dashboard ya reemplazó toda su funcionalidad. Solo queda el `CredentialsForm` que `App.tsx` importa. Reemplazo el archivo entero con solo ese componente. `App.tsx` importa `CredentialsForm` desde `MerchantPanel`. Muevo ese componente a su propio archivo limpio y actualizo el import. Extraigo `CredentialsForm` a su propio archivo, elimino `MerchantPanel.tsx`, y actualizo el import en `App.tsx` — todo en paralelo.Estamos en Plan mode — no puedo escribir archivos desde aquí. Necesitas cambiar a **Build mode** con el selector de modo para que pueda ejecutar toda esta limpieza y conexión al contrato.

Mientras tanto, aquí está el plan exacto de lo que haré en Build mode para que lo tengas claro:

---

## Plan de limpieza técnica + conexión al contrato

### 1. Limpiar `MerchantPanel.tsx`
Extraer `CredentialsForm` a `src/components/CredentialsForm.tsx` (archivo propio, limpio). Eliminar `MerchantPanel.tsx` completo (19KB de código muerto). Actualizar el import en `App.tsx`.

### 2. Conectar `USDCArcProvider` al contrato `PaymentRouter`
`createCharge()` actualmente genera solo una URL con `?to=address`. En su lugar debe:
1. Llamar a `PaymentRouter.createOrder()` on Arc Testnet con los parámetros del pedido y la firma del owner
2. Recibir la `vault address` (determinista vía CREATE2)
3. Construir la URL con `?vault=0x...&amount=X&memo=Y&chargeId=uuid`

El `Charge` type agrega el campo `vaultAddress`.

### 3. Actualizar `PaymentPage`
- Leer `?vault=` desde la URL en vez de `?to=`
- Mostrar estado onchain del vault (llamar `balanceOf(vault)` para ver si ya tiene saldo)
- Después del transfer, llamar `vault.settle()` para triggerear el sweep

### 4. Actualizar `PayWithWallet`
- Enviar el transfer USDC a `vaultAddress` en vez de `merchantAddress`
- Después de confirmación, llamar `settle()` en el vault

### 5. Lint & typecheck

Cambia a Build mode y lo ejecuto todo.
