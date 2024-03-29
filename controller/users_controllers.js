//external imports
const bcrypt = require("bcrypt");
const { unlink } = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// internal imports
const User = require("../models/People");
const Conversation = require("../models/Conversations");
const createHttpError = require("http-errors");
const { escape, getStandardResponse } = require("../utils/helpers");
const { authenticateGoogle, deleteFileFromLocal, uploadToGoogleDrive } = require("../utils/upload_to_google_drive");

// get user conversation
async function getUserConversation(req, res, next) {
	try {
		const conversations = await Conversation.find({
			$or: [{ "creator.id": req.user.id }, { "participant.id": req.user.id }],
		});
		res.status(200).json(getStandardResponse(true, "", { conversations }));
	} catch (err) {
		next(err);
	}
}

// add user
async function addUser(req, res, next) {
	let newUser;
	const hashedPassword = await bcrypt.hash(req.body.password, 10);

	if (req.files && req.files.length > 0) {
		const auth = authenticateGoogle();
		const avatarURL = await uploadToGoogleDrive(req.files[0], auth, true);
		deleteFileFromLocal(`avatar/${req.files[0].filename}`);
		newUser = new User({
			...req.body,
			avatar: String(avatarURL),
			password: hashedPassword,
		});
	} else {
		newUser = new User({
			...req.body,
			password: hashedPassword,
		});
	}

	// save user or send error
	try {
		await newUser.save();

		const userObj = {
			id: newUser._id,
			name: newUser.name,
			email: newUser.email,
			avatar: newUser.avatar || null,
			googleID: newUser.googleID ?? null,
			role: "user",
		};

		// res.status(200).json(getStandardResponse(true, "User added successfully!", newUser));
		// generate token
		const token = jwt.sign(userObj, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
		// set cookie
		res.cookie(process.env.COOKIE_NAME, token, {
			maxAge: process.env.JWT_EXPIRY,
			httpOnly: true,
			signed: true,
		});

		// set logged in user local identifier
		res.status(200).json(getStandardResponse(true, "", { ...userObj, token }));
	} catch (err) {
		const errors = {
			common: {
				msg: err.message,
			},
		};
		res.status(500).json(getStandardResponse(false, "An error occured!", { errors }));
	}
}

// serach user
async function searchUser(req, res, next) {
	const user = req.body.user;
	const searchQuery = user.replace("+88", "");

	const name_search_regex = new RegExp(escape(searchQuery), "i");
	// const mobile_search_regex = new RegExp("^" + escape("+88" + searchQuery));
	const email_search_regex = new RegExp("^" + escape("+88" + searchQuery) + "$", "i");

	try {
		if (searchQuery !== "") {
			const users = await User.find(
				{
					$or: [
						{
							name: name_search_regex,
						},
						// {
						// 	mobile: mobile_search_regex,
						// },
						{
							email: email_search_regex,
						},
					],
				},
				"name avatar mobile"
			);

			res.json(getStandardResponse(true, "", { users }));
		} else {
			throw createHttpError("You must provide some text to search!");
		}
	} catch (err) {
		const errors = {
			common: {
				msg: err.message,
			},
		};
		res.status(500).json(getStandardResponse(false, "An error occured", { errors }));
	}
}

// delete user
async function deleteUser(req, res, next) {
	try {
		const user = await User.findByIdAndDelete({ _id: req.params.id });
		if (user.avatar) {
			unlink(path.join(__dirname, `/../public/uploads/avatars/${user.avatar}`), (err) => {
				if (err) console.log(err);
			});
		}

		res.status(200).json(getStandardResponse(true, "User Deleted Successfully!", {}));
	} catch (error) {
		const errors = {
			common: {
				msg: "Could not delete the user!",
			},
		};
		res.status(500).json(getStandardResponse(false, "An error occured", { errors }));
	}
}

module.exports = {
	getUserConversation,
	addUser,
	searchUser,
	deleteUser,
};
