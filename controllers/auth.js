require('dotenv').config()
let jwt = require('jsonwebtoken')
let db = require('../models')
let router = require('express').Router()

// POST /auth/login (find and validate user; send token)
router.post('/login', (req, res) => {
	// Find the user by their email in the database
	db.User.findOne({ email: req.body.email })
	.then(user => {
		// Make sure we have a user and that the user has a password
		if (!user || !user.password) {
			return res.status(404).send({ message: 'User not found' })
		}

		// Yay - we got a user. Let's check their password.
		if (!user.isAuthenticated(req.body.password)) {
			// Invalid credentials: wrong password
			return res.status(406).send({ message: 'Not Acceptable: Invalid Credentials!' })
		}

		let token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
			expiresIn: 60 * 60 // 1 hour in seconds
		})

		res.send( { token })
	})
	.catch(err => {
		// If something went wrong here, it's likely an issue with DB or DB setup. Or a typo.
		console.log('Error in POST /auth/login', err)
			res.status(503).send({ message: 'Something wrong, prob DB realted. Or you made a typo? One of those.'})
	})
})


// POST to /auth/signup (create user; generate token)
router.post('/signup', (req, res) => {
	db.User.findOne({ email: req.body.email })
	.then(user => {
		// If user exists, do not let them make a duplicate account
		if (user) {
			return res.status(409).send({ message: 'Email address in use' })
		}

		// Good - they don't exist yet
		db.User.create(req.body)
		.then(newUser => {
			// We createed a user, let's make them a shiny new token!
			let token = jwt.sign(newUser.toJSON(), process.env.JWT_SECRET, {
				expiresIn: 60 * 60 // 1 hour in seconds
			})

			res.send({ token })
		})
		.catch(err => {
			console.log('Error when creating new user', err)
			res.status(503).send({ message: 'Error creating user' })
		})
	})
	.catch(err => {
	console.log('Error in POST /auth/signup', err)
			res.status(503).send({ message: 'Something wrong, prob DB realted. Or you made a typo? One of those.'})
	})
})

// NOTE: User should be logged in to access this route (aka, this route should be protected)
router.get('/current/user', (req, res) => {
	res.send('STUB - Current User Data')
})

module.exports = router