# bun-ai-api

API unificada para servicios de inteligencia artificial con balanceo automático entre proveedores.

## Descripción

Este proyecto proporciona una capa de abstracción sobre múltiples servicios de IA (actualmente Groq y Cerebras), permitiendo realizar consultas sin preocuparse por qué proveedor se utiliza. El sistema alterna automáticamente entre servicios usando round-robin, lo que permite **racionar el uso de tokens** entre los free tiers de cada proveedor.

## Características

- **Multi-proveedor**: Soporte para Groq y Cerebras (extensible a más servicios)
- **Balanceo round-robin**: Distribuye las peticiones equitativamente entre proveedores
- **Streaming**: Respuestas en tiempo real usando Server-Sent Events (SSE)
- **Optimizado para free tier**: Maximiza el uso de tokens gratuitos alternando entre servicios
- **Construido con Bun**: Rendimiento nativo, sin dependencias pesadas

## Requisitos

- [Bun](https://bun.sh) v1.0+
- API Key de [Groq](https://console.groq.com)
- API Key de [Cerebras](https://cloud.cerebras.ai)

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd bun-ai-api

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys
```

## Configuración

Crea un archivo `.env` con las siguientes variables:

```env
GROQ_API_KEY=tu_api_key_de_groq
CEREBRAS_API_KEY=tu_api_key_de_cerebras
PORT=3000  # opcional, por defecto 3000
```

## Uso

### Iniciar el servidor

```bash
# Desarrollo (con hot reload)
bun run dev

# Producción
bun run start
```

### Realizar una consulta

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Hola, ¿cómo estás?" }
    ]
  }'
```

La respuesta se envía como stream SSE.

## API

### POST /chat

Envía mensajes al modelo de IA y recibe una respuesta en streaming.

**Request Body:**

```json
{
  "messages": [
    { "role": "system", "content": "Eres un asistente útil" },
    { "role": "user", "content": "Tu mensaje aquí" }
  ]
}
```

**Response:** Server-Sent Events (text/event-stream)

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cliente   │────▶│  bun-ai-api  │────▶│    Groq     │
└─────────────┘     │  (round-robin)│     └─────────────┘
                    │              │     ┌─────────────┐
                    │              │────▶│  Cerebras   │
                    └──────────────┘     └─────────────┘
```

El servidor alterna entre servicios en cada petición:
1. Primera petición → Groq
2. Segunda petición → Cerebras
3. Tercera petición → Groq
4. ...y así sucesivamente

## Servicios Configurados

| Servicio | Modelo | Max Tokens |
|----------|--------|------------|
| Groq | moonshotai/kimi-k2-instruct-0905 | 4,096 |
| Cerebras | zai-glm-4.6 | 40,960 |

## Agregar un nuevo servicio

1. Crea un archivo en `services/nuevo-servicio.ts`
2. Implementa la interfaz `AIService`:

```typescript
import type { AIService, ChatMessage } from "../types";

export const nuevoServicio: AIService = {
  name: "NuevoServicio",
  chat: async function* (messages: ChatMessage[]) {
    // Tu implementación aquí
    // yield chunks de texto
  }
};
```

3. Agrégalo al array de servicios en `index.ts`:

```typescript
import { nuevoServicio } from "./services/nuevo-servicio";

const services: AIService[] = [groqService, cerebrasService, nuevoServicio];
```

## Licencia

MIT
