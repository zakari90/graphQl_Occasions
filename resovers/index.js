import { UserInputError, AuthenticationError } from "apollo-server-core";
import User from "../models/user.js";
import Event from "../models/event.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Booking from "../models/booking.js";
import booking from "../models/booking.js";

const resolvers = {
  Query: {
    events: async () => {
      try {
        const events = await Event.find().populate("creator").lean();
        return events;
      } catch (error) {
        console.error("Error fetching events:", error);
        throw new UserInputError("Failed to fetch events", {
          error: error.message,
        });
      }
    },

    getUserEvents: async (_, { userId }, context) => {
      try {
        const effectiveUserId = userId || context.user?._id;

        if (!effectiveUserId) {
          throw new AuthenticationError("User ID is required or user must be authenticated.");
        }

        const events = await Event.find({ creator: effectiveUserId }).populate("creator").lean();
        return events;
      } catch (error) {
        console.error("Error fetching user events:", error);
        throw new UserInputError("Failed to fetch user events", {
          error: error.message,
        });
      }
    },
    bookings: async (_, __, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }

        const bookings = await Booking.find({ user: context.user._id })
          .populate("event") // Populate the event details
          .populate("user") // Populate the user details
          .sort({ createdAt: -1 }) // Sort by creation date, most recent first
          .lean();//lean is for better performance

        return bookings;
      } catch (error) {
        console.error("Error fetching bookings:", error);
        throw new UserInputError("Failed to fetch bookings", {
          error: error.message,
        });
      }
    }
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
        console.error("Error in createUser:", error);
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

        console.log("User logged in successfully:", user);

        return {
          userId: user._id,
          token,
          username: user.username,
        };
      } catch (error) {
        console.error("Error in login:", error);
        throw new UserInputError("Login failed", {
          error: error.message,
        });
      }
    },

    createEvent: async (_, args, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }

        const { title, description, date, price } = args.eventInput;

        const existingEvent = await Event.findOne({ title });
        if (existingEvent) {
          throw new UserInputError("Event already exists", {
            invalidArgs: title,
          });
        }
        const event = {
          title,
          description,
          date,
          price,
          creator: context.user._id,
        };

        const newEvent = new Event(event);
        await newEvent.save();

        return newEvent; 
      } catch (error) {
        console.error("Error in createEvent:", error);
        throw new UserInputError("Failed to create event", {
          error: error.message,
        });
      }
    },

    deleteEvent: async (_, { eventId }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError("Not authenticated");
        }

        const event = await Event.findById(eventId).populate("creator");

        if (!event) {
          throw new UserInputError("Event not found", {
            invalidArgs: eventId,
          });
        }

        if (event.creator._id.toString() !== context.user._id.toString()) {
          throw new AuthenticationError("Not authorized to delete this event");
        }

        await Event.deleteOne({ _id: eventId });

        const events = await Event.find().populate("creator").lean();
        console.log("Event deleted successfully: 🗑️  🗑️  🗑️ 🗑️  🗑️", eventId);

        return events;
      } catch (error) {
        console.error("Error in deleteEvent:", error);
        throw new UserInputError("Failed to delete event", {
          error: error.message,
        });
      }
    },

    bookEvent: async (_, { eventId }, context) => {
    try {
        if (!context.user) {
        throw new AuthenticationError("Not authenticated");
        }

        const event = await Event.findById(eventId);
        if (!event) {
        throw new UserInputError("Event not found", {
            invalidArgs: eventId,
        });
        }

        const user = context.user;

        // Check if user already booked the event
        const userBookedEvent = await Booking.findOne({
        event: eventId,
        user: user._id,
        });

        if (userBookedEvent) {
            throw new UserInputError("you have already booked this event" )      
        }

        const booking = new Booking({
        event: event._id,
        user: user._id,
        });

        await booking.save();
        console.log("Event booked successfully: 📅 📅 📅 📅 📅", booking._id);
        return booking;

    } catch (error) {
        console.log("Error booking event:", error);
        throw new UserInputError("Failed to book event", {
        error: error.message,
        });
    }
    },
    cancelBooking: async (_, { bookingId }, context) => {
    try {
        if (!context.user) {
        throw new AuthenticationError("Not authenticated");
        }

        const booking = await Booking.findById(bookingId).populate("event");
        if (!booking) {
            throw new UserInputError("Booking not found");
        }
        const event = booking?.event;

        await Booking.deleteOne({ _id: bookingId });

        return event;

    } catch (error) {
        console.log("Error cancelling booking:", error);
        throw new UserInputError("Failed to cancel booking", {
        error: error.message,
        });
    }
    }


    } ,
};

export default resolvers;
