import { Context } from "hono";

export type HonoContext = Context<{Bindings: Env}>
