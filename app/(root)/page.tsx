import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import LocalSearch from "@/components/search/LocalSearch";

interface SearchParams {
  searchParams: Promise<{ [key: string]: string }>;
}

const Home = async ({ searchParams }: SearchParams) => {
  const { query } = await searchParams;
  const questions = [
    {
      _id: "1",
      title: "How to learn React?",
      description: "I want to learn React. Can anyone help me?",
      tags: [
        { _id: "1", name: "React" },
        { _id: "2", name: "JavaScript" },
      ],
      author: {
        _id: "4",
        name: "John Doe",
      },
      createdAt: new Date(),
      upvotes: 10,
      answers: 5,
      views: 100,
    },
    {
      _id: "2",
      title: "How to learn javascript?",
      description: "I want to learn javascript. Can anyone help me?",
      tags: [{ _id: "2", name: "JavaScript" }],
      author: {
        _id: "4",
        name: "John Doe",
      },
      createdAt: new Date(),
      upvotes: 10,
      answers: 5,
      views: 100,
    },
  ];
  const filteredQuestions = questions.filter((question) =>
    question.title.toLowerCase().includes(query?.toLowerCase()),
  );

  return (
    <>
      <section className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All questions</h1>

        <Button
          className="primary-gradient min-h-[46px] px-4 py-3 !text-light-900"
          asChild
        >
          <Link href={ROUTES.ASK_QUESTION}>Ask a Question</Link>
        </Button>
      </section>
      <section className="mt-11">
        <LocalSearch
          route="/"
          imgSource="/icons/search.svg"
          placeholder="Search Questions..."
          otherClasses="flex-1"
        />
      </section>
      {/*HomeFilter*/}
      <div className="mt-10 flex w-full flex-col gap-6">
        {filteredQuestions.map((question) => (
          <h1 key={question._id}>{question.title}</h1>
        ))}
      </div>
    </>
  );
};

export default Home;
