/**
 * @fileoverview OpenAPI/Swagger configuration for the Hono application
 * This file sets up API documentation endpoints and configures the OpenAPI specification.
 *
 * @module lib/configure-open-api
 */

import { apiReference } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "./types";

import packageJSON from "../../package.json" with { type: "json" };

/**
 * Configures OpenAPI documentation endpoints for the application
 * @param {AppOpenAPI} app - The Hono application instance to configure
 * @returns {void}
 *
 * @description
 * Sets up two documentation endpoints:
 * - /doc: OpenAPI/Swagger specification in JSON format
 * - /reference: Interactive API documentation UI powered by Scalar
 *
 * @example
 * ```typescript
 * const app = createApp();
 * configureOpenAPI(app);
 * // Now you can access:
 * // - API spec at /doc
 * // - API reference UI at /reference
 * ```
 */
export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "Api Hono Template",
    },
  });

  app.get(
    "/reference",
    apiReference({
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      url: "/doc",
    }),
  );
}
