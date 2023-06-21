const {
  generateSlackReportBlocks,
  sendReportToSlack,
} = require('../utils/slackUtils');

describe('generateSlackReportBlocks function', () => {
  test('should return blocks without restore contacts link if unlikelyDataContactDetails is empty', () => {
    const blocks = generateSlackReportBlocks([], [], [], '123456');

    expect(blocks).toHaveLength(7); // Expect 7 blocks in total

    // Check the last block to make sure it does not contain the restore contacts link
    const lastBlock = blocks[blocks.length - 1];
    expect(lastBlock.text.text).not.toContain(
      'You may restore archived contacts'
    );
  });

  test('should return blocks with restore contacts link if unlikelyDataContactDetails is not empty', () => {
    const blocks = generateSlackReportBlocks(
      [],
      [],
      ['First name: Test, Last name: Contact, Email: test_contact@gmail.com'],
      '123456'
    );

    expect(blocks).toHaveLength(8); // Expect 8 blocks in total

    // Check the last block to make sure it contains the restore contacts link
    const lastBlock = blocks[blocks.length - 1];
    expect(lastBlock.text.text).toContain('You may restore archived contacts');
  });
});

describe('sendReportToSlack function', () => {
  const slackClient = {
    chat: {
      postMessage: jest.fn(),
    },
  };

  test('should throw an error when slackClient fails', async () => {
    slackClient.chat.postMessage.mockImplementation(() => {
      throw new Error('Failed to send message');
    });

    const blocks = ['Mock blocks'];

    await expect(sendReportToSlack(slackClient, blocks)).rejects.toThrow(
      'Error while sending report to Slack. Failed to send message'
    );
  });
});
