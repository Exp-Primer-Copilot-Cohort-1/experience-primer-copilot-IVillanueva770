// Create web server 
// Load modules
var http = require("http");
var url = require("url");
var fs = require("fs");
var querystring = require("querystring");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var db;

// Connect to database
mongoose.connect("mongodb://localhost/comments");
db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function(callback) {
	console.log("Connected to database");
});

// Create schema
var userSchema = new Schema({
	username: String,
	password: String,
	email: String,
	comments: [{ type: ObjectId, ref: "Comment" }]
});
var commentSchema = new Schema({
	comment: String,
	date: Date,
	user: { type: ObjectId, ref: "User" }
});

// Create models
var User = mongoose.model("User", userSchema);
var Comment = mongoose.model("Comment", commentSchema);

// Passport configuration
passport.use(new LocalStrategy(function(username, password, done) {
	User.findOne({ username: username }, function(err, user) {
		if (err) {
			return done(err);
		} else if (!user) {
			return done(null, false, { message: "Incorrect username." });
		} else {
			bcrypt.compare(password, user.password, function(err, res) {
				if (err) {
					return done(err);
				} else if (res === false) {
					return done(null, false, { message: "Incorrect password." });
				} else {
					return done(null, user);
				}
			});
		}
	});
}));

// Serialize user
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

// Deserialize user
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

// Configure Express
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use