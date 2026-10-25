const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const useSecureCookies = process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https://")
const authCookieBaseOptions = {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: useSecureCookies ? "none" : "lax",
}
const authCookieOptions = {
  ...authCookieBaseOptions,
  maxAge: 24 * 60 * 60 * 1000,
}

/**
* @name registerUserController
* @description register a new user,expects username,email and password in the request body
* @access Public
*/

async function registerUserController(req, res) {
  const { password } = req.body;
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide username,email and password"
    })
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [
      { username },
      { email: new RegExp(`^${escapeRegex(email)}$`, "i") },
    ],
  })

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "An account already exists with this email or username. Sign in instead, or use different details."
    })
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await userModel.create({
    username,
    email,
    password: hash
  })

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )

  res.cookie("token", token, authCookieOptions)

  res.status(201).json({
    message: "User register succesfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

/**
 * @name loginUserController
 * @description login a user,expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res) {
  const email = req.body.email?.trim();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide email and password"
    })
  }

  const user = await userModel.findOne({
    email: new RegExp(`^${escapeRegex(email)}$`, "i"),
  })

  if (!user) {
    return res.status(400).json({
      message: "Invalid user or password"
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid Password"
    })
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )

  res.cookie("token", token, authCookieOptions)

  res.status(200).json({
    message: "User loggedIn Succesfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

/**
 * @name logoutUserController
 * @description logout a user
 * @access Public
 */

async function logoutUserController(req, res) {
  const token = req.cookies.token;

  if (token) {
    await tokenBlacklistModel.create({ token })
  }

  res.clearCookie("token", authCookieBaseOptions)

  res.status(200).json({
    message: "User logged out successfully"
  })
}

/**
 * @name getmeController
 * @description get user details
 * @access Public
 */

async function getmeController(req, res) {
  const user = await userModel.findById(req.user.id)

  res.status(200).json({
    message: "User details",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getmeController
}
