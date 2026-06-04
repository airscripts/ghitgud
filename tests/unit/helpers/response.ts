function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

function binaryResponse(data: string): Response {
  return new Response(Buffer.from(data), { status: 200 });
}

export { binaryResponse, emptyResponse, jsonResponse };
