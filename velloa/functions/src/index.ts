import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import { defineString } from "firebase-functions/params";
import * as SibApiV3Sdk from 'sib-api-v3-typescript';

admin.initializeApp();

// Define the Brevo API key as an environment variable
const brevoApiKey = defineString('BREVO_API_KEY');

export const sendProspectSuccessEmail = onDocumentCreated({
  region: 'us-central1',
  document: "people/{docId}",
}, async (event) => {
  console.log('Function triggered for new document');

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
  // Use the environment variable for the API key
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey.value());

  const data = event.data?.data();
  if (!data) {
    console.error('No data found in snapshot');
    return null;
  }

  // Extract the email address from the form data
  const emails = data.emails;
  const recipientEmail =
    Array.isArray(emails) && emails.length > 0
      ? emails[0].address
      : null;

  if (!recipientEmail) {
    console.log('No email address found for the prospect.');
    return null;
  }

  // Extract the first name, last name, and company ID from the form data
  const firstName = data.firstName || '[FirstName]';
  const lastName = data.lastName || '[LastName]';
  const companyId = data.companyId;

  if (!companyId) {
    console.error('No company ID found for the prospect.');
    return null;
  }

  // Fetch the company name using the company ID
  let companyName = '[CompanyName]';
  try {
    const companyDoc = await admin.firestore().collection('companies').doc(companyId).get();
    if (companyDoc.exists) {
      companyName = companyDoc.data()?.companyName || '[CompanyName]';
    } else {
      console.log('Company document not found');
    }
  } catch (error) {
    console.error('Error fetching company document:', error);
  }

  // Generate a unique action URL for this prospect
  const actionUrl = `https://your-application-url.com/apply?id=${event.params.docId}`;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.to = [{ email: recipientEmail, name: `${firstName} ${lastName}` }];
  sendSmtpEmail.templateId = 5; // This is the numeric ID of your template
  sendSmtpEmail.params = {
    FIRSTNAME: firstName,
    LASTNAME: lastName,
    COMPANYNAME: companyName,
    action_url: actionUrl,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully. Message ID:', response.body.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }

  return null;
});
