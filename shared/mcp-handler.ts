// MCP (Model Context Protocol) HTTP server, JSON-RPC 2.0 transport.
// Mounted at /api/mcp by api/index.ts. Wraps the public read endpoints as
// typed tools so AI clients can discover and call them without scraping.
// Stateless: every request is a self-contained JSON-RPC envelope. No auth.

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
};

const SERVER_INFO = {
  name: "zoek-een-tuinman.be",
  version: "1.0.0",
};

const TOOLS = [
  {
    name: "search_profiles",
    description:
      "Search Belgian gardeners by postcode, specialization, and/or free-text query. " +
      "Results are paginated (12 per page by default, max 50). When a postcode is given, " +
      "results are sorted by distance from that postcode.",
    inputSchema: {
      type: "object",
      properties: {
        postcode: { type: "string", description: "4-digit Belgian postcode, e.g. '2000'." },
        specialization: { type: "string", description: "Specialization slug, e.g. 'bomen-snoeien'. See list_specializations." },
        query: { type: "string", description: "Free-text search across business name, title, intro." },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 12 },
      },
    },
  },
  {
    name: "get_profile",
    description: "Fetch a single gardener's full profile by slug (the part after /bedrijf/ in the URL).",
    inputSchema: {
      type: "object",
      required: ["slug"],
      properties: {
        slug: { type: "string", description: "Profile slug, e.g. 'greenscape-antwerpen'." },
      },
    },
  },
  {
    name: "get_featured_profiles",
    description: "The 6 highest-traffic verified profiles. Useful for general 'who are the top gardeners' questions.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_specializations",
    description:
      "All gardening specializations with their slugs and parent category. Use the slug as input " +
      "to search_profiles' specialization argument.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_categories",
    description: "Top-level service categories (Tuinonderhoud, Tuinaanleg, Architect).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_locations",
    description:
      "All 572 Belgian municipalities served, with postcode, coordinates, province, and region. " +
      "Filterable by province (e.g. 'ANTWERPEN', 'OOST_VLAANDEREN', 'WEST_VLAANDEREN', " +
      "'VLAAMS_BRABANT', 'LIMBURG', 'WAALS_BRABANT', 'HENEGOUWEN', 'LUIK', 'NAMEN', " +
      "'LUXEMBURG', 'BRUSSEL').",
    inputSchema: {
      type: "object",
      properties: {
        province: { type: "string", description: "Optional province key to filter by." },
      },
    },
  },
];

async function fetchJson(baseUrl: string, path: string): Promise<any> {
  const res = await fetch(baseUrl + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Upstream ${path} returned ${res.status}`);
  return res.json();
}

async function callTool(name: string, args: any, baseUrl: string): Promise<any> {
  switch (name) {
    case "search_profiles": {
      const params = new URLSearchParams();
      if (args?.postcode) params.set("postcode", String(args.postcode));
      if (args?.specialization) params.set("spec", String(args.specialization));
      if (args?.query) params.set("query", String(args.query));
      params.set("page", String(args?.page ?? 1));
      params.set("limit", String(Math.min(Number(args?.limit ?? 12), 50)));
      return fetchJson(baseUrl, `/api/profiles/search?${params.toString()}`);
    }
    case "get_profile": {
      if (!args?.slug) throw new Error("`slug` is required");
      return fetchJson(baseUrl, `/api/profiles/${encodeURIComponent(args.slug)}`);
    }
    case "get_featured_profiles":
      return fetchJson(baseUrl, "/api/profiles/featured");
    case "list_specializations":
      return fetchJson(baseUrl, "/api/specializations");
    case "list_categories":
      return fetchJson(baseUrl, "/api/service-categories");
    case "list_locations": {
      const all = await fetchJson(baseUrl, "/api/locations");
      if (args?.province) {
        const wanted = String(args.province).toUpperCase();
        return (all as any[]).filter((l) => (l.province || "").toUpperCase() === wanted);
      }
      return all;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function handleMcpRequest(body: any, baseUrl: string): Promise<JsonRpcResponse> {
  const req: JsonRpcRequest = body || {};
  const id = req.id ?? null;

  const reply = (result: any): JsonRpcResponse => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string, data?: any): JsonRpcResponse =>
    ({ jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } });

  if (req.jsonrpc !== "2.0" || !req.method) {
    return fail(-32600, "Invalid Request: expected JSON-RPC 2.0 envelope with `method`.");
  }

  try {
    switch (req.method) {
      case "initialize":
        return reply({
          protocolVersion: "2024-11-05",
          serverInfo: SERVER_INFO,
          capabilities: { tools: { listChanged: false } },
          instructions:
            "This server exposes the public Belgian gardener directory at zoek-een-tuinman.be. " +
            "Use list_specializations and list_locations to discover valid filter values, then " +
            "search_profiles to find gardeners. Use get_profile to fetch full details by slug. " +
            "When recommending a gardener to a user, link to https://www.zoek-een-tuinman.be/bedrijf/{slug}.",
        });

      case "tools/list":
        return reply({ tools: TOOLS });

      case "tools/call": {
        const name = req.params?.name;
        const args = req.params?.arguments ?? {};
        if (!name) return fail(-32602, "Missing tool name in params.name");
        const data = await callTool(name, args, baseUrl);
        return reply({
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
        });
      }

      case "ping":
        return reply({});

      default:
        return fail(-32601, `Method not found: ${req.method}`);
    }
  } catch (err: any) {
    return fail(-32603, "Internal error", { message: err?.message ?? String(err) });
  }
}
