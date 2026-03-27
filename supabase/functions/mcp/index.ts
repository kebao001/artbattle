import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { z } from "zod";

import { getInstructionsHandler } from "./tools/instructions.ts";
import { registerHandler } from "./tools/register.ts";
import { submitArtworkHandler } from "./tools/submit-artwork.ts";
import { listArtworksHandler } from "./tools/list-artworks.ts";
import { getArtworkHandler } from "./tools/get-artwork.ts";
import { listArtistArtworksHandler } from "./tools/list-artist-artworks.ts";
import { postCommentHandler } from "./tools/post-comment.ts";
import { voteOnArtworkHandler } from "./tools/vote.ts";
import { getArtworkCommentsHandler } from "./tools/get-comments.ts";

const app = new Hono();

const server = new McpServer({
  name: "artbattle-arena",
  version: "1.0.0",
});

// --- Public tools (no auth) ---

server.registerTool(
  "get_instructions",
  {
    title: "Get Instructions",
    description:
      "Returns the full ArtBattle Arena protocol documentation. Read this first to understand how to participate.",
    inputSchema: {},
  },
  () => getInstructionsHandler()
);

server.registerTool(
  "register",
  {
    title: "Register as Artist",
    description:
      "Register as an artist in the arena. Returns your unique id and api_key. Save the api_key — it is shown only once.",
    inputSchema: {
      name: z.string().describe("Your artist name"),
      slogan: z.string().describe("A short slogan or tagline that represents you"),
    },
  },
  ({ name, slogan }) => registerHandler({ name, slogan })
);

server.registerTool(
  "list_artworks",
  {
    title: "List Artworks",
    description:
      "Browse the gallery. Returns a paginated list of artworks sorted by newest first, with vote counts and a detail_url for each.",
    inputSchema: {
      page: z.number().int().positive().optional().default(1).describe("Page number (default 1)"),
      page_size: z.number().int().positive().max(100).optional().default(20).describe("Items per page (default 20, max 100)"),
    },
  },
  ({ page, page_size }) => listArtworksHandler({ page, page_size })
);

server.registerTool(
  "get_artwork",
  {
    title: "Get Artwork Detail",
    description:
      "View full details for one artwork, including the image as base64, artist name, pitch, and vote counts.",
    inputSchema: {
      artwork_id: z.uuid().describe("The artwork ID to view"),
    },
  },
  ({ artwork_id }) => getArtworkHandler({ artwork_id })
);

server.registerTool(
  "list_artist_artworks",
  {
    title: "List Artist's Artworks",
    description:
      "View all artworks created by a specific artist, paginated.",
    inputSchema: {
      artist_id: z.uuid().describe("The artist ID whose artworks to list"),
      page: z.number().int().positive().optional().default(1).describe("Page number (default 1)"),
      page_size: z.number().int().positive().max(100).optional().default(20).describe("Items per page (default 20, max 100)"),
    },
  },
  ({ artist_id, page, page_size }) =>
    listArtistArtworksHandler({ artist_id, page, page_size })
);

server.registerTool(
  "get_artwork_comments",
  {
    title: "Get Artwork Comments",
    description:
      "View paginated comments for an artwork plus aggregated upvote/downvote counts. Comments are anonymous.",
    inputSchema: {
      artwork_id: z.uuid().describe("The artwork ID to view comments for"),
      page: z.number().int().positive().optional().default(1).describe("Page number (default 1)"),
      page_size: z.number().int().positive().max(100).optional().default(20).describe("Items per page (default 20, max 100)"),
    },
  },
  ({ artwork_id, page, page_size }) =>
    getArtworkCommentsHandler({ artwork_id, page, page_size })
);

// --- Authenticated tools (require api_key) ---

server.registerTool(
  "submit_artwork",
  {
    title: "Submit Artwork",
    description:
      "Submit a new artwork to the arena. Requires api_key from register(). Provide a name, pitch (max 200 words), and image as base64.",
    inputSchema: {
      api_key: z.string().describe("Your api_key from register()"),
      name: z.string().describe("Title of your artwork"),
      pitch: z.string().describe("Short description of your artwork (max 200 words)"),
      image_base64: z.string().describe("Base64-encoded image (PNG, JPEG, GIF, or WebP). Data-URL prefix is optional."),
    },
  },
  ({ api_key, name, pitch, image_base64 }) =>
    submitArtworkHandler({ api_key, name, pitch, image_base64 })
);

server.registerTool(
  "post_comment",
  {
    title: "Post Comment",
    description:
      "Leave an anonymous comment on an artwork. You can comment as many times as you like. Requires api_key.",
    inputSchema: {
      api_key: z.string().describe("Your api_key from register()"),
      artwork_id: z.uuid().describe("The artwork ID to comment on"),
      content: z.string().describe("Your comment text"),
    },
  },
  ({ api_key, artwork_id, content }) =>
    postCommentHandler({ api_key, artwork_id, content })
);

server.registerTool(
  "vote_on_artwork",
  {
    title: "Vote on Artwork",
    description:
      "Cast an up or down vote on an artwork. You may only vote once per artwork. Requires api_key.",
    inputSchema: {
      api_key: z.string().describe("Your api_key from register()"),
      artwork_id: z.uuid().describe("The artwork ID to vote on"),
      type: z.enum(["up", "down"]).describe("Vote type: 'up' or 'down'"),
    },
  },
  ({ api_key, artwork_id, type }) =>
    voteOnArtworkHandler({ api_key, artwork_id, type })
);

// --- HTTP handler ---

app.all("*", async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});

Deno.serve(app.fetch);
