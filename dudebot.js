/*

Sample Twitter Bot, using Wordnik

NOTE: this script requires the Node.js modules wordnik, inflection, request, wordfilter, twit, project-name-generator, dog-breed-names, pokemon

*/

// DEBUG
var debug = true;		// if we don't want it to post to Twitter! Useful for debugging!

// Wordnik stuff
var WordnikAPIKey = 'ca683a846d5357236680c06d10409c8887b07aff638f04dfa';
var request = require('request');
var inflection = require('inflection');
const pokemon = require('pokemon');
var dogbreednames = require('dog-breed-names');
var game = require('project-name-generator');
var pluralize = inflection.pluralize;
var capitalize = inflection.capitalize;
var singularize = inflection.singularize;
var titleize = inflection.titleize;
var pre;	// store prebuilt strings here.
var error = false;
// Blacklist
var wordfilter = require('wordfilter');
var tempStore;
// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));			// POINT TO YOUR TWITTER KEYS


var relations = ["my mother", "my father", "my sister", "my brother", "my aunt", "my uncle", "some guy on the internet", "the animal person", "some kid in my class", "the government", "Trump"];

var characters = ["Bomberman", "Mario", "Luigi", "Homer Simpson", "Spongebob", "Jimmy Neutron", "Johnny Test", "Sackboy", "Goku", "Pac-Man", "Mami", "Doraemon", "Touhou"];

// Helper functions for arrays, picks a random thing
Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// Wordnik stuff
function nounUrl(minCorpusCount, limit) {
    return "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=noun&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}

function adjectiveUrl(minCorpusCount, limit) {
    return "http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=adjective&excludePartOfSpeech=noun&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}

function interjectionUrl(minCorpusCount, limit) {
    return "http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=interjection&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}

function tweet() {
    var tweetText = pre.pick();

    if (debug)
    console.log(tweetText);
    else
    T.post('statuses/update', {status: tweetText }, function(err, reply) {
        if (err !== null) {
            console.log('Error: ', err);
        }
        else {
            console.log('Tweeted: ', tweetText);
        }
    });
}

function followAMentioner() {
    T.get('statuses/mentions_timeline', { count:50, include_rts:1 },  function (err, reply) {
        if (err !== null) {
            console.log('Error: ', err);
        }
        else {
            var sn = reply.pick().user.screen_name;
            if (debug)
            console.log(sn);
            else {
                //Now follow that user
                T.post('friendships/create', {screen_name: sn }, function (err, reply) {
                    if (err !== null) {
                        console.log('Error: ', err);
                    }
                    else {
                        console.log('Followed: ' + sn);
                    }
                });
            }
        }
    });
}

function respondToMention() {
    T.get('statuses/mentions_timeline', { count:100, include_rts:0 },  function (err, reply) {
        if (err !== null) {
            console.log('Error: ', err);
        }
        else {
            mention = reply.pick();
            mentionId = mention.id_str;
            mentioner = '@' + mention.user.screen_name;

            var tweet = mentioner + " " + pre.pick();
            if (debug)
            console.log(tweet);
            else
            T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
                if (err !== null) {
                    console.log('Error: ', err);
                }
                else {
                    console.log('Tweeted: ', tweet);
                }
            });
        }
    });
}

function runBot() {
    // if (!error) {
    // console.log(" "); // just for legible logs
    // var d=new Date();
    // var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    // console.log(ds);  // date/time of the request
    // }
    // Get 200 nouns with minimum corpus count of 5,000 (lower numbers = more common words)
    // while (error) {
    request(nounUrl(5000,50), function(err, response, data) {
        request(adjectiveUrl(100000,50), function(err2, response2, data2) {
            request(interjectionUrl(0,50), function(err3, response3, data3) {
                if ((response.statusCode != 200 || response2.statusCode != 200 || response3.statusCode != 200)) {
                    error = true
                    //console.log("again")
                    runBot();
                }
                else {
                    error = false;
                    console.log(" "); // just for legible logs
                    var d=new Date();
                    var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
                    console.log(ds);  // date/time of the request
                nouns = eval(data);
                adjectives = eval(data2);
                interjections = eval(data3);
                // Filter out the bad nouns via the wordfilter
                for (var i = 0; i < nouns.length; i++) {
                    if (wordfilter.blacklisted(nouns[i].word))
                    {
                        console.log("Blacklisted: " + nouns[i].word);
                        nouns.remove(nouns[i]);
                        i--;
                    }
                }
                for (var i = 0; i < adjectives.length; i++) {
                    if (wordfilter.blacklisted(adjectives[i].word))
                    {
                        console.log("Blacklisted: " + adjectives[i].word);
                        adjectives.remove(adjectives[i]);
                        i--;
                    }
                }
                for (var i = 0; i < interjections.length; i++) {
                    if (wordfilter.blacklisted(interjections[i].word))
                    {
                        console.log("Blacklisted: " + interjections[i].word);
                        interjections.remove(interjections[i]);
                        i--;
                    }
                }
                tempStore = adjectives.pick().word;

                pre = [
                    // "How can ANY " + singularize(nouns.pick().word) + " play Bomberman?",
                    // "That's it. I am never going to that " + capitalize(singularize(nouns.pick().word)) + " place again. It's too " + singularize(adjectives.pick().word) + ".",
                    // "What were the creators of Pokemon thinking when they made " + pokemon.random() + "? It's just so... " + adjectives.pick().word + ".",
                    // "..." + capitalize(relations.pick()) + " warned me about people who say \"" + capitalize(interjections.pick().word) + "\"",
                    // "The ONLY thing I hate more than " + nouns.pick().word + " is " + nouns.pick().word + ".",
                    // "I hate all dogs... INCLUDING " + pluralize(dogbreednames.random()) + ". OK, maybe not ALL dogs... " + pluralize(dogbreednames.random()) + " are OK, I guess...",
                    // "So, I was playing " + titleize(game({ words: 2, alliterative: true}).spaced) + " " + (Math.trunc((Math.random() * 5)) + 1) + ", and " + relations.pick() + " started yelling at me for no reason. Oh well, at least I have " + titleize(game({ words: 2, alliterative: false}).spaced) + " " + (Math.trunc((Math.random() * 5)) + 1) + ".",
                    // "" + capitalize(relations.pick()) + " told me I was not " + adjectives.pick().word + ". TYPICAL " + characters.pick() + "er... I can't believe this.",
                    // "If " + relations.pick() + " and " + relations.pick() + " got into a fight for whatever reason, I'd probably be FORCED to side with " + relations.pick() + ".",
                    // "Why can't " + relations.pick() + " be more like " + characters.pick() + "? I mean can life be any MORE boring?",
                    // "" + capitalize(pluralize(nouns.pick().word)) + " aren't " + adjectives.pick().word + ". They're \"" + adjectives.pick().word + ".\"",
                    "" + characters.pick() + " isn't over" + tempStore + "... Just " + tempStore + ".",
                    // etc.
                ];

                ///----- NOW DO THE BOT STUFF
                var rand = Math.random();

                if(rand <= 1.60) {
                    console.log("-------Tweet something");
                    tweet();

                } else if (rand <= 0.80) {
                    console.log("-------Tweet something @someone");
                    respondToMention();

                } else {
                    console.log("-------Follow someone who @-mentioned us");
                    followAMentioner();
                }
            }
            })})});


//     request('http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=noun&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=200&api_key=ca683a846d5357236680c06d10409c8887b07aff638f04dfa', function (error, response, body) {
//   console.log('error:', error); // Print the error if one occurred
//   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//   console.log('body:', body); // Print the HTML for the Google homepage.
// });
        // }
    }

        // Run the bot
        runBot();


        // And recycle every hour
        setInterval(runBot, 1000 * 10 * 1);
