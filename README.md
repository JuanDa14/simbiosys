# Simbiosys Orders — Gestión de Órdenes e Inventario

Full-stack del examen práctico: **SQL Server** + **.NET 8 Web API** + **React Native (Expo / TypeScript)**.

## Requisitos

- Docker (SQL Server)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js 20+ y npm
- Expo Go (dispositivo) o emulador iOS/Android

## 1. Base de datos

### Levantar SQL Server

```bash
docker compose up -d
```

Credenciales locales (solo desarrollo):

| Campo | Valor |
|-------|--------|
| Server | `localhost,1433` |
| User | `sa` |
| Password | `Simbiosys_Str0ng!` |
| Database | `SimbiosysOrdersDB` (se crea al aplicar el script) |

### Aplicar schema + seed

El archivo [`database/schema.sql`](database/schema.sql) crea:

- Tablas `Productos`, `Pedidos`, `DetallePedidos`
- TVP `DetallePedidoType`
- Stored procedure `sp_RegistrarPedido` (transacción + validación/descuento de stock)
- 8 productos de prueba

**Desde el contenedor:**

```bash
docker exec -i simbiosys-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Simbiosys_Str0ng!' -C \
  < database/schema.sql
```

**Con sqlcmd local / Azure Data Studio / SSMS:** abrir y ejecutar `database/schema.sql` contra el servidor.

> Volver a ejecutar el script recrea las tablas (borra datos previos) e inserta el seed de nuevo.

## 2. API .NET 8

```bash
cd backend/Simbiosys.Api
dotnet restore
dotnet run
```

- URL: `http://localhost:5080` (escucha en `0.0.0.0:5080`)
- Connection string: `appsettings.json` → `ConnectionStrings:DefaultConnection`
- CORS habilitado para el cliente móvil

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/productos` | Catálogo con stock |
| `GET` | `/api/v1/pedidos` | Historial de pedidos + detalle |
| `POST` | `/api/v1/pedidos` | Registrar pedido (invoca `sp_RegistrarPedido`) |

Ejemplo `POST`:

```bash
curl -X POST http://localhost:5080/api/v1/pedidos \
  -H 'Content-Type: application/json' \
  -d '{
    "cliente": "Cliente Demo",
    "items": [
      { "productoId": 1, "cantidad": 1 },
      { "productoId": 2, "cantidad": 2 }
    ]
  }'
```

- **201 Created** si el pedido se registra
- **400 Bad Request** con `{ "message": "..." }` si falla validación o stock

## 3. App móvil (Expo + TypeScript)

```bash
cd mobile
npm install
npx expo start
```

### URL base de la API

Por defecto: `http://localhost:5080` ([`mobile/src/config.ts`](mobile/src/config.ts)).

Sobrescribir con variable de entorno:

```bash
# iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:5080 npx expo start

# Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 npx expo start

# Dispositivo físico (misma Wi‑Fi): usa la IP LAN de tu Mac/PC
EXPO_PUBLIC_API_URL=http://192.168.x.x:5080 npx expo start
```

### Pantallas

1. **Pedido** — catálogo, carrito, total en vivo, cliente, confirmar (alertas éxito/error)
2. **Historial** — lista de pedidos, loading / vacío / error, pull-to-refresh y botón Recargar

Arquitectura TS: `src/types`, `src/services/api.ts`, `src/screens/*`.

## Estructura

```
simbiosys/
  database/schema.sql
  docker-compose.yml
  backend/Simbiosys.Api/     # Web API .NET 8 + Dapper
  mobile/                    # Expo React Native (TypeScript)
  README.md
```

## Entrega

Excluir `node_modules`, `bin/` y `obj/` (ya cubiertos por `.gitignore`). Incluir este README y `database/schema.sql`.
