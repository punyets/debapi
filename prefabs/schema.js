// removed <dsn> aspect within the `constructor`.
// removed ssl aspect also. still need to learn delicate parts `mysql` lib first.
// remove `Table` function. I honestly forgot what that thing was about...
const SQL = require('mysql');
class Schema {
	#database;

	#host;
	#port;
	#socket;

	// user credentials
	#username;
	#password;

	#options = [];

	#ssl_ca;
	#ssl_cert;
	#ssl_key;
	#ssl_ca_path;
	#ssl_cipher;

	#CONN;

	static #CURRENT_CONN;

	constructor({
		dbname,
		username,
		port = '',
		host = '',
		socket = '',
		password = '',
	}) {
		this.#database = dbname;

		if (!socket) {
			// use url.
			this.#port = port;
			this.#host = host;
		} else {
			// use socket file to connect to sql service wihin same machine (for unix only).
			this.#socket = socket;
		}

		this.#username = username;
		this.#password = password;

		return this;
	}

	init() {
		this.#CONN = SQL.createPoolCluster();

		if (this.socket) {
			this.#CONN.add('query', {
				connectionLimit: 20,
				database: this.#database,
				user: this.#username,
				password: this.#password,
				socket: this.#socket,
			});
			this.#CONN.add('dml', {
				connectionLimit: 20,
				database: this.#database,
				user: this.#username,
				password: this.#password,
				socket: this.#socket,
			});
		} else {
			this.#CONN.add('query', {
				connectionLimit: 20,
				database: this.#database,
				user: this.#username,
				password: this.#password,
				host: this.#host,
				port: this.#port,
			});
			this.#CONN.add('dml', {
				connectionLimit: 20,
				database: this.#database,
				user: this.#username,
				password: this.#password,
				host: this.#host,
				port: this.#port,
			});
		}
	}

	get connection() {
		return this.#CONN;
	}

	//use() {
	//Schema.#CURRENT_CONN = this.#CONN;
	//return this;
	//}

	//attach() {
	//return Schema.#CURRENT_CONN;
	//}
}

module.exports = Schema;
