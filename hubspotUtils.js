// Load the required modules
const http = require('https');

const OUTDATED_DATA_THRESHOLD_YEARS = 3;
const UNLIKELY_DATA_THRESHOLD_DAYS = 21;

// Function for getting HubSpot account details
async function getHubspotAccountDetails(accessToken) {
  const options = {
    method: 'GET',
    hostname: 'api.hubapi.com',
    port: null,
    path: '/account-info/v3/details',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Using Promise to handle async HTTP request
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      const chunks = [];

      // Collecting chunks of data
      res.on('data', chunk => {
        chunks.push(chunk);
      });

      // When all chunks are collected, resolve or reject Promise based on status code
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode <= 299) {
          resolve(body);
        } else {
          reject(
            new Error(
              `Error while fetching HubSpot account details. Status: ${res.statusCode}. Body: ${body}`
            )
          );
        }
      });

      // Handling error during response
      res.on('error', err => {
        reject(
          new Error(
            `Error while fetching HubSpot account details. ${err.message}`
          )
        );
      });
    });

    // Handling error during request
    req.on('error', err => {
      reject(
        new Error(
          `Error while fetching HubSpot account details. ${err.message}`
        )
      );
    });

    req.end();
  });
}

// Funcation for getting HubSpot contacts
async function getHubspotContacts(hubspotClient, isArchived) {
  try {
    // Attempt to fetch all contacts
    const results = await hubspotClient.crm.contacts.getAll(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      isArchived
    );
    return results;
  } catch (err) {
    // If error occurs, throw it to be caught by caller
    throw new Error(`Error while fetching HubSpot contacts. ${err.message}`);
  }
}

// Function for cleaning and standardizing contact data
function cleanContactData(contactData, isArchived) {
  return contactData.map(contact => {
    const cleanedContact = {
      id: contact.id,
      email: contact.properties.email || 'Unknown',
      firstname: contact.properties.firstname || 'Unknown',
      lastname: contact.properties.lastname || 'Unknown',
      createdate: new Date(contact.properties.createdate),
      lastmodifieddate: new Date(contact.properties.lastmodifieddate),
      archived: contact.archived,
    };

    // If contact is archived, record the date
    if (isArchived && contact.archived) {
      cleanedContact.archivedAt = new Date(contact.archivedAt);
    }

    return cleanedContact;
  });
}

// Function for finding contacts with missing or null values
function findContactsWithMissingValues(data) {
  return data.filter(
    contact =>
      !contact.email ||
      contact.email === 'Unknown' ||
      !contact.firstname ||
      contact.firstname === 'Unknown' ||
      !contact.lastname ||
      contact.lastname === 'Unknown'
  );
}

// Function for finding contacts with outdated data
// i.e., contacts that were last modified more than 3 years ago
function findContactsWithOutdatedData(data) {
  return data.filter(contact => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(
      threeYearsAgo.getFullYear() - OUTDATED_DATA_THRESHOLD_YEARS
    );
    return contact.lastmodifieddate < threeYearsAgo;
  });
}

// Function for finding contacts with unlikely data
// ie., archived contacts that were last modified less than 3 weeks ago
function findContactsWithUnlikelyData(data) {
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - UNLIKELY_DATA_THRESHOLD_DAYS);
  return data.filter(
    contact => contact.archived && contact.lastmodifieddate > threeWeeksAgo
  );
}

// Function for generating a URL for a specific contact in the HubSpot app
function generateHubspotContactURL(portalId, contactId) {
  return `https://app.hubspot.com/contacts/${portalId}/contact/${contactId}`;
}

module.exports = {
  getHubspotAccountDetails,
  getHubspotContacts,
  cleanContactData,
  findContactsWithMissingValues,
  findContactsWithOutdatedData,
  findContactsWithUnlikelyData,
  generateHubspotContactURL,
};
