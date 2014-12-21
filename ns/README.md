# Updating vocabulary

Vocabulary definitions are managed in \_vocab.xlsx. Add or change entries within this file and export as CSV to \_vocab.csv. Regenerate csvw.ttl, csvw.jsonld, and index.html as described below.

# Building index.html, context.jsonld and vocab.ttl

All files are based on \_vocab.xlsx, used to generate \_vocab.csv. Run `mk_vocab.rb` to build both `context.jsonld` and `vocab.ttl`

    ./mk_vocab.rb --format ttl -o cwvw.ttl _vocab.csv
    ./mk_vocab.rb --format jsonld -o csvw.jsonld _vocab.csv
    ./mk_vocab.rb --format html -o index.html _vocab.csv
