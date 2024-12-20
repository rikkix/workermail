import { DateTime, Str, Email } from "chanfana";
import { Context } from "hono";
import { date, z } from "zod";


export type HonoContext = Context<{
	Bindings: Env
  }>

export const RespEmail = z.object({
	success: z.boolean().default(true),
	id: Str({ required: true }),

	date: DateTime({ required: true }),
	from: Email({ required: true }),
	to: Email({ required: true }),
	subject: Str().nullable(),
	html: Str().nullable(),
	text: Str().nullable(),

});

export const RespInboxStat = z.object({
	success: z.boolean().default(true),
	messages: z.object({
		id: Str({ required: true }),
		date: DateTime({ required: true }),
		from: Email({ required: true }),
		to: Email({ required: true }),
		subject: Str().nullable(),
	}).array().nullable(),
});

export const RespInboxOverview = z.object({
	success: z.boolean().default(true),
	inbox: z.object({
		to: Email({ required: true }),
		count: z.number(),
		latest: DateTime(),
	}).array().nullable(),
});

