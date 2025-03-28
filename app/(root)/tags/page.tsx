import React from "react";
import { getTags } from "@/lib/actions/tag.action";

const Tags = async () => {
  const { data } = await getTags({
    page: 2,
    pageSize: 2,
  });

  const { tags } = data || [];

  console.log("tags", JSON.stringify(tags, null, 2));

  return <div>Tags</div>;
};

export default Tags;
