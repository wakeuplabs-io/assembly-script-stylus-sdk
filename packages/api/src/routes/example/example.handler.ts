/**
 * @fileoverview Example route handler implementation
 * Contains the business logic for the example endpoint.
 *
 * @module routes/example/handler
 */

import * as HttpStatusCodes from "stoker/http-status-codes";
import { AppRouteHandler } from "../../lib/types";
import { ExampleRoute } from "./example.routes";

/**
 * Example endpoint handler
 * @type {AppRouteHandler<ExampleRoute>}
 * @description Handles GET requests to the /example endpoint
 *
 * @param {import('hono').Context} c - The Hono context object
 * @returns {Promise<Response>} JSON response with example message
 */
export const exampleHandler: AppRouteHandler<ExampleRoute> = async (c) => {
  return c.json(
    {
      message: "Api Hono Example route",
    },
    HttpStatusCodes.OK,
  );
};
