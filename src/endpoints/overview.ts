import { Email, Num, Int, OpenAPIRoute } from "chanfana";
import { HonoContext } from "types";
import { z } from "zod";

export const RespInboxOverview = z.object({
	success: z.boolean().default(true),
	inbox: z.object({
		to: Email({ required: true }),
		count: Num({ required: true }),
		latest: Int({ required: true , description: "Date of the email in milliseconds" }),
	}).array().nullable(),
});

export class InboxOverview extends OpenAPIRoute {
	schema = {
		// tags: ["Tasks"],
		summary: "Inbox Overview",
		responses: {
			"200": {
				description: "Returns the overview of the inbox",
				content: {
					"application/json": {
						schema: RespInboxOverview,
					},
				},
			},
		},
	};

	async handle(c: HonoContext): Promise<Response> {
		const db_result = await c.env.DB.prepare(`
			SELECT "to", COUNT(*) AS count, MAX(timestamp) AS latest
			FROM emails
			GROUP BY "to"
		`).all();
		
		return c.json({
			success: db_result.success,
			error: db_result.error,
			inbox: db_result.results,
		});
	}
}
