import { fromHono } from "chanfana";
import { Hono } from "hono";
import { InboxOverview } from "endpoints/overview";
import PostalMime from 'postal-mime';
import { HonoContext } from "types";
import { InboxStat } from "endpoints/inbox";
import { ShowMessage } from "endpoints/message";
import { ShowLatestMessage } from "endpoints/latest";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/init", InboxOverview);
openapi.get("/api/overview", InboxOverview);
openapi.get("/api/inbox/:email_addr", InboxStat);
openapi.get("/api/message/:email_id", ShowMessage);
openapi.get("/api/latest/:email_addr", ShowLatestMessage);

// openapi.post("/api/extract/:email_addr", TaskList);

app.get("/init", async (c: HonoContext): Promise<Response> => {
	const exec_res = await c.env.DB.prepare(`
		CREATE TABLE IF NOT EXISTS emails (
			id TEXT PRIMARY KEY,
			timestamp INTEGER NOT NULL,
			"from" TEXT NOT NULL,
			"to" TEXT NOT NULL,
			subject TEXT,
			html TEXT,
			text TEXT
		);
	`).run();

	if (!exec_res.success) {
		return c.json({ success: false, error: exec_res.error });
	}

	return c.json({ success: true });
})


// Export the Hono app
export default {
	fetch: app.fetch,
	email: async(message: ForwardableEmailMessage, env: Env, ctx) => {
		const body = await PostalMime.parse(message.raw);
		const email = {
			id: crypto.randomUUID(),
			timestamp: new Date().getTime(),
			from: message.from.trim().toLowerCase(),
			to: message.to.trim().toLowerCase(),
			subject: body.subject || null,
			html: body.html || null,
			text: body.text || null,
		};

		await env.DB.prepare(`INSERT INTO emails (id, timestamp, "from", "to", subject, html, text) VALUES (?, ?, ?, ?, ?, ?, ?)`)
			.bind(email.id, email.timestamp, email.from, email.to, email.subject, email.html, email.text)
			.run();
	}
}
