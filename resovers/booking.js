import { UserInputError, AuthenticationError } from "apollo-server-core";
import { combineResolvers } from "graphql-resolvers";
import Booking from "../models/booking.js";
import Event from "../models/event.js";
import isLoggedin from "../middlewares/isLogin.js";

const bookingResolvers = {
    Query: {
        bookings: combineResolvers(isLoggedin, async (_, __, context) => {
            try {
                const bookings = await Booking.find({ user: context.user._id })
                    .populate("event")
                    .populate("user")
                    .sort({ createdAt: -1 })
                    .lean();
                return bookings;
            } catch (error) {
                console.error("Error fetching bookings:", error);
                throw new UserInputError("Failed to fetch bookings", {
                    error: error.message,
                });
            }
        }),
    },

    Mutation: {
        bookEvent: combineResolvers(isLoggedin, async (_, { eventId }, context) => {
            try {
                const event = await Event.findById(eventId);
                if (!event) {
                    throw new UserInputError("Event not found", {
                        invalidArgs: eventId,
                    });
                }

                const existingBooking = await Booking.findOne({
                    event: eventId,
                    user: context.user._id,
                });

                if (existingBooking) {
                    throw new UserInputError("You have already booked this event");
                }

                const booking = new Booking({
                    event: event._id,
                    user: context.user._id,
                });

                await booking.save();
                console.log("Event booked successfully: 📅", booking._id);

                return booking;
            } catch (error) {
                console.error("Error booking event:", error);
                throw new UserInputError("Failed to book event", {
                    error: error.message,
                });
            }
        }),

        cancelBooking: combineResolvers(isLoggedin, async (_, { bookingId }, context) => {
            try {
                const booking = await Booking.findById(bookingId).populate("event");
                if (!booking) {
                    throw new UserInputError("Booking not found");
                }

                if (booking.user.toString() !== context.user._id.toString()) {
                    throw new AuthenticationError("Not authorized to cancel this booking");
                }

                const event = booking.event;
                await Booking.deleteOne({ _id: bookingId });

                return event;
            } catch (error) {
                console.error("Error cancelling booking:", error);
                throw new UserInputError("Failed to cancel booking", {
                    error: error.message,
                });
            }
        }),
    },
};

export default bookingResolvers;
