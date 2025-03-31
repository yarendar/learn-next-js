import React from "react";
import { RouteParams, Tag } from "@/types/global";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import Metric from "@/components/Metric";
import { formatNumber, getTimestamp } from "@/lib/utils";
import TagCard from "@/components/cards/TagCard";
import Preview from "@/components/editor/Preview";
import { getQuestion, incrementViews } from "@/lib/actions/queston.action";
import { redirect } from "next/navigation";
import { after } from "next/server";
import AnswerForm from "@/components/forms/AnswerForm";
import { getAnswers } from "@/lib/actions/answer.action";
import AllAnswers from "@/components/answers/AllAnswers";
import Votes from "@/components/votes/Votes";

const QuestionDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const { success, data: question } = await getQuestion({ questionId: id });

  if (!success || !question) {
    return redirect("/404");
  }

  const {
    success: areAnswersLoaded,
    data: answersResult,
    error: answersError,
  } = await getAnswers({
    questionId: id,
    page: 1,
    pageSize: 10,
    filter: "latest",
  });

  after(async () => {
    await incrementViews({ questionId: id });
  });

  const { author, createdAt, answers, views, tags, content } = question;
  return (
    <>
      <div className="flex-start w-full flex-col">
        <div className="flex w-full flex-col-reverse justify-between">
          <div className="flex items-center justify-start gap-1">
            <UserAvatar
              id={author._id}
              name={author.name}
              className="size-[22px]"
              fallbackClassName="text-[10px]"
            />

            <Link href={ROUTES.PROFILE(author._id)}>
              <p className="paragraph-semibold text-dark300_light700">
                {author.name}
              </p>
            </Link>
          </div>

          <div className="flex justify-end">
            <Votes
              upvotes={question.upvotes}
              hasupVoted={true}
              downvotes={question.downvotes}
              hasdownVoted={true}
            />
          </div>
        </div>

        <h2 className="h2-semibold text-dark200_light900 mt-3.5 w-full">
          {question.title}
        </h2>
      </div>

      <div className="mb-8 mt-5 flex flex-wrap gap-4">
        <Metric
          imgUrl={"/icons/clock.svg"}
          alt="clock icon"
          title={""}
          value={` asked ${getTimestamp(new Date(createdAt))}`}
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl={"/icons/message.svg"}
          alt="message icon"
          title={""}
          value={answers}
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl={"/icons/eye.svg"}
          alt="eye icon"
          title={""}
          value={formatNumber(views)}
          textStyles="small-regular text-dark400_light700"
        />
      </div>

      <Preview content={content} />

      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <TagCard key={tag._id} _id={tag._id} name={tag.name} compact />
        ))}
      </div>

      <section className="my-5">
        <AllAnswers
          data={answersResult?.answers}
          success={areAnswersLoaded}
          error={answersError}
          totalAnswers={answersResult?.totalAnswers || 0}
        />
      </section>

      <section className="my-5">
        <AnswerForm
          questionId={question._id}
          questionTitle={question.title}
          questionContent={question.content}
        />
      </section>
    </>
  );
};

export default QuestionDetails;
