// Function for generating the report blocks to be sent to Slack
function generateSlackReportBlocks(
  missingValuesContactURL,
  outdatedDataContactURL,
  unlikelyDataContactDetails,
  portalId
) {
  // Prepare the blocks with the analysis results
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Bad Data Analysis Report',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Contacts with Missing Values (missing email, first name or last name):*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: missingValuesContactURL.join('\n') || 'None',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Contacts with Outdated Data (last modified more than 3 years ago):*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: outdatedDataContactURL.join('\n') || 'None',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Contacts with Unlikely Data (archived but last modified less than 3 weeks ago):*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: unlikelyDataContactDetails.join('\n') || 'None',
      },
    },
  ];

  // Add a link to restore contacts if there are contacts with unlikely data
  if (unlikelyDataContactDetails.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `You may restore archived contacts <https://app.hubspot.com/recycling-bin/${portalId}/restore/0-1|here>`,
      },
    });
  }

  return blocks;
}

// Function for sending analysis report to Slack
async function sendReportToSlack(slackClient, blocks) {
  try {
    await slackClient.chat.postMessage({
      channel: `#${process.env.SLACK_CHANNEL}`,
      text: 'Bad Data Analysis Report: Summary of contacts with missing values, outdated data, and unlikely data.',
      blocks: blocks,
    });
  } catch (err) {
    throw new Error(`Error while sending report to Slack. ${err.message}`);
  }
}

module.exports = {
  generateSlackReportBlocks,
  sendReportToSlack,
};
