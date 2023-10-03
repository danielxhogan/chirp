import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

function filterUserData(user: User) {
  return {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
  };
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const LIMIT = 100;

    const posts = await ctx.db.post.findMany({
      take: LIMIT,
    });

    const userId = posts.map((post) => post.userId);

    const users = (
      await clerkClient.users.getUserList({
        userId,
        limit: LIMIT,
      })
    ).map(filterUserData);

    return posts.map((post) => {
      const user = users.find((user) => user.id === post.userId);

      if (!user)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "user for post not found",
        });

      return {
        post,
        user,
      };
    });
  }),
});
