import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const { httpMethod, body, queryStringParameters, headers } = event;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello from Netlify Functions!",
        httpMethod,
        queryParams: queryStringParameters,
        ...(body && { body: JSON.parse(body) }),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}; 