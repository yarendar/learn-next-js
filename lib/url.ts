import qs from "query-string";

interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

interface RemoveUrlQueryParams {
  params: string;
  keysToRemove: string[];
}

export const formUrlQuery = ({ params, key, value }: UrlQueryParams) => {
  const currentString = qs.parse(params);

  currentString[key] = value;

  return qs.stringifyUrl({
    url: window.location.pathname,
    query: currentString,
  });
};

export const removeKeysFromUrlQuery = ({
  params,
  keysToRemove,
}: RemoveUrlQueryParams) => {
  const currentString = qs.parse(params);

  keysToRemove.forEach((key) => delete currentString[key]);

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentString,
    },
    { skipNull: true },
  );
};
