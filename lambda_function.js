'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var cardTitle;
var speechOutput;
var reprompt;
var bacIntro = [
 "Lets see if you're drunk",
 "Time to calculate",
 "Crunching the numbers",
 "do do do do, I'm adding it up now, do do do"
];

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    console.log("Responding with " + JSON.stringify(speechletResponse));
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function buildSpeechletResponseWithDirectiveNoIntent() {
    console.log("in buildSpeechletResponseWithDirectiveNoIntent");
    return {
      "outputSpeech" : null,
      "card" : null,
      "directives" : [ {
        "type" : "Dialog.Delegate"
      } ],
      "reprompt" : null,
      "shouldEndSession" : false
    };
  }

  function buildSpeechletResponseDelegate(shouldEndSession) {
      return {
          outputSpeech:null,
          directives: [
                  {
                      "type": "Dialog.Delegate",
                      "updatedIntent": null
                  }
              ],
          reprompt: null,
          shouldEndSession: shouldEndSession
      };
  }


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    console.log("in welcomeResponse");
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Lets calculate your BAC. This is an estimate, don\'t drink and drive. whats your weight in pounds';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = "please say your weight in pounds";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function getBAC(request, session, callback){
    console.log("in getBAC");
    console.log("request: "+JSON.stringify(request));
    var sessionAttributes={};
    var filledSlots = delegateSlotCollection(request, sessionAttributes, callback);

    if (request.intent.confirmationStatus == "DENIED") {
      delegateSlotCollection(request, sessionAttributes, callback);
    }

    var speechOutput = randomPhrase(bacIntro);

    var weight=request.intent.slots.weight.value;
    var gender=request.intent.slots.gender.value;
    var drinks=request.intent.slots.drinks.value;

    var r = 0.55;

    if (gender == 'male') {
      r = 0.68;
    } 

    var bac = ((drinks*14)/(r*453.592*weight)) * 100;
    bac = bac.toFixed(2);

    speechOutput += ", your estimated blood alcohol level is " + bac.toString() + ". please be safe";

    //say the results
    callback(sessionAttributes, buildSpeechletResponse("Approximate BAC Level", speechOutput, "", true));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying out the breathalyzer. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function delegateSlotCollection(request, sessionAttributes, callback){
  console.log("in delegateSlotCollection");
  console.log("  current dialogState: "+JSON.stringify(request.dialogState));

    if (request.dialogState === "STARTED") {
      console.log("in started");
      console.log("  current request: "+JSON.stringify(request));
      var updatedIntent=request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else if (request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      console.log("  current request: "+JSON.stringify(request));
      // return a Dialog.Delegate directive with no updatedIntent property.
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else {
      console.log("in completed");
      console.log("  current request: "+JSON.stringify(request));
      console.log("  returning: "+ JSON.stringify(request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return request.intent;
    }
}

function randomPhrase(array) {
    // the argument is an array [] of words or phrases
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(request, session, callback) {
    console.log("in launchRequest");
    console.log("  request: "+JSON.stringify(request));
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(request, session, callback) {
    console.log("in onIntent");
    console.log("  request: "+JSON.stringify(request));

    const intent = request.intent;
    const intentName = request.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetBAC') {
        getBAC(request, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log("EVENT=====" + JSON.stringify(event));

        if (event.session.application.applicationId !== 'amzn1.ask.skill.8e549758-3b3c-4660-b4d2-6ee43ce9e4e3') {
             callback('Invalid Application ID');
        }


        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};