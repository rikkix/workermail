import { Email, Str, Int, OpenAPIRoute, Uuid } from "chanfana";
import { HonoContext } from "types";
import { z } from "zod";

export const RespInboxStat = z.object({
	success: z.boolean().default(true),
	messages: z.object({
		id: Uuid({ required: true }),
		timestamp: Int({ required: true, description: "Date of the email in milliseconds" }),
		from: Email({ required: true }),
		to: Email({ required: true }),
		subject: Str().nullable(),
	}).array(),
});

export class InboxStat extends OpenAPIRoute {
	schema = {
		// tags: ["Tasks"],
		summary: "Show messasges of certain address",
		request: {
			params: z.object({
				email_addr: Email({ required: true }),
			}),
			query: z.object({
				from: Str({
					required: false,
				}),
				after: Int({ required: false, description: "Date of the email in milliseconds" }),
				limit: Int({
					required: false,
					description: "Number of messages to return"
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns the messages of certain address",
				content: {
					"application/json": {
						schema: RespInboxStat,
					},
				},
			},
		},
	};

	async handle(c: HonoContext): Promise<Response> {
		const data = await this.getValidatedData<typeof this.schema>();

		const to = data.params.email_addr.trim().toLowerCase();
		const from = data.query.from?.trim().toLowerCase() || null;
		const after = data.query.after || null;
		const limit = data.query.limit || null;

		let query = `SELECT id, timestamp, "from", "to", subject FROM emails WHERE "to" = ?`;
		let params = [];
		params.push(to);

		if (from) {
			query += ` AND "from" = ?`;
			params.push(from);
		}

		if (after) {
			query += ` AND timestamp > ?`;
			params.push(after);
		}

		query += ` ORDER BY timestamp DESC`;

		if (limit) {
			query += ` LIMIT ?`;
			params.push(limit);
		}

		const db_result = await c.env.DB.prepare(query)
			.bind(...params)
			.all();

		return c.json({
			success: db_result.success,
			error: db_result.error,
			messages: db_result.results,
		});
	}
}
