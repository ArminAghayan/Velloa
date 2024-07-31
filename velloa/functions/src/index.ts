import { onRequest, HttpsFunction } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

interface EmailData {
  email: string;
  tenantName: string;
}

const mailTransport = nodemailer.createTransport({
  host: 'mail.velloaapp.com',
  port: 465,
  secure: true,
  auth: {
    user: functions.config().email.user as string,
    pass: functions.config().email.pass as string,
  },
});

export const sendWelcomeEmail = functions.https.onCall(async (data: EmailData, context: functions.https.CallableContext) => {
  logger.info('sendWelcomeEmail function called', { data });

  if (!data.email || !data.tenantName) {
    logger.error('Missing required fields', { data });
    throw new functions.https.HttpsError('invalid-argument', 'Email and tenant name are required.');
  }

  const { email, tenantName } = data;

  const mailOptions: nodemailer.SendMailOptions = {
    from: '"Velloa App" <noreply@velloaapp.com>',
    to: email,
    subject: 'Welcome to Your New Home!',
    text: `Dear ${tenantName},\n\nWelcome to your new home! We're excited to have you as a tenant. Your lease is currently pending approval. We will notify you once it has been approved.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nYour Property Management Team`
  };

  try {
    logger.info('Attempting to send email', { mailOptions });
    const info = await mailTransport.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', { messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const typedError = error as Error;
    logger.error('Error sending email:', { error: typedError, stack: typedError.stack });
    throw new functions.https.HttpsError('internal', `Failed to send email: ${typedError.message}`);
  }
});

export const helloWorld: HttpsFunction = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});

// Example to use onCall from firebase-functions/v2/https
export const exampleOnCallFunction = functions.https.onCall((data: any, context: functions.https.CallableContext) => {
  logger.info("Example onCall function triggered", { data });
  return { message: "This is an example onCall function response." };
});

// Example to use onDocumentWritten from firebase-functions/v2/firestore
export const exampleOnDocumentWritten = functions.firestore.document('example/{docId}')
  .onWrite((change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    logger.info("Document written event triggered", { change, context });
    return null;
  });