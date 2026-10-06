import type { Instrumentation } from "next";
import { logEvent } from "@/lib/logger";

/** No raw request, error message, path, query, cookie or learner payload is logged. */
export const onRequestError: Instrumentation.onRequestError = (error, _request, context) => {
  logEvent("error", "unexpected_server_error", {
    operation: context.routeType,
    statusCode: 500,
    errorType: error instanceof Error ? error.name : "UnknownError"
  });
  if (error instanceof Error && error.name === "PostgresError") {
    logEvent("error", "database_error", { operation: context.routeType, errorType: "PostgresError" });
  }
};
