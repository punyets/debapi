const { Schema, Table, Fields } = require('./debapi.js');

const database = new Schema({
	dbname: 'database',
	username: 'userman',
	password: 'passing',
	socket: './unix.sock',
});

const customer_table = new Table({
	tablename: 'customers',
	fields: {
		customer_id: Fields.Integer({
			field_name: 'customerId',
			default_on_unset: true,
			default_value: null,
			primary_key: true,
		}),
		customer_name: Fields.String({
			field_name: 'customerNamd',
			default_value: 'John Doe',
			default_on_unset: true,
		}),
		// TODO: implement default time/date/datetime as well.
		customer_time_of_birth: Fields.Time({
			field_name: 'hourOfBirth',
			default_on_unset: true,
			current_timestamp_as_default: true,
		}),
		customer_date_of_birth: Fields.Date({
			field_name: 'dateOfBirth',
			default_on_unset: true,
			current_timestamp_as_default: true,
		}),
		member_since: Fields.DateTime({
			field_name: 'memberSince',
			default_on_unset: true,
			current_timestamp_as_default: true,
		}),
	},
	schema: database,
});

const some_query = customer_table
	.entries()
	.filter({
		filter_logic:
			'customer_name__like1 | (customer_name__like2 & member_since__like)',
		customer_name__like1: 'Doe',
		customer_name__like2: 'Jane',
		member_since__like: new Date('2023-04-21'),
	})
	.order_by({ customer_name: 'ASC' })
	.limit(10)
	.values; // query won't execute until you call values.

const some_row = customer_table.entries().get(2);

const joined_customer_manager = customer_table.select("id_no", "customer_name")
	.join(managers_table.select("id_no", "manager_name", "branch"), "inner", { main_field: 'id_no', join_field: 'id_no'}).filter().values;

	// select `id_no`, `customer_name`, 
	// select `customers.id_no`, `customers.customer_name`, `managers.id_no`, `managers.manager_name`, `managers.branch` FROM customers WHERE customers.customer_name like 'Doe' INNER JOIN `managers` ON (`customers.id_no` = `managers.id_no`)
const all_query = customer_table.entries().all().order_by({ member_since: 'DESC' }).values;

// some sandbox file.
