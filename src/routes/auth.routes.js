const {Router}=require('express')
const authController=require("../controllers/auth.controller")

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


module.exports=authRouter;