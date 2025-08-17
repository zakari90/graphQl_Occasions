import { UserInputError } from "apollo-server-core";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authResolvers = {
    Query: {
        // You can add authentication-related queries here if needed
    },

    Mutation: {
        createUser: async (_, args) => {
            try {
                const { username, email, password } = args.userInput;

                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    throw new UserInputError("User already exists", {
                        invalidArgs: email,
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 12);

                const user = new User({
                    username,
                    email,
                    password: hashedPassword,
                });

                await user.save();

                const userForToken = {
                    id: user._id,
                    email: user.email,
                };

                const token = jwt.sign(userForToken, process.env.JWT_SECRET);

                return {
                    userId: user._id,
                    token,
                    username: user.username,
                };
            } catch (error) {
                throw new UserInputError("Failed to create user", {
                    error: error.message,
                });
            }
        },

        login: async (_, args) => {
            try {
                const { email, password } = args;

                const user = await User.findOne({ email });
                if (!user) {
                    throw new UserInputError("User not found", {
                        invalidArgs: email,
                    });
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    throw new UserInputError("Invalid password", {
                        invalidArgs: password,
                    });
                }

                const userForToken = {
                    id: user._id,
                    email: user.email,
                };

                const token = jwt.sign(userForToken, process.env.JWT_SECRET);

                return {
                    userId: user._id,
                    token,
                    username: user.username,
                };
            } catch (error) {
                throw new UserInputError("Login failed", {
                    error: error.message,
                });
            }
        },
    },
};

export default authResolvers;
