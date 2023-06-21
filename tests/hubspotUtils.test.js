const nock = require('nock');

const {
  cleanContactData,
  findContactsWithMissingValues,
  findContactsWithOutdatedData,
  findContactsWithUnlikelyData,
  getHubspotAccountDetails,
  getHubspotContacts,
} = require('../hubspotUtils');

// Sample contact data
const contactData = [
  {
    id: '1',
    properties: {
      createdate: '2020-06-20T14:30:53.618Z',
      email: 'test_contact_one@gmail.com',
      firstname: 'Test Contact',
      lastmodifieddate: '2020-06-20T14:30:58.364Z',
      lastname: 'One',
    },
    createdAt: '2020-06-20T14:30:53.618Z',
    updatedAt: '2020-06-20T14:30:58.364Z',
    archived: false,
  },
  {
    id: '2',
    properties: {
      createdate: '2023-06-20T14:30:53.618Z',
      email: null,
      firstname: 'Test Contact',
      lastmodifieddate: '2023-06-20T14:30:58.364Z',
      lastname: 'Two',
    },
    createdAt: '2023-06-20T14:30:53.618Z',
    updatedAt: '2023-06-20T14:30:58.364Z',
    archived: false,
  },
  {
    id: '3',
    properties: {
      createdate: '2023-06-20T14:30:53.618Z',
      email: 'test_contact_three@gmail.com',
      firstname: 'Test Contact',
      lastmodifieddate: '2023-06-20T14:30:58.364Z',
      lastname: 'Three',
    },
    createdAt: '2023-06-20T14:30:53.618Z',
    updatedAt: '2023-06-20T14:30:58.364Z',
    archived: true,
    archivedAt: '2023-06-20T14:31:00.487Z',
  },
];

// Sample cleaned contact data (unarchived contacts)
const cleanedContactData = [
  {
    id: '1',
    email: 'test_contact_one@gmail.com',
    firstname: 'Test Contact',
    lastname: 'One',
    createdate: new Date('2020-06-20T14:30:53.618Z'),
    lastmodifieddate: new Date('2020-06-20T14:30:58.364Z'),
    archived: false,
  },
  {
    id: '2',
    email: 'Unknown',
    firstname: 'Test Contact',
    lastname: 'Two',
    createdate: new Date('2023-06-20T14:30:53.618Z'),
    lastmodifieddate: new Date('2023-06-20T14:30:58.364Z'),
    archived: false,
  },
];

// Sample cleaned contact data (archived contacts)
const cleanedContactDataArchived = [
  {
    id: '3',
    email: 'test_contact_three@gmail.com',
    firstname: 'Test Contact',
    lastname: 'Three',
    createdate: new Date('2023-06-20T14:30:53.618Z'),
    lastmodifieddate: new Date('2023-06-20T14:30:58.364Z'),
    archived: true,
    archivedAt: new Date('2023-06-20T14:31:00.487Z'),
  },
  {
    id: '4',
    email: 'test_contact_four@gmail.com',
    firstname: 'Test Contact',
    lastname: 'Four',
    createdate: new Date('2023-05-20T14:30:53.618Z'),
    lastmodifieddate: new Date('2023-05-20T14:30:58.364Z'),
    archived: true,
    archivedAt: new Date('2023-06-20T14:31:00.487Z'),
  },
];

describe('getHubspotAccountDetails', () => {
  it('should handle successful response', async () => {
    const mockData = { data: 'Mock Data' };

    // Set up a mock API response
    nock('https://api.hubapi.com')
      .get('/account-info/v3/details')
      .reply(200, mockData);

    const result = await getHubspotAccountDetails('fake-token');
    expect(result).toEqual(JSON.stringify(mockData));
  });

  it('should handle unsuccessful response', async () => {
    const mockData = { status: 'error', message: 'Invalid token' };

    // Set up a mock API response
    nock('https://api.hubapi.com')
      .get('/account-info/v3/details')
      .reply(400, mockData);

    await expect(getHubspotAccountDetails('fake-token')).rejects.toThrow(
      new Error(
        `Error while fetching HubSpot account details. Status: 400. Body: ${JSON.stringify(
          mockData
        )}`
      )
    );
  });

  it('should handle error during response', async () => {
    const mockError = new Error('Response error');

    // Set up a mock API response
    nock('https://api.hubapi.com')
      .get('/account-info/v3/details')
      .replyWithError(mockError);

    await expect(getHubspotAccountDetails('fake-token')).rejects.toEqual(
      new Error(
        `Error while fetching HubSpot account details. ${mockError.message}`
      )
    );
  });

  it('should handle error during request', async () => {
    const mockError = new Error('Request error');

    // Set up a mock API response
    nock('https://api.hubapi.com')
      .get('/account-info/v3/details')
      .replyWithError(mockError);

    await expect(getHubspotAccountDetails('fake-token')).rejects.toEqual(
      new Error(
        `Error while fetching HubSpot account details. ${mockError.message}`
      )
    );
  });
});

describe('getHubspotContacts', () => {
  // Mock HubSpot client for CRM contacts with Jest function
  const hubspotClient = {
    crm: {
      contacts: {
        getAll: jest.fn(),
      },
    },
  };

  afterEach(() => {
    // Clear mock after each test
    hubspotClient.crm.contacts.getAll.mockClear();
  });

  test('should return unarchived contacts when successful', async () => {
    const contactDataNotArchived = contactData.slice(0, contactData.length - 1);
    // Mock successful response
    hubspotClient.crm.contacts.getAll.mockResolvedValue(contactDataNotArchived);

    const result = await getHubspotContacts(hubspotClient, false);

    expect(result).toEqual(contactDataNotArchived);
    expect(hubspotClient.crm.contacts.getAll).toHaveBeenCalledTimes(1);
  });

  test('should return archived contacts when successful', async () => {
    const contactDataArchived = contactData.slice(-1, contactData.length);
    // Mock successful response
    hubspotClient.crm.contacts.getAll.mockResolvedValue(contactDataArchived);

    const result = await getHubspotContacts(hubspotClient, false);

    expect(result).toEqual(contactDataArchived);
    expect(hubspotClient.crm.contacts.getAll).toHaveBeenCalledTimes(1);
  });

  test('should throw error when unsuccessful', async () => {
    const error = new Error('API Error');

    // Mock error response
    hubspotClient.crm.contacts.getAll.mockRejectedValue(error);

    await expect(getHubspotContacts(hubspotClient, false)).rejects.toThrow(
      `Error while fetching HubSpot contacts. ${error.message}`
    );
    expect(hubspotClient.crm.contacts.getAll).toHaveBeenCalledTimes(1);
  });
});

describe('cleanContactData', () => {
  it('should clean contact data correctly', () => {
    const result = cleanContactData(contactData, true);

    expect(result).toEqual([
      {
        id: '1',
        email: 'test_contact_one@gmail.com',
        firstname: 'Test Contact',
        lastname: 'One',
        createdate: new Date('2020-06-20T14:30:53.618Z'),
        lastmodifieddate: new Date('2020-06-20T14:30:58.364Z'),
        archived: false,
      },
      {
        id: '2',
        email: 'Unknown',
        firstname: 'Test Contact',
        lastname: 'Two',
        createdate: new Date('2023-06-20T14:30:53.618Z'),
        lastmodifieddate: new Date('2023-06-20T14:30:58.364Z'),
        archived: false,
      },
      {
        id: '3',
        email: 'test_contact_three@gmail.com',
        firstname: 'Test Contact',
        lastname: 'Three',
        createdate: new Date('2023-06-20T14:30:53.618Z'),
        lastmodifieddate: new Date('2023-06-20T14:30:58.364Z'),
        archived: true,
        archivedAt: new Date('2023-06-20T14:31:00.487Z'),
      },
    ]);
  });
});

describe('findContactsWithMissingValues', () => {
  it('should find contacts with missing values', () => {
    const result = findContactsWithMissingValues(cleanedContactData);

    expect(result).toEqual(cleanedContactData.slice(1, 2));
  });
});

describe('findContactsWithOutdatedData', () => {
  it('should find contacts with outdated data', () => {
    const result = findContactsWithOutdatedData(cleanedContactData);

    expect(result).toEqual(cleanedContactData.slice(0, 1));
  });
});

describe('findContactsWithUnlikelyData', () => {
  it('should find contacts with unlikely data', () => {
    const result = findContactsWithUnlikelyData(cleanedContactDataArchived);
    expect(result).toEqual(cleanedContactDataArchived.slice(0, 1));
  });
});
