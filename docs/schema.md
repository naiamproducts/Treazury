# Vendify — Schema Supabase multi-tenant

> Referencia del modelo de datos. Cada tabla tiene `tenant_id` y RLS.

---

## Convenciones

- `id`: `uuid DEFAULT gen_random_uuid()`
- `created_at`: `timestamptz DEFAULT now()`
- `updated_at`: `timestamptz DEFAULT now()` + trigger `moddatetime`
- Toda FK a `tenants(id)` usa `ON DELETE CASCADE`
- Columnas de dinero: `numeric(18,6)` (6 decimales, compatible con USDC)
- Enums en Postgres (no strings libres) para estados

---

## Tablas

### `tenants`
```sql
CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  -- Identidad
  slug            text UNIQUE NOT NULL,          -- subdominio / handle
  business_name   text NOT NULL,
  logo_url        text,

  -- Acceso
  owner_id        uuid NOT NULL REFERENCES auth.users(id),
  is_approved     boolean DEFAULT false,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES auth.users(id),

  -- Config de cobros
  default_payment_provider  text DEFAULT 'usdc_arc',  -- PaymentProviderKind
  merchant_wallet_id        text,                -- Circle wallet id
  merchant_wallet_address   text,               -- 0x...

  -- Config fiscal
  country         text NOT NULL DEFAULT 'VE',   -- CountryCode
  tax_id          text,                          -- RIF/CUIT/RFC
  address         text,
  invoice_prefix  text DEFAULT 'F',
  next_invoice_number  integer DEFAULT 1,

  -- Configuración extra por país (JSONB flexible)
  fiscal_config   jsonb DEFAULT '{}'::jsonb
);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_own_tenant" ON tenants
  FOR ALL USING (owner_id = auth.uid());
```

### `tenant_members`
```sql
-- Permite múltiples usuarios por tenant (admin, vendedor, solo lectura)
CREATE TABLE tenant_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'viewer',   -- 'owner' | 'admin' | 'seller' | 'viewer'
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_member_isolation" ON tenant_members
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );
```

### `contacts`
```sql
-- Compradores del proveedor (clientes del tenant)
CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  name            text NOT NULL,
  phone           text,                  -- E.164: +584121234567
  email           text,
  tax_id          text,                  -- RIF del comprador si aplica
  address         text,
  notes           text,

  -- Metadata
  tags            text[] DEFAULT '{}',
  is_active       boolean DEFAULT true
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_tenant_isolation" ON contacts
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE INDEX contacts_tenant_id_idx ON contacts(tenant_id);
CREATE INDEX contacts_phone_idx ON contacts(tenant_id, phone);
```

### `products`
```sql
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  name            text NOT NULL,
  description     text,
  sku             text,
  image_url       text,
  unit            text DEFAULT 'unidad',     -- 'unidad', 'kg', 'par', 'caja', etc.

  -- Precios
  price           numeric(18,6) NOT NULL,    -- precio base en USD/USDC
  tax_rate        numeric(5,4) DEFAULT 0.16, -- IVA 16% Venezuela
  currency        text DEFAULT 'USD',

  -- Control
  is_active       boolean DEFAULT true,
  stock           integer,                   -- null = sin control de stock

  -- Metadata extra (atributos personalizados del producto)
  attributes      jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_tenant_isolation" ON products
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE INDEX products_tenant_id_idx ON products(tenant_id);
```

### `orders`
```sql
CREATE TYPE order_status AS ENUM (
  'draft',        -- en edición
  'quoted',       -- cotización enviada al comprador
  'confirmed',    -- comprador confirmó
  'invoiced',     -- factura generada
  'charged',      -- link de pago enviado
  'paid',         -- pago confirmado
  'cancelled'
);

CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES contacts(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  -- Número legible (ORDER-0001)
  order_number    text NOT NULL,
  status          order_status DEFAULT 'draft',

  -- Totales calculados (desnormalizados para queries rápidas)
  subtotal        numeric(18,6) DEFAULT 0,
  tax_amount      numeric(18,6) DEFAULT 0,
  igtf_amount     numeric(18,6) DEFAULT 0,   -- específico Venezuela
  total           numeric(18,6) DEFAULT 0,
  currency        text DEFAULT 'USD',

  -- Refs externas
  invoice_id      uuid,                      -- FK a invoices
  notes           text,

  -- Canal de origen
  source          text DEFAULT 'dashboard',  -- 'dashboard' | 'whatsapp' | 'api'
  whatsapp_thread_id  text                   -- para fase 2
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_tenant_isolation" ON orders
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE INDEX orders_tenant_id_idx ON orders(tenant_id);
CREATE INDEX orders_status_idx ON orders(tenant_id, status);
```

### `order_lines`
```sql
CREATE TABLE order_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id),
  created_at      timestamptz DEFAULT now(),

  -- Snapshot del producto al momento del pedido
  description     text NOT NULL,
  unit            text,
  quantity        numeric(18,6) NOT NULL,
  unit_price      numeric(18,6) NOT NULL,
  tax_rate        numeric(5,4) DEFAULT 0.16,
  line_total      numeric(18,6) NOT NULL     -- quantity * unit_price
);

-- Sin RLS propia: se accede siempre a través de orders
```

### `invoices`
```sql
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',       -- generada y enviable
  'paid',
  'cancelled',
  'voided'
);

CREATE TABLE invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id            uuid NOT NULL REFERENCES orders(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  invoice_number      text NOT NULL,   -- F-000001
  status              invoice_status DEFAULT 'draft',
  issued_at           timestamptz,

  -- Snapshot de cabecera (datos fiscales al momento de emisión)
  tenant_snapshot     jsonb NOT NULL,  -- { business_name, tax_id, address, ... }
  buyer_snapshot      jsonb NOT NULL,  -- { name, tax_id, address, ... }

  -- Totales
  subtotal            numeric(18,6),
  tax_amount          numeric(18,6),
  igtf_amount         numeric(18,6),
  total               numeric(18,6),
  currency            text DEFAULT 'USD',

  -- Venezuela específico
  numero_control      text,            -- 00-000001
  fiscal_data         jsonb DEFAULT '{}'::jsonb,  -- CAE (AR), UUID (MX), etc.

  -- Assets
  pdf_url             text,            -- Supabase Storage
  xml_url             text             -- CFDI México en fase 2
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_tenant_isolation" ON invoices
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
```

### `charges`
```sql
CREATE TYPE charge_status AS ENUM (
  'pending',
  'paid',
  'expired',
  'failed',
  'cancelled'
);

CREATE TABLE charges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id            uuid REFERENCES orders(id),
  invoice_id          uuid REFERENCES invoices(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Provider
  payment_provider    text NOT NULL DEFAULT 'usdc_arc',  -- PaymentProviderKind
  provider_ref        text,           -- id interno del provider

  -- Monto
  amount              numeric(18,6) NOT NULL,
  currency            text DEFAULT 'USD',
  recipient_address   text,           -- para providers onchain

  -- Link compartido
  payment_url         text NOT NULL,
  expires_at          timestamptz,

  -- Estado
  status              charge_status DEFAULT 'pending',
  paid_at             timestamptz,

  -- Para providers onchain
  tx_hash             text,
  block_number        bigint,

  -- Memo legible
  memo                text
);

ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charge_tenant_isolation" ON charges
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE INDEX charges_tenant_id_idx ON charges(tenant_id);
CREATE INDEX charges_status_idx ON charges(tenant_id, status);
CREATE INDEX charges_order_id_idx ON charges(order_id);
```

### `payments`
```sql
-- Registro inmutable de cada pago recibido
CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  charge_id           uuid NOT NULL REFERENCES charges(id),
  created_at          timestamptz DEFAULT now(),

  amount              numeric(18,6) NOT NULL,
  currency            text DEFAULT 'USD',
  payment_provider    text NOT NULL,
  provider_ref        text NOT NULL,     -- tx hash, payment id externo, etc.
  paid_at             timestamptz NOT NULL,

  -- Para providers onchain
  tx_hash             text,
  from_address        text,
  block_number        bigint,
  chain_id            integer,

  -- Raw del webhook / evento del provider (para auditoría)
  raw_event           jsonb
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_tenant_isolation" ON payments
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
```

---

## Índices adicionales

```sql
-- Búsqueda rápida de charges por tx_hash (para webhooks onchain)
CREATE INDEX charges_tx_hash_idx ON charges(tx_hash) WHERE tx_hash IS NOT NULL;

-- Búsqueda de tenants por wallet address (para validar pagos entrantes)
CREATE INDEX tenants_wallet_address_idx ON tenants(merchant_wallet_address)
  WHERE merchant_wallet_address IS NOT NULL;
```

---

## Trigger: updated_at automático

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON charges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Notas de seguridad

- **Nunca** exponer `tenant_id` en URLs públicas — usar `charge.id` (opaco) en el payment link.
- **Nunca** almacenar entity secret o private key en Supabase — viven en Railway env vars.
- Los `tenant_snapshot` y `buyer_snapshot` en `invoices` son inmutables una vez emitida la factura: el nombre comercial puede cambiar, la factura no.
- El campo `raw_event` en `payments` facilita auditoría y re-procesamiento de webhooks, pero no debe exponerse al frontend.
