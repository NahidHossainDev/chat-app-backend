const { check, validationResult } = require("express-validator");

const loginValidators = [
	check("username")
		.isLength({
			min: 1,
		})
		.withMessage("Mobile number or email is required"),
	check("password").isLength({ min: 1 }).withMessage("Password is required"),
];

const loginValidationHandler = function (req, res, next) {
	const errors = validationResult(req);
	const mappedErrors = errors.mapped();
	if (Object.keys(mappedErrors).length === 0) {
		next();
	} else {
		// response the errors
		res.status(404).json(
			getStandardResponse(false, "Failed to login!", {
				errors: mappedErrors,
			})
		);
	}
};

module.exports = {
	loginValidators,
	loginValidationHandler,
};
