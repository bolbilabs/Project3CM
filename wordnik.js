var Wordnik = require('wordnik');

var wn = new Wordnik({
    api_key: '8489c93205db115a8d93702980e0ce6775085279d0473e1c6'
});

wn.word('minimalism', {
    useCanonical: true
  , includeSuggestions: true
}, function(e, word) {
  console.log(e, word);

  word.related({
      limit: 1
  }, console.log);
});

wn.definitions('pernicious', function(e, defs) {
  console.log(e, defs);
});
