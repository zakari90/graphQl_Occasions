import { UserInputError, AuthenticationError } from "apollo-server-core";
import { combineResolvers } from "graphql-resolvers";
import Event from "../models/event.js";
import isLoggedin from "../middlewares/isLogin.js";

const eventResolvers = {
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

        getUserEvents: combineResolvers(isLoggedin, async (_, { userId }, context) => {
            try {
                const effectiveUserId = userId || context.user._id;
                const events = await Event.find({ creator: effectiveUserId })
                    .populate("creator")
                    .lean();
                return events;
            } catch (error) {
                console.error("Error fetching user events:", error);
                throw new UserInputError("Failed to fetch user events", {
                    error: error.message,
                });
            }
        }),
    },

    Mutation: {
        createEvent: combineResolvers(isLoggedin, async (_, args, context) => {
            try {
                const { title, description, date, price } = args.eventInput;

                const existingEvent = await Event.findOne({ title });
                if (existingEvent) {
                    throw new UserInputError("Event already exists", {
                        invalidArgs: title,
                    });
                }

                const newEvent = new Event({
                    title,
                    description,
                    date,
                    price,
                    creator: context.user._id,
                });

                await newEvent.save();

                return newEvent;
            } catch (error) {
                console.error("Error in createEvent:", error);
                throw new UserInputError("Failed to create event", {
                    error: error.message,
                });
            }
        }),

        deleteEvent: combineResolvers(isLoggedin, async (_, { eventId }, context) => {
            try {
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
                console.log("Event deleted successfully: 🗑️", eventId);

                return events;
            } catch (error) {
                console.error("Error in deleteEvent:", error);
                throw new UserInputError("Failed to delete event", {
                    error: error.message,
                });
            }
        }),
    },
};

export default eventResolvers;
