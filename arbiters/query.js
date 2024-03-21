// write_...() methods only validate arguments and replace replace prefabricated strings with those; In a way
// the keys within the prefabricated arguments are the strings in some cases.

// TODO: now integrate the CLAUSES classes to QueryFactory;
class QueryFactory {
	#TableModel;

	constructor(tableInstance) {
		this.#TableModel = tableInstance;
	}
	
	SELECT(return_columns = null) {
		return new SELECT(this.#TableModel, return_columns);
	}

	INSERT(columns_values) { // { <column>: <value> }
		return new INSERT(this.#TableModel, columns_values);
	}

	UPDATE(columns_values) { // { <column>: <value> }
		return new UPDATE(this.#TableModel, columns_values);
	}

	DELETE(where, where_logic) {
		return new DELETE(this.#TableModel, where, where_logic);
	}
}

// another attempt at deconstructing... this is where we do extensions, modifications for logic for creating clauses.
//
// All these CLAUSES must be called one time. They just build, not really represent. You can't call methods more than once.

class CLAUSE {
	stmnt;
	params = {};

	table_model;
	prefab;

	constructor(table_model, ...values) {
		this.table_model = table_model;
		for (let i = 0, j = 0;  i < this.prefab.length && j < values.length; i++) {
			if (this.prefab[i] === undefined) {
				this.prefab[i] = values[j];
				j++;
			}
		}
	}

	get value() {
		return this.stmnt.filter(value => value !== undefined).join(' ');
	}
}

class WHERE extends CLAUSE {
	prefab = ['WHERE', undefined];

	static #WHERE_OPERATORS = {
		not: 'NOT `%0` = %1',
		eq: '`%0` = %1',
		lte: '`%0` <= %1',
		gte: '`%0` >= %1',
		lt: '`%0` < %1',
		gt: '`%0` > %1',
		like: '`%0` LIKE %1',
	};

	static #WHERE_LOGIC = {
		'|': ' OR ',
		'&': ' AND ',
	};

	#filters_expressions;
	#filter_logic;

	constructor(
		table_model,
		filters_expressions,
		filter_struct = undefined,
	) {
		if (filters_expressions !== undefined) {
			const params = {};
			super(
				table_model,
				WHERE.#fab_clause(
					table_model,
					params,
					filters_expressions,
					filter_struct,
				),
			);
			Object.assign(this.params, params);
			this.#filter_logic = filter_struct;

			this.#filters_expressions = filters_expressions;

			// this.stmnt is already bothered in super();

		} else {
			super(table_model, '%0');

			// this.stmnt is bothered but still unchanged in the end.
			
			this.#filters_expressions = {};
			this.#filter_logic = filter_struct;
		}
	}

	// (`user_id__like` & `customer__eq`) | `country__eq`
	set_where_logic(filter_struct) {
		// returns false if the symbols specified does not match the given fields for filter.
		if (typeof filter_struct !== 'string') {
			throw 'Must be a string of propositional formula.';
		}

		const backticks_matches = filter_struct.match(/`/g).length;
		if (backticks_matches == 0)
			throw 'The filter expressions should be wrapped by backticks "`".';
		else if (backticks_matches % 2 != 0)
			throw 'The filter expression are not properly wrapped by backticks "`".';

		if (filter_struct.replace(/(&|\|\||\(|\)|\s)*/, '').length)
			throw 'The valid characters are "||" and "&". Please look again on your argument.';
		if (
			filter_struct.match(/\(/g).length !=
			filter_struct.match(/\)/g).length
		)
			throw 'The parenthesis are not properly wrapping expressions';

		this.#filter_logic = filter_struct;

		if (!Object.keys(this.#filters_expressions)) {
			// don't do anything if there's nothing to set for.
			return;
		}

		this.stmnt = WHERE.#fab_clause(
			this.table_model,
			this.params,
			this.#filters_expressions,
			filter_struct,
		);

		return this;
	}

	set_filter(filters_exprs) {
		this.stmnt = WHERE.#fab_clause(
			this.table_model,
			this.params,
			filters_exprs,
			this.#filter_logic,
		);

		return this;
	}

	// handles fabricating logically structured clauses or conjunctive-only structured clause;
	// TODO: Make it accept subqueries.
	static #fab_clause(
		table_model,
		params,
		filters_expressions, // { userid__eq: 1 }; { userid__eq1: 2, userid__eq2: 1 };
		filter_logic = undefined,
	) {
		const ref_to_real_pairs = table_model.ref_to_real_pairs();

		if (filter_logic === undefined) {
			const filter_phrase = [];
			for (const filter in filters_expressions) {
				const field = filter.split('__');

				const operator_expression = WHERE.#WHERE_OPERATORS[field.pop().replace(/\d+/, '')]; // remove uid.
				const real_field = ref_to_real_pairs[field.join('__')];

				if (
					real_field === undefined ||
					operator_expression === undefined
				) {
					throw `Input filter term \`${filter}\` is not valid.`;
				}

				filter_phrase.push(
					operator_expression
						.replace(/%0/g, `\`${real_field}\``)
						.replace(/%1/g, `:flt-${filter}`),
				);

				params[`flt-${filter}`] = filters_expressions[filter];
			}
			return filter_phrase.join(' AND ');
		} else {
			const filter_names = new Set();
			let filter_phrase = filter_logic.replace(/\||&/g, function (match) {
				return WHERE.#WHERE_LOGIC[match];
			});

			filter_phrase = filter_phrase.replace(/`\w+`/g, function (filter) {
				const field = filter.split('__');
				const operator_expression = WHERE.#WHERE_OPERATORS[field.pop().replace(/\d+/, '')]; // remove uid.
				const real_field = ref_to_real_pairs[field.join('__')];

				if (
					real_field === undefined ||
					operator_expression === undefined
				) {
					throw `Input filter term \`${filter}\` is not valid.`;
				}

				filter_names.add(field);

				params[`flt-${filter}`] = filters_expressions[filter];

				return operator_expression
					.replace(/%0/g, `\`${real_field}\``)
					.replace(/%1/g, `:flt-${filter}`);
			});

			if (filter_names == new Set(Object.keys(filters_expressions)))
				throw 'Filter structure does not align to given WHERE terms.';

			return filter_phrase;
		}
	}
}

// TODO: add aggregate functions as well.
class SELECT extends CLAUSE {
	//prefab = 'SELECT %0 FROM %1 %WHERE %ORDER_BY %LIMIT';
	prefab = ['SELECT', undefined, 'FROM', undefined, undefined, undefined, undefined];
	#where;

	constructor(table_model, columns = null) {
		// must accept aggregate functions

		if (columns === null) {
			columns = ['*'];
		} else {
			const ref_to_real_pairs = table_model.ref_to_real_pairs();
			for (let i = 0; i < columns.length; i++) {
				if (ref_to_real_pairs[columns[i]] === undefined) {
					throw `Invalid field name supplied. \`${columns[i]}\` does not exist.`;
				}
				columns[i] = `\`${columns[i]}\``;
			}
		}
		super(
			table_model,
			undefined,
			table_model.tablename,
			columns.join(', '),
		);
	}

	get params() {
		return this.#where.params;
	}

	WHERE(filters_terms) {
		if (this.#where === undefined) {
			this.#where = new WHERE(this.table_model, filters_terms); 
			this.stmnt[4] = this.#where.value;
		} else {
			this.stmnt[4] = this.#where.set_filter(filters_terms).value; 
		}
		return this;
	}

	WHERE_LOGIC(filter_logic) {
		if (this.#where === undefined) {
			// this.stmnt will be updated within this method
			this.#where = new WHERE(
				this.table_model,
				this,
				undefined,
				filter_logic,
			);
		} else {
			// this.stmnt will be updated within this method
			this.stmnt[4] = this.#where.set_where_logic(filter_logic).value;
			
		}
		return this;
	}

	ORDER_BY(fields_orders) {
		let order_by = 'ORDER BY';
		for (const field in fields_orders) {
			if (
				fields_orders[field] != 'ASC' ||
				fields_orders[field] != 'DESC'
			) {
				throw 'Invalid order keyword. Must be `ASC` or `DESC`';
			}
			order_by += ` \`${field}\` ${fields_orders[field]}`;
		}
		this.stmnt[5] = order_by;
		return this;
	}

	LIMIT(integer) {
		if (typeof integer == 'number') {
			this.stmnt[6] = `LIMIT ${integer}`;
		} else {
			throw 'Invalid LIMIT constraint. Must be a number.';
		}
		return this;
	}
}

class INSERT extends CLAUSE {
	prefab = ['INSERT INTO', undefined, undefined, 'VALUES', undefined, '%MORE'];
	itemid = 1;

	insert_columns;

	constructor(table_model, columns_values) {
		// must accept aggregate functions
		const fieldnames = [];
		const ph_values_seq = [];
		const tablefields = table_model.tablefields;
		const params = {};
		const insert_columns = [];

		columns_values = Object.assign({}, columns_values);
		// remove empty/default-value columns. since you have set the <default_value> to be the same from the db, then just remove it.
		for (const field in columns_values) {
			// "don't remove" when field is not empty.
			if (
				tablefields[field] &&
				columns_values[field] !== tablefields[field].default
			) {
				fieldnames.push(`\`${tablefields[field].fieldname}\``);
				insert_columns.push(field);
				ph_values_seq.push(`:val0-${field}`);
				params[`val0-${field}`] = columns_values[field];
			} else {
				throw 'Invalid columns given for insert.';
			}
		}

		super(
			table_model,
			table_model.tablename,
			fieldnames.join(', '),
			'(' + ph_values_seq.join(', ') + ')',
		);
		Object.assign(this.params, params);
	}

	VALUES(columns_values) {
		if (new Set(this.insert_columns) != new Set(Object.keys(columns_values))) {
			throw 'Input is inconsistent corresponding values for INSERT.VALUES()';
		}

		const ph_values_seq = new Array(this.insert_columns.length);
		const tablefields = this.table_model.tablefields;
		const insert_columns = this.insert_columns;

		let field;
		// remove empty/default-value columns. since you have set the <default_value> to be the same from the db, then just remove it.
		for (let i = 0; i < insert_columns.length; i++) {
			field = insert_columns[i];
			// "don't remove" when field is not empty.
			if (columns_values[field] !== tablefields[field].default) {
				ph_values_seq[i] = `:val${this.itemid}-${field}`; // will be the same correspondence, for sure.
				this.params[`val${this.itemid}-${field}`] =
					columns_values[field];
			}
		}

		this.stmnt[5] = this.stmnt[5].replace('%MORE', `, (${ph_values_seq.join(', ')})%MORE`);

		this.itemid++; // > 0;

		return this;
	}

	get value() {
		return super.value.replace(/%\w+/, '');
	}
}

class UPDATE extends CLAUSE {
	prefab = ['UPDATE', undefined, 'SET', undefined, undefined];

	#where;

	constructor(table_model, columns_entries) {
		const update_phrase = [];

		const ref_to_real_pairs = table_model.ref_to_real_pairs();
		for (const field in columns_entries) {
			if (ref_to_real_pairs[field] === undefined) {
				throw `Invalid field name supplied. \`${field}\` does not exist.`;
			}
			update_phrase.push(`\`${ref_to_real_pairs[field]}\` = :new-${field}`);
		}

		super(table_model, table_model.tablename, update_phrase.join(', '));
	}

	WHERE(filters_terms) {
		if (this.#where === undefined) {
			this.#where = new WHERE(this.table_model, filters_terms); 
			this.stmnt[4] = this.#where.value;
		} else {
			this.stmnt[4] = this.#where.set_filter(filters_terms).value; 
		}
		return this;
	}

	WHERE_LOGIC(filter_logic) {
		if (this.#where === undefined) {
			// this.stmnt will be updated within this method
			this.#where = new WHERE(
				this.table_model,
				this,
				undefined,
				filter_logic,
			);
		} else {
			// this.stmnt will be updated within this method
			this.stmnt[4] = this.#where.set_where_logic(filter_logic).value;
			
		}
		return this;
	}
}

class DELETE extends CLAUSE {
	prefab = ['DELETE FROM', undefined];
	#where;

	constructor(table_model, filters_terms, filter_logic=undefined) {
		super(table_model, undefined, table_model.tablename);

		this.#where = new WHERE(table_model, this, filters_terms, filter_logic);
		this.stmnt[1] = this.#where.value;
	}

	WHERE(filters_terms) {
		if (this.#where === undefined) {
			this.#where = new WHERE(this.table_model, filters_terms); 
			this.stmnt[1] = this.#where.value;
		} else {
			this.stmnt[1] = this.#where.set_filter(filters_terms).value; 
		}
		return this;
	}

	WHERE_LOGIC(filter_logic) {
		if (this.#where === undefined) {
			// this.stmnt will be updated within this method
			this.#where = new WHERE(
				this.table_model,
				this,
				undefined,
				filter_logic,
			);
		} else {
			// this.stmnt will be updated within this method
			this.stmnt[1] = this.#where.set_where_logic(filter_logic).value;
			
		}
		return this;
	}
}

module.exports = QueryFactory;
