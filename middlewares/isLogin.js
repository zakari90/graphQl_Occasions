import { AuthenticationError } from "apollo-server-core";


const isLoggeIn = (parent, args, context, info) => {
  console.log("🔥 isLoggedin middleware hit. Context user:", context.user);

  if (!context.user) {
    console.log("❌ Not authenticated");
        throw new AuthenticationError("Not authenticated");
    }
    return true;
    }
export default isLoggeIn;