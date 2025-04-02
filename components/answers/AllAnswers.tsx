import React from "react";
import DataRenderer from "@/components/DataRenderer";
import { EMPTY_ANSWERS } from "@/constants/states";
import AnswerCard from "@/components/cards/AnswerCard";
import CommonFilter from "@/components/filters/CommonFilter";
import { AnswerFilters } from "@/constants/filters";
import Pagination from "@/components/Pagination";

interface Props extends ActionResponse<Answer[]> {
  page: number;
  isNext: boolean;
  totalAnswers: number;
}

const AllAnswers = ({ page, isNext, data, success, totalAnswers }: Props) => {
  return (
    <div className="mt-11">
      <div className="flex items-center justify-between">
        <h3 className="primary-text-gradient">
          {totalAnswers} {totalAnswers === 1 ? "Answer" : "Answers"}
        </h3>

        <CommonFilter
          filters={AnswerFilters}
          otherClasses="sm:min-w-32"
          containerClasses="max-sm:w-full"
        />
      </div>

      <DataRenderer
        success={success}
        data={data}
        empty={EMPTY_ANSWERS}
        render={(answers: Answer[]) =>
          answers.map((answer) => <AnswerCard key={answer._id} {...answer} />)
        }
      />

      <Pagination page={page} isNext={isNext || false} />
    </div>
  );
};

export default AllAnswers;
