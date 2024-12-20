import { Email, Str, OpenAPIRoute, Uuid, Int } from "chanfana";
import { error } from "console";
import { HonoContext } from "types";
import { z } from "zod";

export const RespEmail = z.object({
	success: z.boolean().default(true),

	messages: z.object({
		id: Uuid({ required: true }),
		timestamp: Int({ required: true, description: "Date of the email in milliseconds" }),
		from: Email({ required: true }),
		to: Email({ required: true }),
		subject: Str().nullable(),
		html: Str().nullable(),
		text: Str().nullable(),
	}).array(),

});

export class ShowLatestMessage extends OpenAPIRoute {
	schema = {
		// tags: ["Tasks"],
		summary: "Show message body of the latest email",
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
					required: true,
					description: "Number of messages to return",
					default: 1,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns the message of the latest email",
				content: {
					"application/json": {
						schema: RespEmail,
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
		const limit = data.query.limit;

		let query = `SELECT id, timestamp, "from", "to", subject, html, text
			FROM emails
			WHERE "to" = ?`;

		let args = [];

		args.push(to);

		if (from) {
			query += ` AND "from" = ?`;
			args.push(from);
		}

		if (after) {
			query += ` AND timestamp > ?`;
			args.push(after);
		}

		query += ` ORDER BY timestamp DESC LIMIT ?`;
		args.push(limit);

		const db_result = await c.env.DB.prepare(query).bind(...args).all();

		return c.json({
			success: db_result.success,
			error: db_result.error,
			messages: db_result.results,
		});
	}
}
