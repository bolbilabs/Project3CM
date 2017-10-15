/*

Sample Twitter Bot, using flat content

NOTE: this script requires the Node.js modules inflection, request, wordfilter, and twit

*/

// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));			// POINT TO YOUR TWITTER KEYS

// Static Netflix content
var region = ['British','French','Asian','French','Italian','Spanish','German','Japanese','Canadian','Chinese','European','Scandinavian','Mexican','Indian','Portuguese','Russian','Nordic','Southeast Asian','Swedish','Thai','Norwegian','Filipino','Polish'];
var adj = ['Romantic','Classic','Dark','Critically Acclaimed','Suspenseful','Gritty','Independent','Visually Striking','Violent','Feel-Good','Emotional','Cerebral','Goofy','Witty','Biographical','Oscar-Winning','Scary','Understated','Political','Military','Gay & Lesbian','Gory','Mind-Bending','Sentimental','Supernatural','Quirky','Hidden Gem','Cult','Imaginative','Father-and-Son','Showbiz','Inspiring','African-American','Steamy','Heartfelt','War','Serial Killer','Nostalgic','Gangster','Animal','Underdog','Campty','Police','Fight-the-System','Travel','Mother-and-Daughter','Time Travel','Magical','Golden-Globe Winning','Martial Arts','Disney','Psychological','Talking-Animal','Ensemble','Art','Raunchy','Dysfunctional-Family','Buddy','Space-Travel','Spy','Irreverent','Conspiracy','Road Trip','Teen','Coming-of-Age','Cop','Morality','Family-Friendly','Vampire','Forbidden Love','Looking-for-Love','First Love','Detective','Mad-Scientist','Ghost-Story','Tearjerkers','Opposites Attract','Zombie','Deep Sea','Social Issue','Sexual-Awakening','Girl Power','Race Against Time','Workplace','Prison','Kung Fu','Courtroom','Small Town','Heist','Controversial','Wilderness-Survival','Mid-Life-Crisis','Alien','Bollywood','Rogue-Cop','Mistake-Identity','Post-Apocalyptic','Immigrant-Life','Samurai & Ninja','Undercover Cop','Assassination','Vigilante','Cynical','Slapstick','Ominous','Reunited Lovers','Twisty Tale','Deadpan','Epic','Blockbuster','Hit-Man','Medical','Treasure Hunt','Absurd','Police-Corruption','Tortured Genius','Haunted House','Gambling','Suburban-Dysfunction','Provocative','Love Triangle','Viral Plague','Werewolf','Monster','Chilling','Bounty-Hunter','Experimental','Screwball','Slice of Life','Urban Legend','Boxing','Secret Society','Reincarnation','Satanic','Whistleblower','Spiritual','Clever','Jewish','Biblical','Sandal-and-Sword'];
var genre = ['Movies','Dramas','Comedies','Action Movies','Thrillers','Fantasy Movies','Sci-Fi Movies','Documentaries','Period Pieces','Musicals','Mysteries','Animation','Westerns','Satires','Fairy Tale','Slasher','Mockumentaries'];
var desc = ['Based on Real Life','Based on Books','Based on a Book','Based on Children\'s Books','Based on Classic Literature','Based on Contemporary Literature','Based on Bestsellers'];
var area = ['Set in Europe','Set in Asia','Set in Ancient Times','Set in Australia/NZ','Set in the Victorian Era','Set in the Middle East','Set in India','Set in Latin America','Set in Biblical Times','Set in Prehistoric Times','Set in the Edwardian Era','Set in Africa'];
var time = ['From the 1980s','From the 1970s','From the 1960s','From the 1950s','From the 1940s','From the 1930s','From the 1990s','From the 1920s','From the 1910s'];
var content = ['About Marriage','About Royalty','About Parenthood','About Reunited Lovers','About Fame','About Couples','About Cats','About Cats & Dogs','About Horses','About Art & Design','About Friendship','About Food','About Trucks, Trains, & Planes','About September 11'];
var ages = ['For Kids','For Ages 8 to 10','For Ages 8 to 12','For Ages 11 to 12','For Ages 5 to 7','For Ages 0 to 2','For Ages 2 to 4','For Ages 0 to 4'];
var etc = ['With a Strong Female Lead','For Hopeless Romantics'];
var role = ['Starring','Created By','Directed By'];
var star = ['Al Pacino','Nicholas Cage','Raymond Burr'];

// Helper functions for arrays, picks a random thing
Array.prototype.pick = function() {
	return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.pickAndPad = function() {
	return this.pick() + " ";
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
function chance(rate) {
	if (randInt(0,100) < rate)
		return true;
	else
		return false;
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function netflix()
{
	var m = "";

	// first create 1-3 adjectives
	for (var i=0; i<randInt(1,3); i++)
		m += adj.pickAndPad();

	// then add the genre
	m += genre.pickAndPad();

	// then a description some of the time
	if (chance(50)) m += desc.pickAndPad();

	// and an area some of the time
	if (chance(50)) m += area.pickAndPad();

	// and a content domain some of the time
	if (chance(50)) m += content.pickAndPad();

	// and an age some of the time
	if (chance(20)) m += ages.pickAndPad();

	// and an age some of the time
	if (chance(20)) m += ages.pickAndPad();

	// and a role some of the time
	if (chance(10)) m += role.pickAndPad() + star.pick();

	return m.trim();
}

function tweet() {
	var tweetText = netflix();

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

function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);  // date/time of the request
	tweet();
}

// Run the bot
runBot();

// And recycle every hour
setInterval(runBot, 1000 * 60 * 60);
