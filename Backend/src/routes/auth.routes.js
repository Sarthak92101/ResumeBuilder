const {Router}=require('express')
const authController=require("../controllers/auth.controller")
const authMiddleware=require("../middlewares/auth.middleware")

const authRouter= Router()

/**
 * @routes POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register",authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public api
 */

authRouter.post("/login",authController.loginUserController)

/**
 * @route GET/api/auth/logout
 * @description Clear token from cookie and add token in blacklist
 * @access Public 
 */

authRouter.get("/logout",authController.logoutUserController)


/**
 * @route GET/api/auth/me
 * @description Get user details
 * @access Private
 */
authRouter.get("/me",authMiddleware.authUser,authController.getmeController)


module.exports=authRouter;