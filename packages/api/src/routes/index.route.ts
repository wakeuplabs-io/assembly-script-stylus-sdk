/**
 * @fileoverview Index route configuration for the API
 * Defines the root endpoint that provides basic API information.
 *
 * @module routes/index
 */

import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

import { createRouter } from "../lib/create-app";

/**
 * Index route configuration and handler
 * @description Creates a GET endpoint at the root path that returns API information
 *
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Index
 *     responses:
 *       200:
 *         description: Returns basic API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
const router = createRouter().openapi(
  createRoute({
    tags: ["Index"],
    method: "get",
    path: "/",
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        createMessageObjectSchema("hono-api-template"),
        "hono-api-template Index",
      ),
    },
  }),
  (c) => {
    return c.json(
      {
        message: "hono-api-template",
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
