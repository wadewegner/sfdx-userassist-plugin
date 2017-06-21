const path = require('path');
const os = require('os');
const ScratchOrg = require(LoadScratchOrgApi());
const forceUtils = require('../lib/forceUtils.js');
const request = require('request');

function LoadScratchOrgApi() {

  let pluginPath;
  var isWin = /^win/.test(process.platform);

  if (isWin) {
    pluginPath = path.join(os.homedir(), '/AppData/Local/sfdx/plugins/node_modules/salesforce-alm/lib/scratchOrgApi');
  } else {
    pluginPath = path.join(os.homedir(), '.local/share/sfdx/plugins/node_modules/salesforce-alm/lib/scratchOrgApi')
  }

  return pluginPath;
}

(function () {
  'use strict';

  module.exports = {
    topic: 'user',
    command: 'org:provision',
    description: 'share a scratch org with a different user',
    help: 'help text for force:user:org:create',
    flags: [{
        name: 'targetusername',
        char: 'u',
        description: 'username for the target org',
        hasValue: true,
        required: true
      },
      {
        name: 'emailaddress',
        char: 'e',
        description: 'email address of the scratch org recipient',
        hasValue: true,
        required: true
      }
    ],
    run(context) {

      const targetUsername = context.flags.targetusername;
      const emailAddress = context.flags.emailaddress;

      forceUtils.getUsername(targetUsername, (username) => {

        ScratchOrg.create(username).then((org) => {
          org.getConfig().then((orgData) => {

            org.force.getOrgFrontDoor(org).then((frontDoorUrl) => {

              const devHubUsername = orgData.devHubUsername;

              ScratchOrg.create(devHubUsername).then((hubOrg) => {
                hubOrg.getConfig().then((hubOrgData) => {

                  const accessToken = hubOrgData.accessToken;
                  const instanceUrl = hubOrgData.instanceUrl;
                  const jsonBody =
                   `{ "inputs" :
                      [{
                        "emailBody" : "${devHubUsername} has created you a Salesforce org. Here's your login URL: ${frontDoorUrl}. Keep this URL confidential and do not share with others.",
                        "emailAddresses" : "${emailAddress}",
                        "emailSubject" : "${devHubUsername} created you a new Salesforce org",
                        "senderType" : "CurrentUser"
                      }]
                    }`;

                  const options = {
                    method: 'post',
                    body: JSON.parse(jsonBody),
                    json: true,
                    url: `${instanceUrl}/services/data/v36.0/actions/standard/emailSimple`,
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  };

                  request(options, (err, res, body) => {
                    if (err) {
                      console.log('Error :', err); // eslint-disable-line no-console
                    }
                    console.log(`Successfully shared ${username} with ${emailAddress}.`); // eslint-disable-line no-console
                  });
                });
              });
            });
          });
        });
      });
    }
  };
}());