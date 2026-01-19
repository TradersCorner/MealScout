import { TransactionalSMSApi, TransactionalSMSApiApiKeys } from "@getbrevo/brevo";

const smsApi = new TransactionalSMSApi();

export const isSmsConfigured = (): boolean => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return false;
  }
  try {
    smsApi.setApiKey(TransactionalSMSApiApiKeys.apiKey, apiKey);
    return true;
  } catch (error) {
    console.error("Brevo SMS configuration failed:", error);
    return false;
  }
};

export const sendSms = async (to: string, content: string): Promise<boolean> => {
  if (!isSmsConfigured()) {
    return false;
  }

  const sender = process.env.BREVO_SMS_SENDER || "MealScout";

  try {
    await smsApi.sendTransacSms({
      sender,
      recipient: to,
      content,
      type: "transactional",
    } as any);
    return true;
  } catch (error) {
    console.error("Brevo SMS send failed:", error);
    return false;
  }
};
