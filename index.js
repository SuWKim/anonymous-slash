var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

function createError(errorMessage) {
    return {
        error: errorMessage
    };
}

function getUsageHelp(commandName) {
    function createSample(target) {
        return commandName + ' *' + target + '* [Your message]';
    }

    var text = 'Expected usage: \n' +
        commandName + ' help -- Displays help message.\n' +
        createSample('#channel') + ' -- Sends to the specified public channel.\n' +
        createSample(':here') + ' -- Sends to the current group/channel/DM where you type this command.';

    return text;
}

function getFullHelp(commandName) {
    var text =
        'Allows to send anonymous messages to channels.\n' +
        'The most convenient way is to open up a conversation with slackbot in Slack and type the commands there, so that nobody detects that you are typing and you don\'t accidentally reveal yourself by typing an invalid command.\n' +
        '\n' +
        getUsageHelp(commandName);

    return text;
}

function createResponsePayload(requestBody) {
    if (!requestBody) {
        return createError('Request is empty');
    }

    var text = requestBody.text;
    var command = requestBody.command;

    if (!text || text === 'help') {
        return createError(getFullHelp(command));
    }

    var splitted = text.split(" ");
    if (splitted.length <= 1) {
        return createError(getUsageHelp(command));
    }

    var target = splitted[0];
    var remainingText = splitted.slice(1).join(' ');
    remainingText = "A team member asks/says" + "\n" + "> " + "*" + remainingText + "*";

    if (target === ':here') {
            return {
                channel: requestBody.channel_id,
                text: remainingText
            };
        }

    return {
        channel: target,
        text: remainingText
        };
    }



app.post('/', function(req, response) {
    var payloadOption = createResponsePayload(req.body);
    if (payloadOption.error) {
        response.end(payloadOption.error);
        return;
    }
    request({
        url: process.env.POSTBACK_URL,
        json: payloadOption,
        method: 'POST'
    }, function (error) {
        if(error) {
            response.end('Unable to post your anonymous message: ' + JSON.stringify(error));
        } else {
            response.end('Delivered! :cop:');
        }

    });
});

app.get('/', function(request, response) {
    response.write('HELLO THERE');
    response.end();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
