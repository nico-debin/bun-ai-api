# bun-ai-api

API unificada para servicios de inteligencia artificial con balanceo automático entre proveedores.

## Descripción

Este proyecto proporciona una capa de abstracción sobre múltiples servicios de IA, permitiendo realizar consultas sin preocuparse por qué proveedor se utiliza. El sistema alterna automáticamente entre servicios usando round-robin, lo que permite **racionar el uso de tokens** entre los free tiers de cada proveedor.

## Características

- **Multi-proveedor**: Soporte para 7 servicios de IA (Groq, Cerebras, Mistral, OpenRouter, SambaNova, Gemini, Cloudflare)
- **Balanceo round-robin**: Distribuye las peticiones equitativamente entre proveedores
- **Streaming**: Respuestas en tiempo real usando Server-Sent Events (SSE)
- **Optimizado para free tier**: Maximiza el uso de tokens gratuitos alternando entre servicios
- **Construido con Bun**: Rendimiento nativo, sin dependencias pesadas

## Requisitos

- [Bun](https://bun.sh) v1.0+
- API Keys de los servicios que desees usar (ver sección de configuración)

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

Crea un archivo `.env` con las siguientes variables (solo necesitas las de los servicios que vayas a usar):

```env
# Servicios principales
GROQ_API_KEY=tu_api_key_de_groq
CEREBRAS_API_KEY=tu_api_key_de_cerebras

# Servicios adicionales
MISTRAL_API_KEY=tu_api_key_de_mistral
OPENROUTER_API_KEY=tu_api_key_de_openrouter
SAMBANOVA_API_KEY=tu_api_key_de_sambanova
GEMINI_API_KEY=tu_api_key_de_gemini

# Cloudflare Workers AI
CF_ACCOUNT_ID=tu_account_id_de_cloudflare
CF_API_TOKEN=tu_api_token_de_cloudflare

# Configuración del servidor
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

Envía mensajes al modelo de IA.

**Request Body:**

```json
{
  "messages": [
    { "role": "system", "content": "Eres un asistente útil" },
    { "role": "user", "content": "Tu mensaje aquí" }
  ],
  "stream": true
}
```

**Parámetros:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `messages` | array | requerido | Array de mensajes con `role` y `content` |
| `stream` | boolean | `true` | Si `true`, respuesta SSE. Si `false`, respuesta JSON |

**Response con `stream: true` (default):**

```
Content-Type: text/event-stream
```
Respuesta en chunks de texto en tiempo real.

**Response con `stream: false`:**

```json
{
  "content": "La respuesta completa del modelo..."
}
```
Ideal para integraciones con n8n, Zapier, etc.

## Arquitectura

```
                         ┌─────────────┐
                    ┌───▶│    Groq     │
                    │    └─────────────┘
                    │    ┌─────────────┐
                    ├───▶│  Cerebras   │
                    │    └─────────────┘
                    │    ┌─────────────┐
┌─────────────┐     │    │   Mistral   │
│   Cliente   │────▶├───▶└─────────────┘
└─────────────┘     │    ┌─────────────┐
                    ├───▶│ OpenRouter  │
  bun-ai-api        │    └─────────────┘
  (round-robin)     │    ┌─────────────┐
                    ├───▶│  SambaNova  │
                    │    └─────────────┘
                    │    ┌─────────────┐
                    ├───▶│   Gemini    │
                    │    └─────────────┘
                    │    ┌─────────────┐
                    └───▶│ Cloudflare  │
                         └─────────────┘
```

El servidor alterna entre servicios en cada petición usando round-robin.

## Servicios Configurados

| Servicio | Modelo | Free Tier | Obtener API Key |
|----------|--------|-----------|-----------------|
| Groq | moonshotai/kimi-k2-instruct-0905 | ~14,400 req/día | [console.groq.com](https://console.groq.com) |
| Cerebras | zai-glm-4.6 | Variable | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| Mistral | mistral-small-latest | 1B tokens/mes | [console.mistral.ai](https://console.mistral.ai) |
| OpenRouter | llama-3.3-70b-instruct:free | 50-1000 req/día | [openrouter.ai](https://openrouter.ai) |
| SambaNova | Meta-Llama-3.1-70B-Instruct | $5 en créditos | [cloud.sambanova.ai](https://cloud.sambanova.ai) |
| Gemini | gemini-1.5-flash | 25 req/día | [aistudio.google.com](https://aistudio.google.com) |
| Cloudflare | llama-3.1-8b-instruct | 10K neurons/día | [dash.cloudflare.com](https://dash.cloudflare.com) |

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

const services: AIService[] = [..., nuevoServicio];
```

## Licencia

MIT
