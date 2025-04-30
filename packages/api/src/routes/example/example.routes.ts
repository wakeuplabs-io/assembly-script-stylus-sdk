/**
 * @fileoverview Example route definitions
 * Defines the OpenAPI schema for the example endpoints.
 *
 * @module routes/example/routes
 */

import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

/**
 * Example route configuration
 * @description Defines a GET endpoint that demonstrates basic route structure
 *
 * @openapi
 * /example:
 *   get:
 *     tags:
 *       - Example
 *     responses:
 *       200:
 *         description: Successful example response
 *       404:
 *         description: Example not found
 */
export const exampleRoute = createRoute({
  path: "/example",
  method: "get",
  tags: ["Example"],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Api Hono Example route"),
      "Api Hono Example route",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(createMessageObjectSchema("Not Found"), "Not Found"),
  },
});

export type ExampleRoute = typeof exampleRoute;
