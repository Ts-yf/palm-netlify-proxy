import { Context } from "@netlify/edge-functions";

const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export default async (request: Request, context: Context) => {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = new URL(request.url);
  if(pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Google PaLM API proxy on Netlify Edge</title>
</head>
<body>
  <h1 id="google-palm-api-proxy-on-netlify-edge">Google PaLM API proxy on Netlify Edge</h1>
  <p>Tips: This project uses a reverse proxy to solve problems such as location restrictions in Google APIs. </p>
  <p>If you have any of the following requirements, you may need the support of this project.</p>
  <ol>
  <li>When you see the error message &quot;User location is not supported for the API use&quot; when calling the Google PaLM API</li>
  <li>You want to customize the Google PaLM API</li>
  </ol>
  <p>For technical discussions, please visit <a href="https://simonmy.com/posts/google-palm-api-proxy-on-netlify-edge.html">https://simonmy.com/posts/google-palm-api-proxy-on-netlify-edge.html</a></p>
</body>
</html>
    `
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html"
      },
    });
  }

  const url = new URL(pathname, "https://generativelanguage.googleapis.com");
  searchParams.delete("_path");

  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = pickHeaders(request.headers, ["content-type", "authorization", "x-goog-api-client", "x-goog-api-key", "accept-encoding"]);

  const response = await fetch(url, {
    body: request.body,
    method: request.method,
    headers,
    duplex: 'half'
  });

  const responseHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(response.headers),
  };

  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status
  });
};
