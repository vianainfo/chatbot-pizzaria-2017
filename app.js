var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '6EmpxCdjlO4z',
    password: process.env.CONVERSATION_PASSWORD || '607bd23e-48de-4de4-8371-fed8786b7c2b',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || 'd31c474b-c1a5-4c85-b2d2-9bb5a4fc5eab';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'EAAFjaTqGDZCkBAKjhdfKmxrg2l8Wj0iVc0HLFlvZB1L8DTGHMUPQr2Hmxkn5HYHEp5XnNnZARAK2ZC3Crn5LLG7oZB0mwnlLYqmSYYW20ZAsW0mm14kddqKWcaUrWtysULFizNh9Ykf2poY3wElmJ6TyPZCL8KBYJnBChrKvNquAg61pa5MZBcLR') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validação no token.');
});

app.post('/webhook/', function (req, res) {
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			context: {"conversation_id": conversation_id}
		}

		var payload = {
			workspace_id: "d31c474b-c1a5-4c85-b2d2-9bb5a4fc5eab "
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAAFjaTqGDZCkBAKjhdfKmxrg2l8Wj0iVc0HLFlvZB1L8DTGHMUPQr2Hmxkn5HYHEp5XnNnZARAK2ZC3Crn5LLG7oZB0mwnlLYqmSYYW20ZAsW0mm14kddqKWcaUrWtysULFizNh9Ykf2poY3wElmJ6TyPZCL8KBYJnBChrKvNquAg61pa5MZBcLR";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
