import { Email, Str, Int, OpenAPIRoute, Uuid } from "chanfana";
import { HonoContext } from "types";
import { z } from "zod";

export const RespEmail = z.object({
	success: z.boolean().default(true),
	id: Uuid({ required: true }),

	timestamp: Int({ required: true , description: "Date of the email in milliseconds" }),
	from: Email({ required: true }),
	to: Email({ required: true }),
	subject: Str().nullable(),
	html: Str().nullable(),
	text: Str().nullable(),

});

export class ShowMessage extends OpenAPIRoute {
	schema = {
		// tags: ["Tasks"],
		summary: "Show message body of certain email",
		request: {
			params: z.object({
				email_id: Uuid({ required: true }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the messages of certain email",
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

		const id = data.params.email_id.trim().toLowerCase();

		const db_result = await c.env.DB.prepare(`
			SELECT id, timestamp, "from", "to", subject, html, text
			FROM emails
			WHERE id = ?
		`).bind(id).first();

		if (!db_result) {
			return c.json({
				success: false,
				error: "Not found",
			});
		}

		return c.json({
			success: db_result.success,
			...db_result,
		});
	}
}
