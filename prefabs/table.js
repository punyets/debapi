// [pivotal] The tables are now objects, not declarations (classes) anymore. Can't find a way where you can inherit the static things from the
// parent class without inheriting it by reference i.e. if you made a new class and inherited the things from the parent, the static things it
// has will be same. if class1 changed the static variable, that same static variable in class2 will also be changed. That's why I used the
// traits in PHP, as they offer a good way to make class templates, for better code reusage.

// `Model()` has now been ommited since of the decision of removing the `tokenized_field_names`.
// 		Still, the <fields> is still an object and it contains key-value pairs. key is the name we are going
// 		to refer to the field (value) from now on. not dual names anymore, which unecessarily implicates so
// 		much overhead.
//
// 		So, must update the BaseField descendant classes to have a method wherein to update the <ref_name>. And this <ref_name> is the only
// 		name to denote the field being worked on. The default value of <ref_name> is the <field_name>

// <indict> argument within `constructor()` is just a way for the user to do some preamble stuff if they want to define new methods or variables
// within the object being made.

// [pivotal] schemas are now assignable objects instead of those "omnipotent" background objects that define the courses of tables. So now,
// tables are now paired to a Schema. It is not anymore that tables just does whatever the Schema class feels like.

// renamed the property <entries> to <adit> instead.

// [important change] Ommited the TableModel. Since of the decision to make the Table trait from PHP become a class, there's no point making a class that "converts"
// the definitions from the classes pertained by the Table trait, to an object. Table class and TableModel class are now the same.

const Querytype = require('../types/querytype.js');
const Adit = require('../arbiters/adit.js');

class Table {
	adit;
	#Specs = {
		pk_field: undefined,
		fieldnames: undefined,
		fieldnames_maps: {
			//real_to_ref: undefined,
			ref_to_real: undefined,
		},
	};
	#Name;
	#Fields;
	#Schema;

	constructor({ tablename, fields, schema, indict = null }) {
		this.#Name = tablename;
		this.#Fields = fields;
		this.#Schema = schema;

		if (typeof indict === 'function') {
			indict(this, tablename, fields, schema);
		}

		// <defined_fieldname> is just <ref_name>
		for (const defined_fieldname in fields) {
			// therefore, keys in fields obj === fields[x].ref_name
			fields[defined_fieldname].ref_name = defined_fieldname;
			if (fields[defined_fieldname].is_primary_key) {
				this.#Specs.pk_field =
					fields[defined_fieldname].fieldname();
			}
		}
	}

	get tablename() {
		return this.#Name;
	}

	get pk_field() {
		return this.#Specs.pk_field;
	}

	get tablefields() {
		return { ...this.#Fields }; // the 'object' values are still referenced, so beware on changing.
	}

	get fieldnames() {
		return (this.#Specs.fieldnames ??= () => {
			const fieldnames = [];
			for (const ref_name in this.#Fields) {
				fieldnames.push(this.#Fields[ref_name].get_field_name());
			}
			return fieldnames;
		});
	}

	get ref_to_real_pairs() {
		return (this.#Specs.fieldnames_maps.ref_to_real ??= () => {
			const fields = {};
			for (const ref_name in this.#Fields) {
				fields[ref_name] = this.#Fields[ref_name].get_field_name();
			}
			return fields;
		});
	}

	//get fieldnames_pairs_real_to_ref() {
	//return this.#Specs.fieldnames_maps.real_to_ref ??= (() => {
	//const fields = {};
	//for (const ref_name in this.#Fields) {
	//fields[this.#Fields[ref_name].get_field_name] = ref_name;
	//}
	//return fields;
	//});
	//}

	create(content) {
		this.init();

		if (content.length == 0) return null;
		return new Querytype(content, this.entries, Querytype.EXISTENCE_NEW);
	}

	edit(pk, content) {
		let querytype = this.entries.get(pk);

		for (const [key, value] of Object.entries(content)) {
			querytype[key] = value;
		}

		querytype.save();
	}

	omit(queryset) {
		queryset.omit();
	}

	select(indict = null, columns) {
		const ref_to_real_pairs = this.ref_to_real_pairs();
		const selected_columns = {};
		for (let i = 0; i < columns.length; i++) {
			if (ref_to_real_pairs[columns[i]] === undefined) {
				throw `Invalid field name supplied. \`${columns[i]}\` does not exist.`;
			}
			selected_columns[columns[i]] = ref_to_real_pairs[columns[i]]
		}
		
		return new Adit(new Table(this.tablename, selected_columns, this.#Schema, indict));
	}

	join(join_table, join_type, join_constraints) {
		return this.adit.join(join_table, join_type, join_constraints)
	}

	entries() {
		this.init();
		return /*Adit*/this.adit;
	}

	get connection() {
		return this.#Schema.connection;
	}

	get schema() {
		return this.#Schema;
	}

	init() {
		if (this.adit === undefined) {
			this.indict();
			this.adit = new Adit(this); // now... TableAdit is now a builder for the interface for database in terms of Table;

			// no need to initiate query factory. since QueryFactory is the parent of TableAdit, you can
			// just put the Schema object in the QueryFactory and and QueryFactory will attach to that
			// connection from now on.
		}
	}
}

module.exports = Table;
