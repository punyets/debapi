// Remember it's just a way for the library to know how to handle the values these modeled fields contains
// that there is no need to really reflect every datatype imaginable. The abstraction should be enough when
// the library knows how to deal with what a field contains and does it with correctness.

// Hence, there was some new changes occured, perhaps made it more simplified for the sake of soundness.

// Removed <sense> property. Realised it was a redundant thing. And also did realise that compose should be
// more of a 'mapper' method instead of a 'setter' method. It is now a converter instead of a setter.
//
// The Fields doesn't contain the data anymore. They are instead descriptors now, not really much as a data
// structure.

const Fields = {};

Fields.types = {
	PRIMARY_KEY: 11,
	INTEGER: 12,
	FLOAT: 18,
	STRING: 13,
	BOOLEAN: 14,
	DATETIME: 15,
	TIME: 16,
	DATE: 17,
};

Fields.Prefabs = {};

Fields.Prefabs.BaseField = class {
	field_name;
	#ref_field_name;
	type;

	name;

	default_value = null;

	default_on_unset;

	primary_key = false;

	constructor({
		field_name,
		default_on_unset,
		default_value = null,
		primary_key = false,
	}) {
		this.primary_key = primary_key;
		this.default_on_unset = default_on_unset;
		this.default_value = default_value;
		this.field_name = field_name;
		this.ref_field_name = field_name;
	}

	compose(field_value) {
		if (field_value !== undefined && field_value !== null) {
			// data !== undefined && field_value !== null && (this.default_on_unset == true or this.default_on_unset == false)
			return field_value;
		} else if (this.default_on_unset == true) {
			// !(data !== undefined && field_value !== null), so (data === undefined || field_value === null) && (this.default_on_unset == true)
			return this.default;
		} else if (this.default_on_unset == false) {
			// (data === undefined || field_value === null) && !(this.default_on_unset == true) && this.default_on_unset == false -| (data === undefined || field_value === null) && this.default_on_unset == false
			throw '`data` is empty, while default_on_unset option is false';
		}
	}

	set ref_name(value) {
		this.#ref_field_name = value;
	}

	get ref_name() {
		return this.#ref_field_name;
	}

	get is_primary_key() {
		return this.primary_key;
	}

	get field_type() {
		return this.name;
	}

	get fieldname() {
		return this.field_name;
	}

	get datatype() {
		return this.type;
	}

	get default() {
		return this.default_value;
	}

	static throw_datatype_unsame(instance) {
		throw `Field value argument ${instance.constructor.name}.compose() not same type for its ${instance.constructor.name}.datatype`;
	}
};

Fields.Prefabs.Integer = class extends Fields.Prefabs.BaseField {
	type = 'INT';
	name = Fields.types.INTEGER;

	compose(field_value) {
		if (field_value === undefined || field_value === null) {
			super.compose(field_value);
		} else {
			try {
				super.compose(parseInt(field_value));
			} catch (error) {
				throw `Field value argument ${this.constructor.name}.compose()} can't be represnted as an integer.`;
			}
		}
	}
};

Fields.Prefabs.Float = class extends Fields.Prefabs.BaseField {
	type = 'FLOAT';
	name = Fields.types.FLOAT;

	compose(field_value) {
		if (field_value === undefined || field_value === null) {
			return super.compose(field_value);
		} else {
			try {
				super.compose(parseFloat(field_value));
			} catch (error) {
				throw `Field value argument ${this.constructor.name}.compose()} can't be represnted as a float.`;
			}
		}
	}
};

Fields.Prefabs.String = class extends Fields.Prefabs.BaseField {
	type = 'STR';
	name = Fields.types.STRING;

	compose(field_value) {
		if (field_value === undefined || field_value === null) {
			return super.compose(field_value);
		} else {
			try {
				super.compose(field_value.toString());
			} catch (error) {
				throw `Field value argument ${this.constructor.name}.compose()} can't be represnted as a string.`;
			}
		}
	}
};

Fields.Prefabs.Boolean = class extends Fields.Prefabs.BaseField {
	type = 'BOOL';
	name = Fields.types.BOOLEAN;

	compose(field_value) {
		if (field_value === undefined || field_value === null) {
			return super.compose(field_value);
		} else {
			try {
				super.compose(!!field_value);
			} catch (error) {
				throw `Field value argument ${this.constructor.name}.compose()} can't be represnted as a boolean.`;
			}
		}
	}
};

// omitted the <auto_now> and <auto_now_add> properties. Redundant... was trying to show off that time.
Fields.Prefabs.ChronoTypeField = class extends Fields.Prefabs.BaseField {
	constructor({
		field_name,
		current_timestamp_as_default,
		primary_key = false,
	}) {
		super({
			field_name: field_name,
			default_value: current_timestamp_as_default,
			primary_key: primary_key,
		});
	}

	get default() {
		return this.now();
	}

	now() {
		throw `abstract method ${Fields.Prefabs.ChronoTypeField.constructor.name}.now() must be implemented`;
	}
};

Fields.Prefabs.DateTime = class extends Fields.Prefabs.ChronoTypeField {
	type = 'DATETIME';
	name = Fields.types.DATETIME;

	compose(datetime_iso) {
		if (datetime_iso instanceof Date) {
			return `${datetime_iso.getFullYear()}-${datetime_iso.getMonth()}-${datetime_iso.getDate()} ${datetime_iso.getHours()}:${datetime_iso.getMinutes()}:${datetime_iso.getSeconds()}`;
		} else {
			let [iso_date, iso_time] = datetime_iso.split(' ');
			if (
				!/^[0-9]{4}-(0[0-9]|1[0-2])-([0-2][0-9]|3[0-1])$/.test(iso_date)
			)
				// verify if it's in iso format
				throw 'Invalid iso_date input. Must be in ISO format.';
			if (
				iso_time &&
				!/^(([0-1][0-9]|2[0-3])(:[0-5][0-9]){2})$/.test(iso_time)
			)
				// verify if it's in iso format
				throw 'Invalid iso_time input. Must be in ISO format.';

			iso_time ??= '00:00:00';

			return iso_date + ' ' + iso_time;
		}
	}

	now() {
		const current_date = new Date();
		return `${current_date.getFullYear()}-${current_date.getMonth()}-${current_date.getDate()} ${current_date.getHours()}:${current_date.getMinutes()}:${current_date.getSeconds()}`;
	}
};

Fields.Prefabs.Time = class extends Fields.Prefabs.ChronoTypeField {
	type = 'TIME';
	name = Fields.types.TIME;

	compose(iso_time) {
		if (iso_time === undefined || iso_time === null) {
			return super.compose(iso_time);
		} else {
			if (typeof iso_time === 'string') {
				iso_time = iso_time.trim();
				if (/^(([0-1][0-9]|2[0-3])(:[0-5][0-9]){2})$/.test(iso_time))
					// verify if it's in iso format
					return iso_time;
			}
			self.throw_datatype_unsame(this);
		}
	}

	now() {
		const current_date = new Date();
		return `${current_date.getHours()}:${current_date.getMinutes()}:${current_date.getSeconds()}`;
	}
};

Fields.Prefabs.Date = class extends Fields.Prefabs.ChronoTypeField {
	type = 'DATE';
	name = Fields.types.DATE;

	compose(iso_date) {
		if (iso_date === undefined || iso_date === null) {
			return super.compose(iso_date);
		} else {
			if (typeof iso_date === 'string') {
				iso_date = iso_date.trim();
				if (
					/^[0-9]{4}-(0[0-9]|1[0-2])-([0-2][0-9]|3[0-1])$/.test(
						iso_date,
					)
				)
					// verify if it's in iso format
					return iso_date;
			}
			self.throw_datatype_unsame();
		}
	}

	now() {
		const current_date = new Date();
		return `${current_date.getFullYear()}:${current_date.getMonth()}:${current_date.getDate()}`;
	}
};

// INTERFACE.
Fields.Integer = ({
	field_name,
	default_value = null,
	default_on_unset = false,
	primary_key = false,
}) => {
	return new Fields.Prefabs.Integer({
		field_name: field_name,
		default_on_unset: default_on_unset,
		default_value: default_value,
		primary_key: primary_key,
	});
};

Fields.Float = ({
	field_name,
	default_on_unset,
	default_value = null,
	primary_key = false,
}) => {
	return new Fields.Prefabs.Float({
		field_name: field_name,
		default_on_unset: default_on_unset,
		default_value: default_value,
		primary_key: primary_key,
	});
};

Fields.String = ({
	field_name,
	default_on_unset,
	default_value = null,
	primary_key = false,
}) => {
	return new Fields.Prefabs.String({
		field_name: field_name,
		default_on_unset: default_on_unset,
		default_value: default_value,
		primary_key: primary_key,
	});
};

Fields.Boolean = ({
	field_name,
	default_on_unset,
	default_value = null,
	primary_key = false,
}) => {
	return new Fields.Prefabs.Boolean({
		field_name: field_name,
		default_on_unset: default_on_unset,
		default_value: default_value,
		primary_key: primary_key,
	});
};

// TODO: Implement default_value as well.
Fields.DateTime = ({
	field_name,
	default_on_unset,
	current_timestamp_as_default,
	primary_key = false,
}) => {
	return new Fields.Prefabs.DateTime({
		field_name: field_name,
		default_on_unset: default_on_unset,
		current_timestamp_as_default: current_timestamp_as_default,
		primary_key: primary_key,
	});
};

Fields.Time = ({
	field_name,
	default_on_unset,
	current_timestamp_as_default,
	primary_key = false,
}) => {
	return new Fields.Prefabs.Time({
		field_name: field_name,
		default_on_unset: default_on_unset,
		current_timestamp_as_default: current_timestamp_as_default,
		primary_key: primary_key,
	});
};

Fields.Date = ({
	field_name,
	default_on_unset,
	current_timestamp_as_default,
	primary_key = false,
}) => {
	return new Fields.Prefabs.Date({
		field_name: field_name,
		default_on_unset: default_on_unset,
		current_timestamp_as_default: current_timestamp_as_default,
		primary_key: primary_key,
	});
};

module.exports = Fields;
