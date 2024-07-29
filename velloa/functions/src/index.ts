/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

const mailTransport = nodemailer.createTransport({
  host: 'mail.velloaapp.com',
  port: 465,
  secure: true,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  const { email, tenantName } = data;

  const mailOptions = {
    from: '"Velloa App" <noreply@velloaapp.com>',
    to: email,
    subject: 'Welcome to Your New Home!',
    text: `Dear ${tenantName},\n\nWelcome to your new home! We're excited to have you as a tenant. Your lease is currently pending approval. We will notify you once it has been approved.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nYour Property Management Team`
  };

  try {
    await mailTransport.sendMail(mailOptions);
    logger.info('Welcome email sent successfully');
    return { success: true };
  } catch (error) {
    const typedError = error as Error; // Explicitly cast error to Error type
    logger.error('There was an error while sending the email:', typedError);
    return { error: typedError.toString() };
  }
});

export const helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});

// Example to use onCall from firebase-functions/v2/https
export const exampleOnCallFunction = functions.https.onCall((data, context) => {
  logger.info("Example onCall function triggered", { data });
  return { message: "This is an example onCall function response." };
});

// Example to use onDocumentWritten from firebase-functions/v2/firestore
export const exampleOnDocumentWritten = functions.firestore.document('example/{docId}')
  .onWrite((change, context) => {
    logger.info("Document written event triggered", { change, context });
    return null;
  });
