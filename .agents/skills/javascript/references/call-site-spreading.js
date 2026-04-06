const func = ({
  method = "GET",
  cache = "default",
  headers = {},
  authenticated = false,
} = {}) => {
  const requestHeaders = { ...headers };

  if (authenticated) {
    requestHeaders.authorization = "Bearer <token>";
  }

  return {
    method,
    cache,
    headers: requestHeaders,
  };
};

const funcModified = ({ cache } = {}) => func({ cache });

export const bad = { ...func(), cache: "no-store" };

export const good = funcModified({ cache: "no-store" });
