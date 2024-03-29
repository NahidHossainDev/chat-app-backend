// external import
const { check, validationResult } = require("express-validator");
const createError = require("http-errors");
const path = require("path");
const { unlink } = require("fs");

//internal imports
const User = require("../../models/People");
const { getStandardResponse } = require("../../utils/helpers");

// add user
const addUserValidators = [
	check("name")
		.isLength({ min: 1 })
		.withMessage("Name is required")
		.isAlpha("en-US", { ignore: " -" })
		.withMessage("Name must not contain anything other than alphabet")
		.trim(),
	check("email")
		.isEmail()
		.withMessage("Invalid email address")
		.trim()
		.custom(async (value) => {
			try {
				const user = await User.findOne({ email: value });
				if (user) {
					throw createError("Email already is use!");
				}
			} catch (err) {
				throw createError(err.message);
			}
		}),
	// check("mobile")
	// 	.isMobilePhone()
	// 	.withMessage("Moblie number must be a valid Bangladeshi number!")
	// 	.custom(async (value) => {
	// 		try {
	// 			const user = await User.findOne({ mobile: value });
	// 			if (user) {
	// 				throw createError("Mobile already is use!");
	// 			}
	// 		} catch (err) {
	// 			throw createError(err.message);
	// 		}
	// 	}),

	check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long!"),
];

const addUserValidationHandler = (req, res, next) => {
	const err = validationResult(req);
	const mappedErrors = err.mapped();
	if (Object.keys(mappedErrors).length === 0) {
		next();
	} else {
		// remove uploaded file
		if (req?.files?.length > 0) {
			const { filename } = req.files[0];
			unlink(path.join(__dirname, `/../public/uploads/avatar/${filename}`), (err) => {
				if (err) console.log(err);
			});
		}
		// response the errors
		res.status(404).json(
			getStandardResponse(false, "Failed to create user!", {
				errors: mappedErrors,
			})
		);
	}
};
module.exports = {
	addUserValidators,
	addUserValidationHandler,
};
