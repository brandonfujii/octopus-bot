# Octopus (in progress)
A task management bot for Slack

## Installation 

Clone this repository: 
```bash
git clone git@github.com:brandonfujii/octopus-bot.git
```

After cloning the Git repository, you have to install any node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

## Getting started
1) After installation, make a bot integration in your slack channel here:
https://my.slack.com/services/new/bot

2) When you click "Add Bot Integration", enter a name, description, avatar, etc for your bot. Also, copy and save the Slack API token they give you; you'll need that in order to run your bot. Lastly, click Save Integration.

3) Create a firebase database: Go to firebase.com, make an account, and create/name a new app. After creating your new app, copy and save its url from the browser (for example: https://your-cool-database.firebaseio.com/). This serves a place to store your tasks.

## Running the bot
When in the folder of the cloned repository, run 
```bash
SLACK_ACCESS_TOKEN=your_slack_access_token FIREBASE_URI=your_firebase_url node app.js
```
This allows the program to know which bot to use and where to store the created tasks.
## Usage
Go to the channel that you've invited your bot to. For each command you'll be mentioning your bot (@yourbot):
#### Adding a task
```bash
@yourbot add (this is a new task)
```
Notice the use of parenthesis.

#### Viewing your team's tasks
```bash
@yourbot show tasks
```

#### Removing or completing a task
```bash
@yourbot remove (task_id)
```
```bash
@yourbot complete (task_id)
```