/*

Mr. Casual Bot

NOTE: this script requires the Node.js modules wordnik, inflection, request, wordfilter, twit, project-name-generator, dog-breed-names, pokemon, food-words, random-country
*/

// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Wordnik stuff
var WordnikAPIKey = 'ca683a846d5357236680c06d10409c8887b07aff638f04dfa';
// Request
var request = require('request');
// Re-represents words
var inflection = require('inflection');
// Generates random Pokemon
const pokemon = require('pokemon');
// Generates random dog breeds
var dogbreednames = require('dog-breed-names');
// Creates an adjective-noun pairing that sounds like a video game.
var game = require('project-name-generator');
// Generates random food
var superfood = require('superfood');
// Generates random country
var randomCountry = require('random-country');
// File System
var fs = require('fs');
// Blacklist
var wordfilter = require('wordfilter');
// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));// POINTS TO TWITTER KEYS
var pluralize = inflection.pluralize;
var capitalize = inflection.capitalize;
var singularize = inflection.singularize;
var titleize = inflection.titleize;
var ordinalize = inflection.ordinalize;
var error = false;
var filecontent;

var tempStore;
var verbs;
var latestMention;
var first = true;


var pre = ["What. How.", "What.", "How.", "Um...", "Meh.", "OK...", "*Clicks on name.*", "Who's this guy?", "Eh.", "Wow."];	// store prebuilt strings here.

// The real people Mr. Casual talks about
var relations = ["my mother", "my father", "my sister", "my brother", "my aunt", "my uncle", "some guy on the internet", "the animal person", "some kid in my class", "the government", "Trump"];

// The fake people Mr. Casual talks about
var characters = ["Bomberman", "Mario", "Luigi", "Homer Simpson", "Spongebob", "Jimmy Neutron", "Johnny Test", "Sackboy", "Goku", "Pac-Man", "Mami", "Doraemon", "Touhou", "Ryu"];

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

function verbUrl(minCorpusCount, limit) {
    return "http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=verb-intransitive&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}

function tweet() {
    var tweetText = pre.pick();

    if (debug)
    console.log(tweetText);
    else
    T.post('statuses/update', {status: tweetText }, function(err, reply) {
        console.log('Tweeted: ', tweetText);
    });
}

function respondToMention() {
    T.get('statuses/mentions_timeline', { count:10, include_rts:0 },  function (err, reply) {
        // Casual's Glorious Responses
        pre = ["What. How.", "What.", "How.", "Um...", "Meh.", "OK...", "*Clicks on name.*", "Who is this guy?", "Eh.", "Wow."];
        mention = reply.pick();
        mentionId = mention.id_str;
        mentioner = '@' + mention.user.screen_name;

        // Reads from a static file of last ID.
        fs.readFile('latestMention.txt', function read(err, data) {
            if (err) {
                throw err;
            }
            content = data;
            // If the new ID is higher (newer) than the file ID, write the new ID to file.
            if (content < mention.id_str) {
                if (!debug) {
                    fs.writeFile('latestMention.txt', mentionId, function (err) {
                        if (err)
                        return console.log(err);
                        console.log('Recorded');
                    });
                    latestMention = mention.id_str;
                    first = false;
                }

                var tweet = mentioner + " " + pre.pick();
                if (debug)
                console.log(tweet);
                else {
                    T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
                        console.log('Tweeted: ', tweet);
                    });
                }
            }
        })
    });
}

function tweetMedia () {
    // Gets a random value that selects a still image or a GIF.
    var randomValue = Math.random();
    fs.readdir('casual_pictures/GIF', (err, files) => {
        fs.readdir('casual_pictures/PNG', (err2, files2) => {
            if (randomValue < 0.3) {
                var b64content = fs.readFileSync('casual_pictures/GIF/' + (Math.trunc(Math.random() * files.length) + 1) + '.gif', { encoding: 'base64' });

            } else {
                var b64content = fs.readFileSync('casual_pictures/PNG/' + (Math.trunc(Math.random() * files2.length) + 1) + '.png', { encoding: 'base64' });
            }

            // Mr. Casual's Comments about the picture
            comments = [
                "...Needs more " + characters.pick() + ".",
                "...And " + relations.pick() + " told me I couldn't do anything.",
                "That's the LAST time I eat " + superfood.random() + " before sleeping...",
                "Almost as good as the " + characters.pick() + "swing.",
                "Beautiful.",
                "I did like " + Math.trunc(Math.random() * 100) + " Arcade runs today.",
                "Hah.\nGuess who's eating their words? " + capitalize(relations.pick()) + ".",
                "Not a " + characters.pick() + ".\nJust for that, I'm using a " + characters.pick() + " for Arcade now.",
                "I JUST realized that I hate this.",
                "There's " + Math.trunc(Math.random() * 100) + " more where THAT came from.",
                "" + capitalize(interjections.pick().word) + "!\n...Is what I would say but I have better things to do.",
                "" + capitalize(pluralize(nouns.pick().word)) + " ain't got nothing on this!",
                "This is why I love Mugen.\n...AND " + characters.pick() + "."
            ];
            casualcomment = comments.pick();
            if (debug) {
                console.log('Media Uploaded and Tweeted:\n' + casualcomment);
            }
            else {
                // Posts media to Twitter
                T.post('media/upload', { media_data: b64content }, function (err, data, response) {
                    var mediaIdStr = data.media_id_string
                    var altText = "What. How."
                    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
                    T.post('media/metadata/create', meta_params, function (err, data, response) {
                        if (!err) {
                            // References media and posts tweet
                            var params = { status: casualcomment, media_ids: [mediaIdStr] }

                            T.post('statuses/update', params, function (err, data, response) {
                                //console.log(data)
                                console.log('Media Actually Uploaded and Tweeted:\n' + casualcomment);
                            })
                        }
                    })
                }
            )}
        })
    })
}


function runBot() {
    console.log(" "); // just for legible logs
    var d=new Date();
    var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    console.log(ds);  // date/time of the request
    // Get 50 nouns, adjectives, interjections, and verbs with varying minimum corpus counts (lower numbers = more common words)
    request(nounUrl(5000,50), function(err, response, data) {
        request(adjectiveUrl(100000,50), function(err2, response2, data2) {
            request(interjectionUrl(0,50), function(err3, response3, data3) {
                request(verbUrl(0,50), function(err4, response4, data4) {

                    if ((response.statusCode != 200 || response2.statusCode != 200 || response3.statusCode != 200 || response4.statusCode != 200)) {
                        error = true
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
                        verbs = eval(data4);
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
                        for (var i = 0; i < verbs.length; i++) {
                            if (wordfilter.blacklisted(verbs[i].word))
                            {
                                console.log("Blacklisted: " + verbs[i].word);
                                verbs.remove(verbs[i]);
                                i--;
                            }
                        }
                        tempStore = adjectives.pick().word;
                        // A lot of Casualisms
                        pre = [
                            "How can ANY " + singularize(nouns.pick().word) + " play Bomberman?",
                            "That's it. I am never going to that " + capitalize(singularize(nouns.pick().word)) + " place again. It's too " + singularize(adjectives.pick().word) + ".",
                            "What were the creators of Pokemon thinking when they made " + pokemon.random() + "? It's just so... " + adjectives.pick().word + ".",
                            "..." + capitalize(relations.pick()) + " warned me about people who say \"" + capitalize(interjections.pick().word) + "\"",
                            "The ONLY thing I hate more than " + nouns.pick().word + " is " + nouns.pick().word + ".",
                            "I hate all dogs... INCLUDING " + pluralize(dogbreednames.random()) + ". OK, maybe not ALL dogs... " + pluralize(dogbreednames.random()) + " are OK, I guess...",
                            "So, I was playing " + titleize(game({ words: 2, alliterative: true}).spaced) + " " + (Math.trunc((Math.random() * 5)) + 1) + ", and " + relations.pick() + " started yelling at me for no reason. Oh well, at least I have " + titleize(game({ words: 2, alliterative: false}).spaced) + " " + (Math.trunc((Math.random() * 5)) + 1) + ".",
                            "" + capitalize(relations.pick()) + " told me I was not " + adjectives.pick().word + ". TYPICAL " + characters.pick() + "er... I can't believe this.",
                            "If " + relations.pick() + " and " + relations.pick() + " got into a fight for whatever reason, I'd probably be FORCED to side with " + relations.pick() + ".",
                            "Why can't " + relations.pick() + " be more like " + characters.pick() + "? I mean can life be any MORE boring?",
                            "" + capitalize(pluralize(nouns.pick().word)) + " aren't " + adjectives.pick().word + ". They're \"" + adjectives.pick().word + ".\"",
                            "" + characters.pick() + " isn't over" + tempStore + "... Just " + tempStore + ".",
                            "Like. If I ever mess up and get a girlfriend, \"" + verbs.pick().word + "\" will definitely be a special word...",
                            "I " + verbs.pick().word + " to live. I beat " + characters.pick() + "s in Mugen.",
                            "I MAY have " + Math.trunc(Math.random()*100) + " " + characters.pick() + "s in Mugen, but more importantly you should know I have " + Math.trunc(Math.random()*100) + " " + characters.pick() + "s.",
                            "So, I woke up today... But then I saw " + nouns.pick().word + " and went back to bed.",
                            "Great. JUST great. Now " + relations.pick() + "'s " + relations.pick() + ". This just HAD to happen...",
                            "Everyone thought I owed my life to the " + characters.pick() + "s. Once again they were wrong.",
                            "What ELSE would I base my culture on?\n..." + capitalize(pluralize(nouns.pick().word)) + "?",
                            "I dropped my " + superfood.random() + " on the ground.\n...So. I said " + interjections.pick().word + ". Makes perfect sense.",
                            ordinalize("I wish I played " + capitalize(adjectives.pick().word) + " Kart more. I did only one race. And came in " + Math.trunc(Math.random() * 100) + " place. So I turned if off..."),
                            "I love hitting my " + characters.pick()+ "s with the " + characters.pick() + "swing.",
                            "" + capitalize(pluralize(nouns.pick().word)) + " were ONLY made up by " + relations.pick() + " to raise the " + singularize(nouns.pick().word) + " rate.",
                            "" + randomCountry({ full: true }) + " is in " + randomCountry({ full: true }) + "?\n\nMakes sense.",
                            "I guess " + randomCountry({ full: true }) + " is a lot like a " + characters.pick() + " level.",
                            "Clearly " + randomCountry({ full: true }) + " was made by a game designer.",
                            "" + randomCountry({ full: true }) + " isn't even a real place... " + capitalize(relations.pick()) + " said so.",
                            // etc.
                        ];

                        ///----- NOW DO THE BOT STUFF
                        var rand = Math.random();

                        // Chance of tweeting vs. Chance of posting media
                        if(rand < 0.3) {
                            console.log("-------Tweet something");
                            tweet();
                        } else {
                            console.log("-------Tweet something using media");
                            tweetMedia();
                        }
                        // Check for mentions every update, chance of responding.
                        console.log("-------Tweet something @someone");
                        respondToMention();
                    }
                })
            })
        })
    });
}

// Run the bot
runBot();

// And recycle every hour
setInterval(runBot, 1000 * 60 * 60);
