import { expect, it } from "vitest";

import { isEmailDeliveryAvailable } from "@/features/auth/email-delivery";

it("hides e-mail forms in production until Resend is configured", () => {
  expect(isEmailDeliveryAvailable({}, true)).toBe(false);
  expect(isEmailDeliveryAvailable({ RESEND_API_KEY: "re_key" }, true)).toBe(true);
  expect(isEmailDeliveryAvailable({}, false)).toBe(true);
});
