# jira-archived-slack
To test this script I created a free Jira account, generated API token. Also I used an existing slack workspace with a bot and test channel. In my Jira account I created a few projects. Then in the script I changed the cutoff date to an hour ago, thus I could separate projects that need to be archived from the recent ones. 
To run the script two dependencies are needed to be be installed:
npm install node-fetch 
npm install slack-node
Potential Issues
Jira API Limits. If the script is run on a large number of projects
Time Zone Issues:
The script assumes that the last updated date is in UTC. If your Jira instance uses a different time zone, adjustments might be necessary.
