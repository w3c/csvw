# Updating vocabulary

Vocabulary definitions are managed in \_vocab.csv. Add or change entries within this file. Regenerate csvw.ttl, csvw.jsonld, and index.html as described below.

# Building index.html, csvw.jsonld and csvw.ttl

All files are based on \_vocab.xlsx, used to generate \_vocab.csv. Run `mk_vocab.rb` to build both `index.html`, `csvw.jsonld` and `csvw.ttl`
