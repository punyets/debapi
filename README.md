# debapi

Currently written in PHP.

See `old.codebase/example.main.php` file to see how this library can be used for 
querying stuff while forgetting about how to write SQL.

## PREAMBLE \[DONE\]
Setup environment:\
&emsp;Setup nodejs: npm start....

## TRANSLATION
### First phase: (wil) [done—superficially; functionality—not sure]
1. db.schema.prefab.php\
2. db.table.prefab.php\

### Second phase: (wil)
Edit data structure related stuff first:\
1. db.model.arbiter.php [done with the translation; untested] — a lot of overhauls, recommend reading the comments inside the file.
2. db.datatypes.arbiter.php [done with the translation; untested] — a lot of overhauls, recommend reading the comments inside the file.
3. db.query.arbiter.php [done with the translation; untested] — a lot of overhauls, rewrote the classes from the ground up.
4. db.adit.arbiter.php [done with a part of it; untested] — just implemented only the fetching stuff, not really the saving, editing, deleting stuffs.

### Last phase: (wil)
QueryType.type.php — can be worked on disjoin from the first and second phase.\
QuerySet.type.php — takes after QueryType

## UPGRADATION

- Implement JOIN, & SUBQUERIES. — This is important.

- Aggregate Functions for SELECT statements — Kinda important.

- Remove `tokenized field names` — implicates so much overhead.

- RELATIONAL FIELDS — In the Table declarations, must have have option to specify what 
type of relation it has. (optional) (deprecated)

- VIEWS (optional)

- Add support for PostgreSQL — unsure... Let's see what comes up in the future.

## DISCLAIMER
This Library is only for the Data Manipulation (DML) aspect of MySQL (and maybe PostgreSQL). Assume that 
the table being modeled with the `Prefabs\Table` is already created and THE SAME.
