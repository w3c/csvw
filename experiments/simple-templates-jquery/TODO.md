* The filters should have a reference to the current cell's column name and the whole row. Proabably this means that a 'context' object should collect these info and provide this as a one single argument.
* Error handling is lousy
* Escaping characters is a major problem (and this affects the grammar, too)
