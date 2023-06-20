// Load the required modules
const dotenv = require('dotenv');
const express = require('express');
const hubspot = require('@hubspot/api-client');
const { WebClient } = require('@slack/web-api');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Import utility functions from separate modules
const {
  getHubspotAccountDetails,
  getHubspotContacts,
  cleanContactData,
  findContactsWithMissingValues,
  findContactsWithOutdatedData,
  findContactsWithUnlikelyData,
  generateHubspotContactURL,
} = require('./hubspotUtils');

const {
  generateSlackReportBlocks,
  sendReportToSlack,
} = require('./slackUtils');

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Initialize HubSpot and Slack clients
const hubspotClient = new hubspot.Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
});
const slackClient = new WebClient(process.env.SLACK_ACCESS_TOKEN);

// Define endpoint for data analysis
app.get('/analyze', async (req, res) => {
  try {
    // Fetch data from HubSpot
    const [contactData, contactDataArchived, hubspotAccountDetailsString] =
      await Promise.all([
        getHubspotContacts(hubspotClient, false),
        getHubspotContacts(hubspotClient, true),
        getHubspotAccountDetails(process.env.HUBSPOT_ACCESS_TOKEN),
      ]);

    // Clean and categorize the data
    const cleanedContactData = cleanContactData(contactData, false);
    const cleanedContactDataArchived = cleanContactData(
      contactDataArchived,
      true
    );
    const hubspotAccountDetails = JSON.parse(hubspotAccountDetailsString);

    // Perform analysis
    const missingValues = findContactsWithMissingValues(cleanedContactData);
    const missingValuesContactURL = missingValues.map(contact =>
      generateHubspotContactURL(hubspotAccountDetails.portalId, contact.id)
    );

    const outdatedData = findContactsWithOutdatedData(cleanedContactData);
    const outdatedDataContactURL = outdatedData.map(contact =>
      generateHubspotContactURL(hubspotAccountDetails.portalId, contact.id)
    );

    const unlikelyData = findContactsWithUnlikelyData(
      cleanedContactDataArchived
    );
    const unlikelyDataDetails = unlikelyData.map(
      contact =>
        `First name: ${contact.firstname}, Last name: ${contact.lastname}, Email: ${contact.email}`
    );

    // Generate a report and send it to Slack
    const slackReportBlocks = generateSlackReportBlocks(
      missingValuesContactURL,
      outdatedDataContactURL,
      unlikelyDataDetails,
      hubspotAccountDetails.portalId
    );

    await sendReportToSlack(slackClient, slackReportBlocks);

    // Send a success response
    res.send('Analysis complete');
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send('An error occurred during analysis.');
  }
});
