type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendDevelopmentEmail(message: MailMessage) {
  const timestamp = new Date().toISOString();
  console.log(`[mail:${timestamp}] to=${message.to} subject="${message.subject}"`);
  console.log(message.text);
  return {
    delivered: true,
    deliveredAt: new Date()
  };
}
