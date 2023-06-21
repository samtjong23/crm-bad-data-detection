# **HubSpot CRM Data Quality Monitor**

## **Introduction**

This project is a Node.js application that analyzes your contacts in HubSpot and sends a report to Slack summarizing contacts with missing values, outdated data, and unlikely data.

## **Requirements**

Before you get started, make sure you have the following prerequisites:

### **Node.js**

This project operates on Node.js. To ensure smooth execution, install Node.js version 18.16 or above. You can grab it directly from the [official Node.js website](https://nodejs.org/en/download).

### **HubSpot API**

This application interfaces with HubSpot, so you'll need to create an account and acquire an access token. Follow the instructions in the [HubSpot Developers Documentation](https://developers.hubspot.com/docs/api/private-apps) up to 'Make API calls with your app's access token'. When configuring scopes, you only need to enable read access to `crm.objects.contacts`.

### **Slack API**

This application delivers reports through Slack, which means you'll need a Slack account, a workspace, and an API token. If you haven't set these up, create an account and a workspace on Slack. Then, generate an API token using the [Slack API Documentation](https://api.slack.com/authentication/basics) as a guide. Stop after completing the 'Getting your authentication token' section. When it comes to scopes, make sure to include `chat:write` and `chat:write:public`.

### **Docker (optional)**

If you prefer to use Docker instead of installing Node.js, you can do so. Docker installation instructions can be found on the [official Docker website](https://docs.docker.com/get-docker/).

## **Setup**

1. Clone this repository to your local machine.

```
git clone https://github.com/samtjong23/crm-bad-data-detection.git
```

2. Navigate to the project directory.

```
cd crm-bad-data-detection
```

3. Install all necessary dependencies.

```
npm install
```

4. Set up environment variables. Create a `.env` file in the root directory and populate it with the following variables:

```
HUBSPOT_ACCESS_TOKEN=<your_hubspot_access_token>
SLACK_ACCESS_TOKEN=<your_slack_access_token>
SLACK_CHANNEL=<your_slack_channel>
```

**Note**: Replace `<your_hubspot_access_token>`, `<your_slack_access_token>`, and `<your_slack_channel>` with your actual HubSpot access token, Slack access token and Slack channel respectively. 5. Run the server.

```
npm start
```

Alternatively, you can use Docker.

```
docker build -t <your-image-name> .
docker run -p 3000:3000 -d <your-image-name>
```

## **Usage**

To trigger the data analysis, make a GET request to the `/analyze` endpoint. The server will analyze your HubSpot contacts data and send a report to your Slack channel. The report includes:

- Contacts with missing values: These are contacts missing email, first name or last name.
- Contacts with outdated data: These are contacts that were last modified more than 3 years ago.
- Contacts with unlikely data: These are contacts that are archived but were last modified less than 3 weeks ago.

The report also includes URLs to these contacts, and if there are contacts with unlikely data, a link to restore these contacts in HubSpot.

## **Unit Tests**

This project uses Jest for unit tests. To run unit tests:

```
npm test
```

## **About the Author**

Samuel Tjong - Email: [samtjong23@gmail.com](mailto:samtjong23@gmail.com)
