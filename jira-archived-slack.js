const fetch = require('node-fetch');
const Slack = require('slack-node');

// Configuration
const JIRA_URL = "";
const JIRA_API_TOKEN = "";
const JIRA_EMAIL = "";
const SLACK_BOT_TOKEN = "";
const SLACK_CHANNEL = "";

// Jira API endpoints
const JIRA_PROJECTS_ENDPOINT = "/rest/api/3/project/search";
const JIRA_PROJECT_ENDPOINT = "/rest/api/3/project/{}";

// Slack client
const slack = new Slack();
slack.setWebhook(`https://hooks.slack.com/services/${SLACK_BOT_TOKEN}`);

//Fetches all Jira projects using the Jira REST API.
async function getJiraProjects() {
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`
    };
    const response = await fetch(`${JIRA_URL}${JIRA_PROJECTS_ENDPOINT}`, { headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.values || [];
}

//Fetches the last updated date of a specific Jira project.
async function getProjectLastUpdated(projectKey) {
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`
    };
    const response = await fetch(`${JIRA_URL}${JIRA_PROJECT_ENDPOINT.replace("{}", projectKey)}/statuses`, { headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const projectData = await response.json();
    return projectData.lastUpdated || null;
}

//Archives a Jira project by updating its status to "archived".
async function archiveJiraProject(projectKey) {
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`
    };
    const payload = {
        status: "archived"
    };
    const response = await fetch(`${JIRA_URL}${JIRA_PROJECT_ENDPOINT.replace("{}", projectKey)}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

//Sends a notification to a Slack channel using the Slack Web API.
function sendSlackNotification(message) {
    slack.webhook({
        channel: SLACK_CHANNEL,
        text: message
    }, function(err, response) {
        if (err) {
            console.error(`Error sending Slack message: ${err}`);
        }
    });
}

async function main() {
    try {
        // Get all Jira projects
        const projects = await getJiraProjects();
        
        // Define the cutoff date (6 months ago)
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        
        const archivedProjects = [];
        
        for (const project of projects) {
            const projectKey = project.key;
            const lastUpdated = await getProjectLastUpdated(projectKey);
            
            if (lastUpdated) {
                const lastUpdatedDate = new Date(lastUpdated);
                if (lastUpdatedDate < cutoffDate) {
                    await archiveJiraProject(projectKey);
                    archivedProjects.push(projectKey);
                }
            }
        }
        
        // Send a notification to Slack
        if (archivedProjects.length > 0) {
            const message = `The following projects have been archived: ${archivedProjects.join(', ')}`;
            sendSlackNotification(message);
        } else {
            sendSlackNotification("No projects were archived.");
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();