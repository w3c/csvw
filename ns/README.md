# Building context.jsonld and vocab.ttl

Both files are based on \_vocab.xlsx, used to generate \_vocab.csv. Run `mk_vocab.rb` to build both `context.jsonld` and `vocab.ttl`

    ./mk_vocab.rb --format ttl -o vocab.ttl _vocab.csv
    ./mk_vocab.rb --format jsonld -o context.jsonld _vocab.csv
    ./mk_vocab.rb --format html -o index.html _vocab.csv
