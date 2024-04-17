const QueryFactory = require('./query.js');

class Adit {
	#Table;
	#QueryFactory;

	cache_get_adit;

	constructor(Table) {
		this.#Table = Table;
		this.#QueryFactory = new QueryFactory(Table);
	}

	all() {
		return new SelectAdit(this.#Table, this.#QueryFactory);
	}

	filter({ filter_logic, ...filters_terms }) {
		return new FilterAdit(
			this.#Table,
			this.#QueryFactory,
			filter_logic,
			...filters_terms,
		);
	}

	join(join_table, join_type, join_constraints) {
		return new JoinAdit(
			this.#Table,
			this.#QueryFactory,
			join_table,
			join_type,
			join_constraints,
		)
		// write join logic here.
	}

	get(id) {
		if (this.cache_get_stmnt) {
			this.cache_get_stmnt = new FilterAdit(this.#Table, this.#QueryFactory, undefined, { [this.#Table.pk_field+'__eq']: id});
		} else {
			this.cache_get_stmnt.stmnt.WHERE({ [this.#Table.pk_field+'__eq']: id });
		}

		return this.cache_get_stmnt.values; // return querytype.
	}
}

class DatabaseAdit {
	stmnt;
	statement;

	Table;
	query_factory;

	constructor(table_model, query_factory) {
		this.Table = table_model;
		this.query_factory = query_factory;
	}

	get values() {
		this.statement = this.stmnt.value;
		return this.resolve(this.statement);
	}
}

class JoinAdit extends SelectAdit {
	constructor(table_model, query_factory, join_table, join_type, join_constraints) {
		super(table, query_factory);
		this.stmnt = this.stmnt.JOIN(join_table, join_type, join_constraints); // this.stmnt is already initiated in SelectAdit()
	}

	limit(number) {
		this.stmnt.LIMIT(number);
		return this;
	}

	filter({ filter_logic, ...filters_terms }) {
		this.stmnt.WHERE_LOGIC(filter_logic).WHERE(...filters_terms);
		return this;
	}
}

class SelectAdit extends DatabaseAdit {
	constructor(table_model, query_factory) {
		super(table_model, query_factory);

		this.stmnt = query_factory.SELECT(table_model.fieldnames);
	}

	order_by(fields_orders) {
		this.stmnt.ORDER_BY(fields_orders);
		return this;
	}
}

class FilterAdit extends SelectAdit {
	constructor(table_model, query_factory, filter_logic, ...filters_terms) {
		super(table_model, query_factory);

		if (filter_logic)
			this.stmnt.WHERE_LOGIC(filter_logic).WHERE(filters_terms);
		else
			this.stmnt.WHERE(filters_terms);
	}

	limit(number) {
		this.stmnt.LIMIT(number);
		return this;
	}
}

module.exports = Adit;
