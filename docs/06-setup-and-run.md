# Setup & Run

Getting AutoFix running on a clean machine.

---

## 1. Prerequisites

| Tool               | Version                    | Check              |
| ------------------ | -------------------------- | ------------------ |
| .NET SDK           | 10.0+                      | `dotnet --version` |
| Node.js            | 20+                        | `node --version`   |
| SQL Server         | 2019+ or LocalDB / Express |                    |
| An AI provider key | Groq (free tier) or OpenAI |                    |
| Ollama _(optional)_ | For the local AI model     | `ollama --version` |

---

## 2. Backend

### Clone and configure

```bash
cd Auto-Garage-Solution/Auto-Garage
```

Create `appsettings.Development.json` — **this file is gitignored and must never be committed**:

```jsonc
{
	"ConnectionStrings": {
		"AutoGarageDbConnection": "Server=.;Database=AutoGarage;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;",
		"AutoGarageAuthDbConnection": "Server=.;Database=AutoGarageAuth;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;",
	},
	"Jwt": {
		"Key": "<a random string of at least 32 characters>",
		"Issuer": "https://localhost:7224/",
		"Audience": "https://localhost:7224/",
	},
	"Assistant": {
		"Cloud": {
			"BaseUrl": "https://api.groq.com/openai/v1",
			"Model": "openai/gpt-oss-120b",
			"ApiKey": "<your provider key>",
		},
	},
}
```

> The JWT key signs every token — treat it like a password. HS256 needs at least 256 bits, so use 32+ characters.

The `Local` provider needs no entry here — its defaults in `appsettings.json` already point at Ollama on `localhost:11434`, and a local endpoint has no API key.

### Create the databases

There are **two** DbContexts, so each needs its own migration run:

```bash
dotnet ef database update --context AutoGarageAuthDbContext
```

```bash
dotnet ef database update --context AutoGarageDbContext
```

If `dotnet ef` is missing:

```bash
dotnet tool install --global dotnet-ef
```

### Run

```bash
dotnet run
```

The API listens on `https://localhost:7224`, and Swagger is at `https://localhost:7224/swagger` in Development.

---

## 3. The local AI model (optional)

The assistant can answer on a model running on your own machine instead of Groq. It is slower and less capable, but free, private, and immune to the daily quota. Skip this and everything still works — the toggle simply will not appear.

Install [Ollama](https://ollama.com/download), then:

```bash
ollama pull llama3.2:3b
```

~2GB. Verify it is serving the OpenAI-compatible endpoint the backend expects:

```bash
curl http://localhost:11434/v1/models
```

> **Use a model trained for tool calling.** `llama3.2:3b` returns a proper `tool_calls` array. A same-size coding model such as `qwen2.5-coder:3b` prints the tool call as plain text instead, which the assistant would show the customer as raw JSON. → [05 §8.5](05-ai-assistant.md#85-3b-is-not-a-specification)

Change the model in `appsettings.json` under `Assistant:Local:Model`. Larger models call tools more reliably but need more VRAM — `llama3.2:3b` fits comfortably in 4GB.

---

## 4. Frontend

```bash
cd AutoFix
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

```
VITE_API_BASE_URL=https://localhost:7224/api
VITE_AUTH_BASE_URL=https://localhost:7224/api/Auth
```

> **Never put a provider API key in a `VITE_`-prefixed variable.** Vite inlines them into the JavaScript bundle at build time, so they are readable by anyone who opens DevTools. This project made that mistake once — see [05 §8.1](05-ai-assistant.md#81-the-api-key-that-shipped-to-the-browser).

```bash
npm run dev
```

The app runs at **`http://localhost:7600`** and opens automatically (`server.port` and `server.open` in `vite.config.js`).

### The dev proxy

`vite.config.js` proxies `/api` to `https://localhost:7224` with `secure: false`, so the backend's self-signed certificate is accepted in development.

This exists for a specific reason: it makes API calls look **same-origin** to the browser, which is what lets the HTTP-only refresh cookie work in dev without fighting `SameSite` rules. If you bypass the proxy by pointing `VITE_API_BASE_URL` straight at the backend origin, expect cookie problems.

---

## 5. First run

1. **Register a customer** at `/login` — self-registration creates a Customer.
2. **Create an Admin.** There is no admin self-registration; `POST /api/auth/register-staff` requires an existing Admin. Bootstrap the first one by inserting a row into the `AspNetUserRoles` table of `AutoGarageAuth`, or by temporarily relaxing the `[Authorize]` on that endpoint (and putting it back).
3. **As Admin, add service types** — the catalogue starts empty, and without it customers cannot book and the AI assistant has nothing to recommend.
4. **As Admin, create a Mechanic** via staff registration.
5. **As Customer**, add a vehicle and book a service.
6. **Try the assistant** — _"my brakes are squealing"_.

---

## 6. Common problems

**CORS errors in the browser**
The `AllowFrontend` policy in `Program.cs` must list your frontend origin, and `AllowCredentials` must be on — without it the refresh cookie is silently dropped.

**Login works, then every request 401s**
Usually the refresh cookie. It is set `Secure` and `SameSite=None`, so it requires HTTPS. Check the API is on `https://`, and that `credentials: 'include'` is reaching the request.

**`dotnet ef` fails with "more than one DbContext"**
Pass `--context` explicitly, as shown above.

**The assistant returns 503**
Check `Logs/error-<date>.txt` — the provider's real error is logged there, never sent to the browser. The usual causes are a missing or revoked key, or a rate limit.

**The assistant returns 429**
Cloud quota exhausted. Groq's free tier limits are per model _and_ per day, so switching model gives a fresh allowance immediately. With Ollama installed the assistant falls back to the local model instead of failing. → [05 §8.3](05-ai-assistant.md#83-rate-limits-and-a-retry-that-made-things-worse)

**The Cloud / Local toggle does not appear**
It only shows when more than one provider is actually reachable. Check `ollama list` shows the model named in `Assistant:Local:Model`, and that `curl http://localhost:11434/v1/models` answers. `GET /api/assistant/providers` reports what the backend can see.

**The local model replies with raw JSON instead of doing anything**
The model is emitting tool calls as text rather than a `tool_calls` array — it has no tool-calling chat template. Use `llama3.2:3b` rather than a coding model of the same size. → [05 §8.5](05-ai-assistant.md#85-3b-is-not-a-specification)

**The local model times out**
`Assistant:Local:TimeoutSeconds` defaults to 180. A booking can take several model round trips, and a model that does not fit in VRAM spills to CPU and slows by an order of magnitude. Check with `ollama ps` — `100% GPU` is what you want.

**Port already in use**
The API port is in `Properties/launchSettings.json`. If you change it, update `VITE_API_BASE_URL` and the CORS policy to match.

---

## 7. Building for production

```bash
npm run build                      # frontend → dist/
```

```bash
dotnet publish -c Release          # backend
```

Before deploying:

- [ ] Move every secret to environment variables or user-secrets — not `appsettings.json`
- [ ] Set a fresh JWT key; never reuse the development one
- [ ] Set the CORS policy to the real frontend origin
- [ ] Re-enable `UseHttpsRedirection()` (currently commented out in `Program.cs`)
- [ ] Confirm no provider key appears in `dist/` — `grep -r "gsk_\|sk-" dist/` should find nothing

---

_Next: [KT Guide](07-KT-guide.md)_
