"use server";

import { CreateVoteParams, UpdateVoteCountParams } from "@/types/action";
import { ActionResponse } from "@/types/global";
import action from "@/lib/handlers/action";
import { CreateVoteSchema, UpdateVoteCountSchema } from "@/lib/validations";
import handleError from "@/lib/handlers/error";
import mongoose, { ClientSession } from "mongoose";
import { Answer, Question, Vote } from "@/database";

export async function updateVoteCount(
  params: UpdateVoteCountParams,
  session?: ClientSession,
): Promise<ActionResponse> {
  const validationParams = await action({
    params,
    schema: UpdateVoteCountSchema,
  });

  if (validationParams instanceof Error) {
    return handleError(validationParams) as ActionResponse;
  }

  const { targetId, targetType, voteType, change } = validationParams.params!;

  const Model = targetType === "question" ? Question : Answer;
  const voteField = voteType === "upvote" ? "upvotes" : "downvotes";

  try {
    const result = Model.findByIdAndUpdate(
      targetId,
      {
        $inc: { [voteField]: change },
      },
      { new: true, session },
    );

    if (!result) {
      return handleError(
        new Error("Failed to update vote count"),
      ) as ActionResponse;
    }

    return { success: true };
  } catch (error) {
    return handleError(error) as ActionResponse;
  }
}

export async function createVote(
  params: CreateVoteParams,
): Promise<ActionResponse> {
  const validationParams = await action({
    params,
    schema: CreateVoteSchema,
    authorize: true,
  });

  if (validationParams instanceof Error) {
    return handleError(validationParams) as ActionResponse;
  }

  const { targetId, targetType, voteType } = validationParams.params!;
  const userId = validationParams.session?.user?.id;

  if (!userId) {
    return handleError(new Error("Unauthorized")) as ActionResponse;
  }

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const existingVote = await Vote.findOne({
      author: userId,
      actionId: targetId,
      actionType: targetType,
    }).session(session);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await Vote.deleteOne({ _id: existingVote._id }).session(session);

        await updateVoteCount(
          { targetId, targetType, voteType, change: -1 },
          session,
        );
      } else {
        await Vote.findByIdAndUpdate(
          existingVote._id,
          { voteType },
          { new: true, session },
        );

        await updateVoteCount(
          { targetId, targetType, voteType, change: 1 },
          session,
        );
      }
    } else {
      await Vote.create([{ targetId, targetType, voteType, change: 1 }], {
        session,
      });

      await updateVoteCount(
        { targetId, targetType, voteType, change: 1 },
        session,
      );
    }

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return handleError(error) as ActionResponse;
  }
}
