export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, message } = body as {
    projectId: string;
    message: string;
  };

  if (!projectId || !message) {
    return new Response("Missing projectId or message", { status: 400 });
  }

  return new Response("data: [DONE]\n\n", {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
