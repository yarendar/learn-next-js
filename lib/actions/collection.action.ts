"use server";

import action from "@/lib/handlers/action";
import {
  CollectionBaseSchema,
  PaginateSearchParamsSchema,
} from "@/lib/validations";
import handleError from "@/lib/handlers/error";
import { Collection, Question } from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import mongoose, { PipelineStage } from "mongoose";
import { q } from "@codemirror/legacy-modes/mode/q";

export async function toggleSaveQuestion(
  params: CollectionBaseParams,
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationParams = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationParams instanceof Error) {
    return handleError(validationParams) as ErrorResponse;
  }

  const { questionId } = validationParams.params!;
  const userId = validationParams.session?.user?.id;

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question does not exist");
    }

    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    });

    if (collection) {
      await Collection.findOneAndDelete(collection._id);

      revalidatePath(ROUTES.QUESTION(questionId));

      return { success: true, data: { saved: false } };
    }

    await Collection.create({
      question: questionId,
      author: userId,
    });

    revalidatePath(ROUTES.QUESTION(questionId));

    return { success: true, data: { saved: true } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function hasSaveQuestion(
  params: CollectionBaseParams,
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationParams = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationParams instanceof Error) {
    return handleError(validationParams) as ErrorResponse;
  }

  const { questionId } = validationParams.params!;
  const userId = validationParams.session?.user?.id;

  try {
    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    });

    return { success: true, data: { saved: !!collection } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getSavedQuestions(
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ collection: Collection[]; isNext: boolean }>> {
  const validationParams = await action({
    params,
    schema: PaginateSearchParamsSchema,
    authorize: true,
  });

  if (validationParams instanceof Error) {
    return handleError(validationParams) as ErrorResponse;
  }

  const userId = validationParams.session?.user?.id;
  const { page = 1, pageSize = 10, query, filter } = params;

  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    mostrecent: { "question.createdAt": -1 },
    oldest: { "question.createdAt": 1 },
    mostvoted: { "question.upvotes": -1 },
    mostviewed: { "question.views": -1 },
    mostanswered: { "question.answers": -1 },
  };

  const sortCriteria = sortOptions[filter as keyof typeof sortOptions] || {
    "question.createdAt": -1,
  };

  try {
    const pipeline: PipelineStage[] = [
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "questions",
          localField: "question",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $lookup: {
          from: "users",
          localField: "question.author",
          foreignField: "_id",
          as: "question.author",
        },
      },
      { $unwind: "$question.author" },
      {
        $lookup: {
          from: "tags",
          localField: "question.tags",
          foreignField: "_id",
          as: "question.tags",
        },
      },
    ];

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            {
              "question.title": {
                $regex: query,
                $options: "i",
              },
              "question.content": {
                $regex: query,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    const [totalCount] = await Collection.aggregate([
      ...pipeline,
      { $count: "count" },
    ]);

    pipeline.push({ $sort: sortCriteria }, { $skip: skip }, { $limit: limit });
    pipeline.push({ $project: { question: 1, author: 1 } });
    const questions = await Collection.aggregate(pipeline);

    const isNext = totalCount.count > skip + questions.length;

    return {
      success: true,
      data: {
        collection: JSON.parse(JSON.stringify(questions)),
        isNext,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
